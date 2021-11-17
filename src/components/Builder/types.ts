import { BondsRepresentation } from './BondsRepresentation';
import BaseBondsHelper from './BaseBondsHelper';

export interface JobDoc extends CouchDoc {
    jobId: string; 
    userId : string;
    date : string; 
    files : JobFiles; 
    radius : { [atomName: string]: number }; 
    settings: JobSettings 
    type : "martinize" | "insane"
}

export interface JobFiles {
    all_atom : FileFromHttp; 
    coarse_grained : FileFromHttp; 
    itp_files : FileFromHttp[]; 
    top_file : FileFromHttp; 
}

interface JobSettings {
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
    ea? : number; 
    ef? : number; 
    el? : number; 
    em? : number; 
    ep? : number; 
    eu? : number; 
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

type AvailableForceFields = "martini3001" | "elnedyn22" | "elnedyn22p" | "elnedyn" | "martini22" | "martini22p"

export interface MartinizeFiles {
    pdb: MartinizeFile;
    itps: MartinizeFile[]; // One array of itps for each molecule of the system
    radius: { [name: string]: number };
    top: MartinizeFile;
    go?: BaseBondsHelper;
    elastic_bonds?: BondsRepresentation;
    warnings?: File; 
}

export interface MartinizeFile {
    name: string;
    content: File;
    type: string;
    mol_idx?: number; 
}

