import { MartinizeFiles, MartinizeFile } from './types'
import GoBondsHelper from './GoBondsHelper'
import ElasticBondsHelper from './ElasticBondHelper'
import NglWrapper, { NglRepresentation } from './NglWrapper'
import BaseBondsHelper from './BaseBondsHelper'

export async function loadBonds(stage : NglWrapper, itps: MartinizeFile[], mode : "go" | "elastic"){
    
    const bonds = mode === "go" ? await GoBondsHelper.readFromItps(stage,  itps.flat().map((e:MartinizeFile) => e.content)) : mode === "elastic" ? await ElasticBondsHelper.readFromItps(stage, itps.map((e:MartinizeFile) => ({content: e.content, mol_idx: e.mol_idx}))) : undefined
    const elastic_bonds = bonds?.representation
    return {elastic_bonds, go: bonds}
}

export function registerCoordsAndDisplayBonds(nglRepr : NglRepresentation<any>, bondsHelper: BaseBondsHelper){

    const coordinates: [number, number, number][][] = [];

    nglRepr.atomIterator(ap => {
        if(ap.chainIndex in coordinates) coordinates[ap.chainIndex].push([ap.x, ap.y, ap.z])
        else coordinates[ap.chainIndex] = [[ap.x, ap.y, ap.z]];
      });

      // Init the bond helper 
      bondsHelper.representation.registerCoords(coordinates); 
      bondsHelper.render(); 
}
