export interface BaseMolecule {
  /** Molecule snowflake ID */
  id: string;
  /** Molecule name (free text) */
  name: string;
  /** Molecule short alias */
  alias: string;
  /** Mol smiles formula (optional) */
  smiles: string;
  /** Category, should be a GO Term */
  category: string[];
  /** Molecule version (free text) */
  version: string;
  /** Free comment text. */
  comments: string;
  /** Citation */
  citation: string;
  /** Information about a protein validation, model quality */
  validation: string;
  /** String version of the used command line (other parameters) */
  command_line: string;
  /** Way to create the martinized molecule (id that refers in create_way field of settings.json) */
  create_way: string;
  /** Force field version */
  force_field: string;
  /** Stringified ISO date of creation date */
  created_at: string;
  /** Molecule parent version. If string, ref to <Molecule.id> */
  parent: null | string;
  /** Tree snowflake ID. Shared between parent and children */
  tree_id: string;
  /** Hash of generated zip file attached to this module */
  hash: string;
  /** Reference to <User.id> owner/curator of this mol */
  owner: string;
  /** ID of related file containing `.itp` and `.gro`/`.pdb` files */
  files: string;
  /** Author (if fetched). */
  author?: string;
  builder_mode ?: string; 
}

export interface ModelMolecule {
  name: string; 
  alias: string; 
  smiles: string; 
  category: string[]; 
  tree_id: string; 
  force_field?: string; 
}

export interface Molecule extends BaseMolecule {
  /** <User.id> that have approved this molecule */
  approved_by: string;
  /** Last time as ISO date the user/admin edited this molecule */
  last_update: string;
}

export interface StashedMolecule extends BaseMolecule {}

export interface User {
  /** User snowflake ID */
  id: string;
  /** User unique e-mail address */
  email: string;
  /** Display name */
  name: string;
  /** Stringified ISO Date of the user creation */
  created_at: string;
  /** bcrypt-hashed password of the user */
  password: string;
  /** User role */
  role: UserRole;
  approved: boolean;
  fullname: string; 
  affiliation: string; 
}

export interface Token {
  /** JTI UUID snowflake */
  id: string;
  /** <User.id> who own this token */
  user_id: string;
  /** Stringified ISO date of the token creation */
  created_at: string;
}

export type UserRole = "admin" | "curator";

interface JobDoc extends CouchDoc {
  id: string; 
  jobId: string; 
  userId : string;
  date : string; 
  radius : { [atomName: string]: number }; 
  settings: JobSettings 
  type : "martinize" | "insane"; 
  name: string;
  update_date? : string; 
  manual_bonds_edition?: boolean; 
}

export interface ReadedJobDoc extends JobDoc { 
  files : ReadedJobFiles; 

}

export interface RawJobDoc extends JobDoc {
  files: RawJobFiles

}

export interface ReadedJobFiles {
  all_atom : FileFromHttp; 
  coarse_grained : FileFromHttp; 
  itp_files : FileFromHttp[][]; 
  top_file : FileFromHttp; 
  warnings: FileFromHttp; 
}

export interface RawJobFiles { 
  all_atom : FileFromHttp; 
  coarse_grained : FileFromHttp; 
  itp_files : FileFromHttp[][]; 
  top_file : FileFromHttp;
}


export interface JobSettings {
  builder_mode : MartinizeMode; 
  ff : AvailableForceFields; 
  advanced : boolean; 
  commandline : string; 
  cter : "COOH-ter"; 
  nter : "NH2-ter";
  sc_fix : boolean; 
  position : "backbone" | "all" | "none"
  cystein_bridge : "none" | "auto"
  elastic? : boolean; 
  use_go? : boolean; 
  ea? : string; 
  ef? : string; 
  el? : string; 
  em? : string; 
  ep? : string; 
  eu? : string; 
}

interface FileFromHttp {
  name: string; 
  type: string; 
  content: string; 
}

interface CouchDoc {
  _id : string; 
  _rev : string; 
}

export interface MoleculeFile {
  file : File; 
  mol_idx: number; 
}

export type AvailableForceFields = "martini3001" | "elnedyn22" | "elnedyn22p" | "elnedyn" | "martini22" | "martini22p"

export type MartinizeMode = "classic" | "go" | "elastic"

export type ElasticOrGoBounds = [number, number];
export type ElasticOrGoBoundsRegistered =  ElasticOrGoBounds[][]

export interface MartinizeFile {
  name: string;
  content: File;
  type: string;
  mol_idx?: number; 
}
