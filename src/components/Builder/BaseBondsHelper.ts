import NglWrapper, { NglComponent, NglRepresentation } from './NglWrapper';
import { BondsRepresentation } from './BondsRepresentation';
import ReversibleKeyMap from 'reversible-key-map';
import { ElasticOrGoBounds } from '../../StashedBuildHelper';

//type number = string;
export type Relations = ReversibleKeyMap<number, number, string>;

export interface BaseBondsHelperJSON {
  relations: [[number, number], string][];
}

export default abstract class BaseBondsHelper {

    /**
     * VAtom 1 <> VAtom 2: ITP line
     */
    protected relations: Relations = new ReversibleKeyMap();
    public readonly representation: BondsRepresentation;

    protected history: Relations[] = [];
    protected reverse_history: Relations[] = [];
    protected constructor(stage: NglWrapper) {
        this.representation = new BondsRepresentation(stage);
    }
    protected currentBonds: Array<string> = [''];
    protected customBonds: Array<Array<string>> = [];
    protected lastCustomBonds: Array<Array<string>> = [];


    /** Get bonds related to an go atom. */
  findBondsOf(atom_name: number) {
    const keys = this.relations.getAllFrom(atom_name)?.keys();
    return keys ? [...keys] : [];
  }



  addCustomBonds(atom1: any, atom2: any) {
    this.currentBonds.push('added bond from '+atom1+' to '+atom2);
  }

  rmCustomBonds(atom1: any, atom2?: any) {
    if(atom2){
      this.currentBonds.push('deleted bond from '+atom1+' to '+atom2);
    }
    else {
      this.currentBonds.push('deleted all bonds from '+atom1);
    }
    
  }


    /** Access the computed bonds. */
    get bonds() : ElasticOrGoBounds[] {
      const bonds: ElasticOrGoBounds[] = [];
  
      for (const [real1, real2] of this.relations.keysCouples()) {
  
        if (real1 !== undefined && real2 !== undefined) {
          bonds.push([real1, real2]);
        }
      }
  
      return bonds;
    }

  
  abstract render(opacity?: number, hightlight_predicate?: ((atom1_index: number, atom2_index: number) => boolean) | undefined): void;
  
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

  abstract add(line: string): this;
  abstract add(atom1: number, atom2: number, line: string): this;
  abstract add(atom1_or_line: number | string, atom2?: number, line?: string) : this;

  /**
   * Test if bond {atom1}<>{atom2} exists.
   */
   has(atom1: number, atom2: number) {
    return this.relations.hasCouple(atom1, atom2);
  }

  remove(from_atom: number): this;
  remove(atom1: number, atom2: number): this;
  remove(atom1: number, atom2?: number) {
    if (atom2 === undefined) {
      this.relations.deleteAllFrom(atom1);
    }
    else {
      this.relations.delete(atom1, atom2);
    }

    return this;
  }

  abstract createRealLine(atom1: number, atom2: number) : string;

  abstract toOriginalFiles(itp : File | undefined) : File[] | Promise<File[]>;

  abstract toJSON () : BaseBondsHelperJSON;

  abstract clone(): BaseBondsHelper;



  toString() {
    let res_str = "";

    for (const line of this.relations.values()) {
      res_str += line + "\n";
    }

    return res_str;
  }




  /* ITERATION OF BONDS */

  *[Symbol.iterator]() {
    for (const [keys, line] of this.relations) {
      yield [keys[0], keys[1], line] as const;
    }
  }
  
      /* HISTORY */

  /** Save the current state in the history. */
  historyPush() {
    this.history.push(new ReversibleKeyMap(this.relations.entries()));
    this.reverse_history = [];

    this.customBonds.push(Array.from(this.currentBonds));
  }

  historyRevert() {
    const last = this.reverse_history.pop();

    if (last) {
      this.history.push(this.relations);
      this.relations = last;

      let cb = this.lastCustomBonds.pop();
      if(cb != undefined) {
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
      if(lastcb != undefined) {
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