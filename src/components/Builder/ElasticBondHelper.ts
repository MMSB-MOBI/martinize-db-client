import ReversibleKeyMap from "reversible-key-map";
import { ElasticOrGoBounds } from "../../StashedBuildHelper";
import BaseBondsHelper, { BaseBondsHelperJSON, Relations } from "./BaseBondsHelper";
import NglWrapper from "./NglWrapper";
import ItpFile from 'itp-parser-forked';
import { resolve } from "dns";

export default class ElasticBondsHelper extends BaseBondsHelper {

protected constructor(stage: NglWrapper) {
    super(stage);
}

filter(predicate: (atom1: number, atom2: number, line: string) => boolean): BaseBondsHelper {
    const new_map: Relations = new ReversibleKeyMap();

    const new_one = new ElasticBondsHelper(this.representation.stage);

    // @ts-ignore
    new_one.representation = this.representation;

    new_one.relations = new_map;

    return new_one;
}


add(line: string): this;
add(atom1: number, atom2: number, line: string): this;
add(atom1_or_line: string | number, atom2?: number, line?: string) {
    if (atom2 === undefined || line === undefined) {
    // atom1 is a full line
    if(typeof atom1_or_line === 'string') {
        const [name1, name2, ] = atom1_or_line.split(ItpFile.BLANK_REGEX).filter(e => e);
        if (name1 !== name2){
        this.relations.set(Number(name1), Number(name2), atom1_or_line);
        }
    }
    }
    else if(typeof atom1_or_line === 'number') {
        if (atom1_or_line !== atom2)
            this.relations.set(atom1_or_line, atom2, line);
    }

    return this;
}

createRealLine(atom1: number, atom2: number): string {

    if (atom1 === undefined || atom2 === undefined) {
      console.warn("[Real line creator] Atoms", atom1, "and", atom2, "not found.");
      return `${atom1} ${atom2} 6 0.5 500`;
    }

    // rm is distance between 2 martini go bonds
    // rm = (2^(1/6))*σ ≈ 1.122*σ
    // σ = rm*2^(-1/6)
    // Distance is in Angstrom, we expect it in nm (so we divide by 10)

    // Real index in object starts at 1, distance between take 0-starting indexes
    const rm = Math.abs(this.representation.distanceBetween(atom1 - 1, atom2 - 1)) / 10;
    const result = rm * (2 ** (-(1/6)));


    return `${atom1} ${atom2} 6 ${result.toPrecision(11)} 500.0`;
}

async toOriginalFiles(itp: File): Promise<File[]> {

    const files: { [molecule_name: string]: string } = Object.create(null);

    const files_as_file: File[] = [];

    const type = "molecule_0";

    let molecule = await ItpFile.read(itp);

    let new_bonds = [];

    let rubber = [];
    for (const [index1, , line_elasticbond] of this) {
        rubber.push(line_elasticbond);
    }

    let nb_rubber_line = 0;
    let rubber_bonds = false;
    for(const line of molecule!.bonds) {
        if (line.startsWith('; Rubber band')) {
            new_bonds.push(line);
            rubber_bonds = true;
        }
        if (line.startsWith('; Side chain bonds')) {
            rubber_bonds = false;
        }

        if (rubber_bonds) {
            rubber[nb_rubber_line] === undefined ? new_bonds.pop() : new_bonds.push(rubber[nb_rubber_line]);
            nb_rubber_line ++;
        }
        else {
            new_bonds.push(line);
        }
    }

    molecule.setField("bonds", new_bonds);
    
    files[type] = molecule.toString();

    
    const suffix = '.itp';
    files_as_file.push(new File([files[type]], type + suffix, { type: 'chemical/x-include-topology' }));
    
    return new Promise((resolve, reject) => {resolve(files_as_file)});
}

toJSON() : BaseBondsHelperJSON {
    return {
        relations:  [...this.relations.entries()],
    };
}

clone() {
    const clone = ElasticBondsHelper.fromJSON(this.representation.stage, this.toJSON());
    // @ts-ignore
    clone.representation = this.representation;

    return clone;
}



static fromJSON(stage: NglWrapper, data: BaseBondsHelperJSON) {
    const obj = new ElasticBondsHelper(
        stage,
    );
    obj.relations = new ReversibleKeyMap(data.relations);

    return obj;
}

      
static async readFromItps(stage: NglWrapper, itp_files: File[]) {
    const bonds = new ElasticBondsHelper(stage);

    const elastic_itps = itp_files.filter(e => e.name.includes("rubber_band"));
    if (elastic_itps.length === 0) {
        throw new Error("No itp with elastic bonds description");
    }

    for (const itp of elastic_itps){
        const molecule = await ItpFile.read(itp); 
        const elastic_bonds = molecule.getSubfield("bonds", "Rubber band", false)
        if (elastic_bonds.length === 0) console.warn(`${itp.name} doesn't have elastic bonds`)
        for (const bond of elastic_bonds){
            bonds.add(bond); 
        }
        
    }

    return bonds;
}
    


    
    render(opacity = .2, hightlight_predicate?: (atom1_index: number, atom2_index: number) => boolean) {
        return this.representation.render(
          'elastic',
          this.bonds,
          opacity,
          hightlight_predicate,
        );
      }
      




}