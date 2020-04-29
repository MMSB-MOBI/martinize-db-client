import ItpFile from 'itp-parser';
import ReversibleKeyMap from 'reversible-key-map';
import { ElasticOrGoBounds } from '../../StashedBuildHelper';

type GoAtomName = string;
type GoRelations = ReversibleKeyMap<GoAtomName, GoAtomName, string>;
type IndexToName = { [index: number]: string };
type NameToIndex = { [name: string]: number };
type IndexToReal = { [index: number]: number };
type RealToIndex = { [index: number]: number };

export interface GoBondsHelperJSON {
  real_to_index: RealToIndex;
  name_to_index: NameToIndex;
  relations: [[GoAtomName, GoAtomName], string][];
}

/**
 * Handle boilerplate for Go bond creation, removal and sync modifications with ITP files.
 */
export default class GoBondsHelper {
  /**
   * VAtom 1 <> VAtom 2: ITP line
   */
  protected relations: GoRelations = new ReversibleKeyMap();

  /** Define the constructor as protected */
  protected constructor(
    protected index_to_real: IndexToReal = {},
    protected name_to_index: NameToIndex = {},
    protected index_to_name: IndexToName = {},
    protected real_to_index: RealToIndex = {}
  ) {}

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

  findBondsOf(atom_name: GoAtomName) {
    return [...this.relations.getAllFrom(atom_name).keys()];
  }

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
      this.index_to_real,
      this.name_to_index,
      this.index_to_name,
      this.real_to_index,
    );

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

      this.relations.set(name1, name2, atom1_or_line);
    }
    else {
      this.relations.set(atom1_or_line, atom2, line);
    }

    return this;
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

  *[Symbol.iterator]() {
    for (const [keys, line] of this.relations) {
      yield [keys[0], keys[1], line] as const;
    }
  }

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
      files_as_file.push(new File([files[type]], type + suffix));

      index += `#include "${type + suffix}"\n`;
    }

    files_as_file.push(new File([index], index_filename));

    return files_as_file;
  }

  /**
   * Get the compiled go bonds inside a single ITP, plus the index.
   */
  toCompiledFiles() {
    const compiled_filename = "compiled__go-table_VirtGoSites.itp";
    const index_filename = "go-table_VirtGoSites.itp";

    const go_table_index = new File([this.toIndexString(compiled_filename)], index_filename);
    const compiled_itp = new File([this.toString()], compiled_filename);

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

  toJSON() : GoBondsHelperJSON {
    return {
      real_to_index: this.real_to_index,
      name_to_index: this.name_to_index,
      relations: [...this.relations.entries()],
    };
  }

  /* STATIC METHODS */

  /**
   * Construct a GoBondsHelper from a save made with `instance.toJSON()`.
   */
  static fromJSON(data: GoBondsHelperJSON) {
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
  static async readFromItps(itp_files: File[]) {
    const bonds = new GoBondsHelper();

    const index = itp_files.find(e => e.name === "go-table_VirtGoSites.itp");
    if (!index) {
      throw new Error("Need the go-table_VirtGoSites.itp file.");
    }
    
    const index_itp = ItpFile.readFromString(await index.text());

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

      // Read the ITPs
      const molecule = ItpFile.readFromString(await molecule_file.text());
      const table = ItpFile.readFromString(await table_file.text());

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

      // Read the go table
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


