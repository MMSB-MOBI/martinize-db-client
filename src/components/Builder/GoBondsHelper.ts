import ItpFile from 'itp-parser';
import ReversibleKeyMap from 'reversible-key-map';
import { ElasticOrGoBounds } from '../../StashedBuildHelper';
import NglWrapper, { NglComponent, NglRepresentation } from './NglWrapper';
import { BufferRepresentation } from '@mmsb/ngl';
import { RepresentationParameters } from '@mmsb/ngl/declarations/representation/representation';
import * as ngl from '@mmsb/ngl';

type GoAtomName = string;
type GoRelations = ReversibleKeyMap<GoAtomName, GoAtomName, string>;
type IndexToName = { [index: number]: string };
type NameToIndex = { [name: string]: number };
type IndexToReal = { [index: number]: number };
type RealToIndex = { [index: number]: number };
type AtomCoordinates = [number, number, number];

export interface GoBondsHelperJSON {
  real_to_index: RealToIndex;
  name_to_index: NameToIndex;
  relations: [[GoAtomName, GoAtomName], string][];
}

export class BondsRepresentation {
  static readonly V_BONDS_DEFAULT_COLOR = new ngl.Color(0, 255, 0);
  static readonly V_BONDS_HIGHLIGHT_COLOR = new ngl.Color(1, .1, .1);

  protected virtual_links_cmpt?: NglComponent;
  protected virtual_links_repr?: NglRepresentation<BufferRepresentation>;
  protected coordinates: AtomCoordinates[] = [];
  public bonds: ElasticOrGoBounds[] = []; 

  constructor(public readonly stage: NglWrapper) {}

  /* REPRESENTATION */
  
  set(parameters: Partial<RepresentationParameters>) {
    if (this.virtual_links_repr)
      this.virtual_links_repr.set(parameters);
  }

  get visible() {
    if (!this.virtual_links_repr) 
      return false;
    return this.virtual_links_repr.visible;
  }

  set visible(v: boolean) {
    if (this.virtual_links_repr)
      this.virtual_links_repr.visible = v;
  }

  /* COORDINATES */

  registerCoords(coordinates: AtomCoordinates[]) {
    this.coordinates = coordinates;
  }


  protected cleanStage() {
    if (this.virtual_links_cmpt)
      this.stage.remove(this.virtual_links_cmpt);

    this.virtual_links_cmpt = undefined;
    this.virtual_links_repr = undefined;
  }

  render(
    mode: 'elastic' | 'go' = 'elastic', 
    bonds = this.bonds, 
    opacity = .2, 
    hightlight_predicate?: (atom1_index: number, atom2_index: number) => boolean
  ) {
    this.bonds = bonds;
    const coords = this.coordinates;

    const shape = new ngl.Shape("add-bonds");
    const upper_mode = mode.toLocaleUpperCase();
    
    for (const [atom1_index, atom2_index] of bonds) {
      // atom index starts at 1, atom array stats to 0
      const atom1 = coords[atom1_index - 1];
      const atom2 = coords[atom2_index - 1];
      
      if (!atom1 || !atom2) {
        console.warn("Not found atom", atom1_index, atom2_index, coords);
        continue;
      }
      
      const name = `[${upper_mode}] Bond w/ atoms ${atom1_index}-${atom2_index}`;
      if (hightlight_predicate && hightlight_predicate(atom1_index, atom2_index)) {
        shape.addCylinder(atom1, atom2, BondsRepresentation.V_BONDS_HIGHLIGHT_COLOR, .1, name);
        continue;
      }

      shape.addCylinder(atom1, atom2, BondsRepresentation.V_BONDS_DEFAULT_COLOR, .1, name);
    }

    this.cleanStage();
    const component = this.stage.add(shape);
    const representation = component.add<ngl.BufferRepresentation>('buffer', { opacity });

    this.virtual_links_cmpt = component;
    this.virtual_links_repr = representation;
  }
}

/**
 * Handle boilerplate for Go bond creation, removal and sync modifications with ITP files.
 */
export default class GoBondsHelper {
  /**
   * VAtom 1 <> VAtom 2: ITP line
   */
  protected relations: GoRelations = new ReversibleKeyMap();
  public readonly representation: BondsRepresentation;

  protected history: GoRelations[] = [];
  protected reverse_history: GoRelations[] = [];

