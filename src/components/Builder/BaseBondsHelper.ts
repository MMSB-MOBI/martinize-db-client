import NglWrapper from './NglWrapper';
import { BondsRepresentation } from './BondsRepresentation';
import ReversibleKeyMap from 'reversible-key-map';
import { MoleculeFile, ElasticOrGoBounds, ElasticOrGoBoundsRegistered } from '../../types/entities'

//type number = string;
export type Relations = ReversibleKeyMap<number, number, string>[]

export interface BaseBondsHelperJSON {
  relations: [[number, number], string][];
  chain : number; 
}

export default abstract class BaseBondsHelper {

    /**
     * VAtom 1 <> VAtom 2: ITP line
     */
    public relations: Relations = [];
    public readonly representation: BondsRepresentation;

    protected history: Relations[] = [];
    protected reverse_history: Relations[] = [];
    protected constructor(stage: NglWrapper) {
        this.representation = new BondsRepresentation(stage);
    }
    protected currentBonds: Array<string> = [''];
    protected customBonds: Array<Array<string>> = [];
    protected lastCustomBonds: Array<Array<string>> = [];
    protected bonds_itps: File[] = []; 


    /** Get bonds related to an go atom. */
  findBondsOf(atom_name: number, chain:number) {
    const keys = this.relations[chain].getAllFrom(atom_name)?.keys();
    return keys ? [...keys] : [];
  }



  addCustomBonds(chain:number, atom1: any, atom2: any) {
    this.currentBonds.push('added bond from '+atom1+' to '+atom2 + ' on chain ' + chain);
  }

  rmCustomBonds(chain: number, atom1: any, atom2?: any) {
    if(atom2){
      this.currentBonds.push('deleted bond from '+atom1+' to '+atom2 + ' on chain ' + chain);
    }
    else {
      this.currentBonds.push('deleted all bonds from '+atom1 + ' on chain ' + chain);
    }
    
  }


    /** Access the computed bonds. */
    get bonds() : ElasticOrGoBoundsRegistered {
      const allBonds: ElasticOrGoBoundsRegistered = [];
      
      for (const [chain, bonds] of this.relations.entries()){
        const bonds_transformed: ElasticOrGoBounds[] = []
        for (const [real1, real2] of bonds.keysCouples()) {
  
          if (real1 !== undefined && real2 !== undefined) {
            bonds_transformed.push([real1, real2]);
          }
        }
        allBonds[chain] = bonds_transformed; 
      }
      
  
      return allBonds;
    }

  
  abstract render(opacity?: number, hightlight_predicate?: ((atom1_index: number, atom2_index: number, chain:number) => boolean) | undefined): void;
  
  abstract filter(predicate: (atom1: number, atom2: number, line: string) => boolean) : BaseBondsHelper;
  
  /**
   * Modify the actual object through a filter.
   */
  // @ts-ignore
  filterSelf(predicate: (atom1: number, atom2: number, line: string) => boolean) {
    const new_one = this.filter(predicate);
    this.relations = new_one.relations;

    return this;
  }

  abstract add(chain: number, line: string): this;
  abstract add(chain: number, atom1: number, atom2: number, line: string): this;
  abstract add(chain: number, atom1_or_line: number | string, atom2?: number, line?: string) : this;

  /**
   * Test if bond {atom1}<>{atom2} exists.
   */
   has(atom1: number, atom2: number, chain:number) {
    return this.relations[chain].hasCouple(atom1, atom2);
  }

  remove(chain:number, from_atom: number): this;
  remove(chain:number, atom1: number, atom2: number): this;
  remove(chain:number, atom1: number, atom2?: number) {
    if (atom2 === undefined) {
      this.relations[chain].deleteAllFrom(atom1);
    }
    else {
      this.relations[chain].delete(atom1, atom2);
    }
    return this;
  }

  abstract createRealLine(atom1: number, atom2: number, chain:number) : string;

  abstract toOriginalFiles() : Promise<MoleculeFile[]>;

  abstract toJSON () : BaseBondsHelperJSON[];

  abstract clone(): BaseBondsHelper;

  abstract nglIndexToRealIndex(nglIdx:number) : {chain:number, index:number};  


  /*toString() {
    let res_str = "";

    for (const line of this.relations.values()) {
      res_str += line + "\n";
    }

    return res_str;
  }*/




  /* ITERATION OF BONDS */

  /*[Symbol.iterator]() {
    for (const chain in this.relations){
      for (const [keys, line] of this.relations[chain]) {
        yield [keys[0], keys[1], line] as const;
      }
    }
    
  }*/
  
      /* HISTORY */

  /** Save the current state in the history. */
  historyPush() {
    this.history.push(this.relations.map(bonds => new ReversibleKeyMap(bonds.entries())));
    this.reverse_history = [];

    this.customBonds.push(Array.from(this.currentBonds));
  }

  historyRevert() {
    const last = this.reverse_history.pop();
    
    if (last) {
      this.history.push(this.relations);
      this.relations = last;

      let cb = this.lastCustomBonds.pop();
      if(cb !== undefined) {
        this.customBonds.push(this.currentBonds);
        this.currentBonds = cb;
      }
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

      let lastcb = this.customBonds.pop();
      if(lastcb !== undefined) {
        this.lastCustomBonds.push(this.currentBonds);
        this.currentBonds = lastcb;
      }
    }
  }

  /** Clear history. */
  historyClear() {
    this.history = [];
    this.reverse_history = [];
    this.customBonds = [];
    this.lastCustomBonds =  [];
    this.currentBonds = [''];
  }

  /** Number of saved states. When `.history_length === 0`, `.historyBack()` does nothing. */
  get history_length() {
    return this.history.length;
  }
  
  /** Number of reverse-saved states. When `.history_length === 0`, `.historyRevert()` does nothing. */
  get reverse_history_length() {
    return this.reverse_history.length;
  }

  /** List of history modifications */

  

  customBondsGet() {
    return this.currentBonds;
  }



}

export function getIdxSortedByChain(indexes:{chain:number, index:number}[]): {[chain:number]:Set<number>}{
  const sortedByChain: {[chain:number]:Set<number>} = {}

  for (const atomObj of indexes){
    if(!(atomObj.chain in sortedByChain)) sortedByChain[atomObj.chain] = new Set()
    sortedByChain[atomObj.chain].add(atomObj.index)
  }

  return sortedByChain
}