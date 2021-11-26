import { BufferRepresentation } from '@mmsb/ngl';
import { RepresentationParameters } from '@mmsb/ngl/declarations/representation/representation';
import * as ngl from '@mmsb/ngl';
import NglWrapper, { NglComponent, NglRepresentation } from './NglWrapper';
import { ElasticOrGoBoundsRegistered } from '../../types/entities';


type AtomCoordinates = [number, number, number];
type ChainCoordinates = AtomCoordinates[][]

export class BondsRepresentation {
    static readonly V_BONDS_DEFAULT_COLOR = new ngl.Color(0, 255, 0);
    static readonly V_BONDS_HIGHLIGHT_COLOR = new ngl.Color(255,0,255);
  
    protected virtual_links_cmpt?: NglComponent;
    protected virtual_links_repr?: NglRepresentation<BufferRepresentation>;
    protected coordinates: ChainCoordinates = [];
    public bonds: ElasticOrGoBoundsRegistered = []; 
  
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
  
    registerCoords(coordinates: ChainCoordinates) {
      this.coordinates = coordinates;
    }
  
    getCoordinate(index: number) {
      return this.coordinates[index];
    }
  
    distanceBetween(atom1: number, atom2: number, chain: number) {
      // d = ((x2 - x1)^2 + (y2 - y1)^2 + (z2 - z1)^2)^1/2 
      const [x1, y1, z1] = this.coordinates[chain][atom1];
      const [x2, y2, z2] = this.coordinates[chain][atom2];
  
      return Math.sqrt(((x2 - x1) ** 2) + ((y2 - y1) ** 2) + ((z2 - z1) ** 2));
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
      hightlight_predicate?: (atom1_index: number, atom2_index: number, chain:number) => boolean
      ) {
      this.bonds = bonds;
      const coords = this.coordinates;
  
  
      const shape = new ngl.Shape("add-bonds");
      const upper_mode = mode.toLocaleUpperCase();
      
      for (const [chain, bonds_array] of bonds.entries()){
        for (const [atom1_index, atom2_index] of bonds_array) {
          // atom index starts at 1, atom array stats to 0
          const atom1 = coords[chain][atom1_index - 1];
          const atom2 = coords[chain][atom2_index - 1];

          if (!atom1 || !atom2) {
            console.warn("Not found atom", atom1_index, atom2_index, coords);
            continue;
          }
          
          const name = `[${upper_mode}] #${chain} Bond w/ atoms ${atom1_index}-${atom2_index}`;
          if (hightlight_predicate && hightlight_predicate(atom1_index, atom2_index, chain)) {
            shape.addCylinder(atom1, atom2, BondsRepresentation.V_BONDS_HIGHLIGHT_COLOR, .1, name);
            continue;
          }
    
          shape.addCylinder(atom1, atom2, BondsRepresentation.V_BONDS_DEFAULT_COLOR, .1, name);
        }
      }

      
  
      this.cleanStage();
      const component = this.stage.add(shape);
      const representation = component.add<ngl.BufferRepresentation>('buffer', { opacity });
  
      this.virtual_links_cmpt = component;
      this.virtual_links_repr = representation;
    }
  }