  /** Define the constructor as protected */
  protected constructor(
    stage: NglWrapper,
    protected index_to_real: IndexToReal = {},
    protected name_to_index: NameToIndex = {},
    protected index_to_name: IndexToName = {},
    protected real_to_index: RealToIndex = {}
  ) {
    this.representation = new BondsRepresentation(stage);
  }

  /** Access the computed bonds. */
  get bonds() : ElasticOrGoBounds[] {
    const bonds: ElasticOrGoBounds[] = [];

    for (const [atom1_name, atom2_name] of this.relations.keysCouples()) {
      const real1 = this.goNameToRealIndex(atom1_name), real2 = this.goNameToRealIndex(atom2_name);

      if (real1 !== undefined && real2 !== undefined) {
        bonds.push([real1, real2]);
      }
    }

    return bonds;
  }

  /** Get bonds related to an go atom. */
  findBondsOf(atom_name: GoAtomName) {
    const keys = this.relations.getAllFrom(atom_name)?.keys();
    return keys ? [...keys] : [];
  }

  render(opacity = .2, hightlight_predicate?: (atom1_index: number, atom2_index: number) => boolean) {
    return this.representation.render(
      'go',
      this.bonds,
      opacity,
      hightlight_predicate,
    );
  }

  /* GO ACCESSORS */
  
  goIndexToGoName(index: number) {
    return this.index_to_name[index];
  }

  goIndexToRealIndex(index: number) {
    return this.index_to_real[index];
  }

  goNameToGoIndex(name: GoAtomName) {
    return this.name_to_index[name];
  }

  goNameToRealIndex(name: GoAtomName) {
    return this.goIndexToRealIndex(this.goNameToGoIndex(name));
  }

  realIndexToGoIndex(index: number) {
    return this.real_to_index[index];
  }

  realIndexToGoName(index: number) {
    return this.goIndexToGoName(this.realIndexToGoIndex(index));
  }


  /* OPERATIONS INSIDE THE OBJECT */

  /**
   * Create a new go bonds set through a filter.
   */
  filter(predicate: (atom1: GoAtomName, atom2: GoAtomName, line: string) => boolean) {
    const new_map: GoRelations = new ReversibleKeyMap();

    for (const [keys, value] of this.relations) {
      if (predicate(keys[0], keys[1], value)) {
        new_map.set(keys[0], keys[1], value);
      }
    }

    // Create a copy of current object
    const new_one = new GoBondsHelper(
      this.representation.stage,
      this.index_to_real,
      this.name_to_index,
      this.index_to_name,
      this.real_to_index,
    );

    // @ts-ignore
    new_one.representation = this.representation;

    new_one.relations = new_map;

    return new_one;
  }

  /**
   * Modify the actual object through a filter.
   */
  filterSelf(predicate: (atom1: GoAtomName, atom2: GoAtomName, line: string) => boolean) {
    const new_one = this.filter(predicate);
    this.relations = new_one.relations;

    return this;
  }

  /**
   * Add a new line inside the ITP.
   */
  add(line: string): this;
  add(atom1: GoAtomName, atom2: GoAtomName, line: string): this;
  add(atom1_or_line: GoAtomName | string, atom2?: GoAtomName, line?: string) {
    if (atom2 === undefined || line === undefined) {
      // atom1 is a full line
      const [name1, name2, ] = atom1_or_line.split(ItpFile.BLANK_REGEX).filter(e => e);

      if (name1 !== name2)
        this.relations.set(name1, name2, atom1_or_line);
    }
    else {
      if (atom1_or_line !== atom2)
        this.relations.set(atom1_or_line, atom2, line);
    }

    return this;
  }

  /**
   * Test if bond {atom1}<>{atom2} exists.
   */
  has(atom1: GoAtomName, atom2: GoAtomName) {
    return this.relations.hasCouple(atom1, atom2);
  }

  remove(from_atom: GoAtomName): this;
  remove(atom1: GoAtomName, atom2: GoAtomName): this;
  remove(atom1: GoAtomName, atom2?: GoAtomName) {
    if (atom2 === undefined) {
      this.relations.deleteAllFrom(atom1);
    }
    else {
      this.relations.delete(atom1, atom2);
    }

    return this;
  }

  createFakeLine(atom1: GoAtomName, atom2: GoAtomName) {
    return `${atom1}    ${atom2}    1  0.7923518221  9.4140000000`;
  }

  
  /* ITERATION OF BONDS */

