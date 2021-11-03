import ItpFile from 'itp-parser-forked';
import ReversibleKeyMap from 'reversible-key-map';
import { ElasticOrGoBounds } from '../../StashedBuildHelper';
import NglWrapper, { NglComponent, NglRepresentation } from './NglWrapper';
import BaseBondsHelper, { BaseBondsHelperJSON, Relations } from './BaseBondsHelper';

type GoAtomName = string;
//type GoRelations = ReversibleKeyMap<GoAtomName, GoAtomName, string>;
type IndexToName = { [index: number]: string };
type NameToIndex = { [name: string]: number };
type IndexToReal = { [index: number]: number };
type RealToIndex = { [index: number]: number };

export interface GoBondsHelperJSON extends BaseBondsHelperJSON {
  real_to_index: RealToIndex;
  name_to_index: NameToIndex;
  //relations: [[number, number], string][];
}



/**
 * Handle boilerplate for Go bond creation, removal and sync modifications with ITP files.
 */
export default class GoBondsHelper extends BaseBondsHelper {

  /** Define the constructor as protected */
  protected constructor(
    stage: NglWrapper,
    protected index_to_real: IndexToReal = {},
    protected name_to_index: NameToIndex = {},
    protected index_to_name: IndexToName = {},
    protected real_to_index: RealToIndex = {}
  ) {
    super(stage);
  }


  /** Get bonds related to an go atom. */
  // findBondsOf(atom_name: GoAtomName) {
  //   const keys = this.relations.getAllFrom(atom_name)?.keys();
  //   return keys ? [...keys] : [];
  // }

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
  // @ts-ignore
  filter(predicate: (atom1: number, atom2: number, line: string) => boolean) {
    const new_map: Relations = new ReversibleKeyMap();

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
   * Add a new line inside the ITP.
   */
  add(line: string): this;
  add(atom1: number, atom2: number, line: string): this;
  add(atom1_or_line: number | string, atom2?: number, line?: string) {
    if (atom2 === undefined || line === undefined) {
      // atom1 is a full line
      if(typeof atom1_or_line === 'string') {
        const [name1, name2, ] = atom1_or_line.split(ItpFile.BLANK_REGEX).filter(e => e);
        if (name1 !== name2){
          this.relations.set(this.goNameToRealIndex(name1), this.goNameToRealIndex(name2), atom1_or_line);
        }
      }
    }
    else if(typeof atom1_or_line === 'number') {
      if (atom1_or_line !== atom2)
        this.relations.set(atom1_or_line, atom2, line);
    }

    return this;
  }

  /*
  createFakeLine(atom1: GoAtomName, atom2: GoAtomName) {
    return `${atom1}    ${atom2}    1  0.7923518221  9.4140000000`;
  }
  */

  createRealLine(ri1: number, ri2: number) {
    const atom1 = this.realIndexToGoName(ri1);
    const atom2 = this.realIndexToGoName(ri2);

    if (atom1 === undefined || atom2 === undefined) {
      console.warn("[Real line creator] Atoms", atom1, "and", atom2, "not found.");
      return `${atom1}    ${atom2}    1  0.7923518221  9.4140000000`;
    }

    // rm is distance between 2 martini go bonds
    // rm = (2^(1/6))*σ ≈ 1.122*σ
    // σ = rm*2^(-1/6)
    // Distance is in Angstrom, we expect it in nm (so we divide by 10)

    // Real index in object starts at 1, distance between take 0-starting indexes
    const rm = Math.abs(this.representation.distanceBetween(ri1 - 1, ri2 - 1)) / 10;
    const result = rm * (2 ** (-(1/6)));


    return `${atom1}    ${atom2}    1  ${result.toPrecision(11)}  9.4140000000`;
  }

  
  


  /* COMPUTED ITP FILES */

  /**
   * Try to rebuild the original files with their original names.
   * Index is always the last file of the array.
   */
  toOriginalFiles() {
    // Try to reconstruct the original files based on go atom names.
    const files: { [molecule_name: string]: string } = Object.create(null);

    for (const [index1, , line] of this) {
      let name1 = this.realIndexToGoName(index1);
      const mol_type_arr = /^(\w+)_\d+$/.exec(name1);

      if (!mol_type_arr) {
        continue;
      }

      // Récupère le nom de la molécule (molecule_0)
      const type = mol_type_arr[1];
      if (type in files) {
        // type = molecule_0. Réécris les lignes du fichier
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



  /* STATIC CONSTRUCTORS */

  /**
   * Construct a GoBondsHelper from a save made with `instance.toJSON()`.
   */
  static fromJSON(stage: NglWrapper, data: GoBondsHelperJSON) {
    const index_to_name: IndexToName = {};
    const index_to_real: IndexToReal = {};

    console.log("relations", data.relations);

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
        bonds.add(real_index_1, real_index_2, line);
      }
      // Increment i by number of atoms
      i += all_atom_count;
    }

    return bonds;
  }
}