  *[Symbol.iterator]() {
    for (const [keys, line] of this.relations) {
      yield [keys[0], keys[1], line] as const;
    }
  }


  /* COMPUTED ITP FILES */

  /**
   * Try to rebuild the original files with their original names.
   * Index is always the last file of the array.
   */
  toOriginalFiles() {
    // Try to reconstruct the original files based on go atom names.
    const files: { [molecule_name: string]: string } = {};

    for (const [name1, , line] of this) {
      const mol_type_arr = /^(\w+)_\d+$/.exec(name1);

      if (!mol_type_arr) {
        continue;
      }

      const type = mol_type_arr[1];
      if (type in files) {
        files[type] += line + '\n';
      }
      else {
        files[type] = line + '\n';
      }
    }

    // Generate the index and files
    const index_filename = 'go-table_VirtGoSites.itp';
    const suffix = '_go-table_VirtGoSites.itp';
    let index = '';

    const files_as_file: File[] = [];

    for (const type in files) {
      files_as_file.push(new File([files[type]], type + suffix, { type: 'chemical/x-include-topology' }));

      index += `#include "${type + suffix}"\n`;
    }

    files_as_file.push(new File([index], index_filename, { type: 'chemical/x-include-topology' }));

    return files_as_file;
  }

  /**
   * Get the compiled go bonds inside a single ITP, plus the index.
   */
  toCompiledFiles() {
    const compiled_filename = "compiled__go-table_VirtGoSites.itp";
    const index_filename = "go-table_VirtGoSites.itp";

    const go_table_index = new File([this.toIndexString(compiled_filename)], index_filename, { type: 'chemical/x-include-topology' });
    const compiled_itp = new File([this.toString()], compiled_filename, { type: 'chemical/x-include-topology' });

    return {
      index: go_table_index,
      itp: compiled_itp,
    };
  }

  toIndexString(name = "compiled__go-table_VirtGoSites.itp") {
    return `#include "${name}"\n`;
  }

  toString() {
    let res_str = "";

    for (const line of this.relations.values()) {
      res_str += line + "\n";
    }

    return res_str;
  }

  /* SERIALIZATION */

  toJSON() : GoBondsHelperJSON {
    return {
      real_to_index: this.real_to_index,
      name_to_index: this.name_to_index,
      relations: [...this.relations.entries()],
    };
  }

  clone() {
    const clone = GoBondsHelper.fromJSON(this.representation.stage, this.toJSON());
    // @ts-ignore
    clone.representation = this.representation;
    
    return clone;
  }


  /* HISTORY */

  /** Save the current state in the history. */
  historyPush() {
    this.history.push(new ReversibleKeyMap(this.relations.entries()));
    this.reverse_history = [];
  }

  historyRevert() {
    const last = this.reverse_history.pop();

    if (last) {
      this.history.push(this.relations);
      this.relations = last;
    }
  }

  /** Loose the current state and load the last saved state in the history. If the history is empty, nothing happend. */
  historyBack() {
    const last = this.history.pop();

    if (last) {
      // Save this.relations in reverse history
      this.reverse_history.push(this.relations);

      // Overwrite current relations
      this.relations = last;
    }
  }

  /** Clear history. */
  historyClear() {
    this.history = [];
    this.reverse_history = [];
  }

  /** Number of saved states. When `.history_length === 0`, `.historyBack()` does nothing. */
  get history_length() {
    return this.history.length;
  }
  
  /** Number of reverse-saved states. When `.history_length === 0`, `.historyRevert()` does nothing. */
  get reverse_history_length() {
    return this.reverse_history.length;
  }


  /* STATIC CONSTRUCTORS */

  /**
   * Construct a GoBondsHelper from a save made with `instance.toJSON()`.
   */
  static fromJSON(stage: NglWrapper, data: GoBondsHelperJSON) {
    const index_to_name: IndexToName = {};
    const index_to_real: IndexToReal = {};

    // Create the non saved properties
    for (const prop in data.name_to_index) {
      index_to_name[data.name_to_index[prop]] = prop;
    }
    for (const prop in data.real_to_index) {
      index_to_real[data.real_to_index[prop]] = Number(prop);
    }

    const obj = new GoBondsHelper(
      stage,
      index_to_real,
      data.name_to_index,
      index_to_name,
      data.real_to_index
    );
    obj.relations = new ReversibleKeyMap(data.relations);

    return obj;
  }

  /**
   * Do it with the original go table only !
   * This will not work with the modified itp files producted by this object.
   */
  static async readFromItps(stage: NglWrapper, itp_files: File[]) {
    const bonds = new GoBondsHelper(stage);

    const index = itp_files.find(e => e.name === "go-table_VirtGoSites.itp");
    if (!index) {
      throw new Error("Need the go-table_VirtGoSites.itp file.");
    }
    
    const index_itp = await ItpFile.read(index);

    // Iterate over the included files
    // And compute the itps.
    let i = 0;
    for (const include of index_itp.included_files) {
      const molecule_type = include.split('_go-table_VirtGoSites.itp')[0];

      const molecule_file = itp_files.find(e => e.name === molecule_type + '.itp');
      const table_file = itp_files.find(e => e.name === include);
      if (!molecule_file || !table_file) {
        throw new Error(`File ${molecule_file} or file ${table_file} not found.`);
      }

      // Read molecule ITP
      const molecule = await ItpFile.read(molecule_file);

      // Count all atoms, used to increment atom counter at the end of loop
      const all_atom_count = molecule.atoms.filter(line => line && !line.startsWith(';')).length;

      const prefix = molecule_type + '_';

      // Step 1: Find atoms that name start by "{molecule_type}_" in category "atoms"
      for (const atom_line of molecule.atoms) {
        // Typical line is : 
        // 2575 molecule_0_9       9 LYS CA  2575    0 

        const [index, name, ] = atom_line.split(ItpFile.BLANK_REGEX);

        if (name.startsWith(prefix)) {
          const index_corrected = Number(index) + i;

          // There is never collision in names, because all molecules are unique and names starts with {molecule_type}_
          bonds.name_to_index[name] = index_corrected;
          bonds.index_to_name[index_corrected] = name;
        }
      }

      // Step 2: Associate go atom index => real atom index
      let seen_virt_comment = false;

      for (const virt_line of molecule.virtual_sites) {
        if (virt_line.startsWith('; Virtual go site')) {
          seen_virt_comment = true;
          continue;
        }

        if (!seen_virt_comment) {
          continue;
        }

        // Typical line is: 
        // 2575 1    1
        const [go_index, , real_index] = virt_line.split(ItpFile.BLANK_REGEX);
        const go_index_corrected = Number(go_index) + i;
        const real_index_corrected = Number(real_index) + i;

        bonds.index_to_real[go_index_corrected] = real_index_corrected;
        bonds.real_to_index[real_index_corrected] = go_index_corrected;
      }

      // Clean the ITP (we don't need it anymore)
      molecule.dispose();

      // Read the go table ITP
      const table = await ItpFile.read(table_file);

      console.log(`[GO-VIRT-SITES] [${molecule_type}] Atom bonds described: ${table.headlines.length - 2}.`);

      // Step 3+4: Read bonds between go atoms and associate them

      for (const line of table.headlines) {
        if (line.startsWith(';')) {
          continue;
        }

        // Typical line is (may begin by spaces.)
        // molecule_0_9  molecule_0_14    1  0.7369739126  9.4140000000  ;  24  36  0.827 

        // filter trim blank spaces created by regex
        const [name1, name2, ] = line.split(ItpFile.BLANK_REGEX).filter(e => e);

        const go_index_1 = bonds.goNameToGoIndex(name1), go_index_2 = bonds.goNameToGoIndex(name2);

        if (go_index_1 === undefined || go_index_2 === undefined) {
          console.warn(`[GO-VIRT-SITES] [${molecule_type}] Undefined go indexes for names ${name1}-${name2}. This should not happen...`);
          continue;
        }

        const real_index_1 = bonds.goIndexToRealIndex(go_index_1), real_index_2 = bonds.goIndexToRealIndex(go_index_2);

        if (real_index_1 === undefined || real_index_2 === undefined) {
          console.warn(`[GO-VIRT-SITES] [${molecule_type}] Undefined real indexes for names ${name1}(${go_index_1})-${name2}(${go_index_2}). This should not happen...`);
          continue;
        }

        // We add the bonds in the object
        bonds.add(name1, name2, line);
      }
      // Increment i by number of atoms
      i += all_atom_count;
    }

    return bonds;
  }
}
