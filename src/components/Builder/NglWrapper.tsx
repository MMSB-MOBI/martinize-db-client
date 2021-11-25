import * as ngl from '@mmsb/ngl';
import { StageParameters, StageLoadFileParams } from '@mmsb/ngl/declarations/stage/stage';
import RepresentationElement from '@mmsb/ngl/declarations/component/representation-element';
import Representation, { RepresentationParameters } from '@mmsb/ngl/declarations/representation/representation';
import AtomProxy from '@mmsb/ngl/declarations/proxy/atom-proxy';
import Surface from '@mmsb/ngl/declarations/surface/surface';
import PickingProxy from '@mmsb/ngl/declarations/controls/picking-proxy';
import BallAndStickRepresentation from '@mmsb/ngl/declarations/representation/ballandstick-representation';
import { SelectionSchemeData } from '@mmsb/ngl/declarations/color/selection-colormaker';
import { martiniSchemes } from '../../martiniNglSchemes'
import { AvailableForceFields } from '../../types/entities'
import { Bead } from './BeadsHelper'

interface SchemeParameters {
  radius: boolean, 
  color:boolean, 
  beads: Bead[], 
  ff : AvailableForceFields
}

export class NglWrapper {
  static readonly BOX_X_HIGHLIGHT_COLOR = new ngl.Color(1, .1, .1);
  static readonly BOX_Y_HIGHLIGHT_COLOR = new ngl.Color(.1, .1, 1);
  static readonly BOX_Z_HIGHLIGHT_COLOR = new ngl.Color(.1, 1, .1);

  stage: ngl.Stage;

  constructor(target: string | HTMLElement, stage_params?: Partial<StageParameters>) {
    this.stage = new ngl.Stage(target, stage_params);

    const target_el = typeof target === 'string' ? document.getElementById(target)! : target;
    target_el.addEventListener('wheel', e => e.preventDefault(), { passive: false });
  }

  /**
   * Change the settings of the stage.
   */
  set(params: Partial<StageParameters>) {
    this.stage.setParameters(params);
    return this;
  }

  /**
   * Remove all components in the stage.
   */
  reset() {
    this.stage.removeAllComponents();
    return this;
  }

  /**
   * Load a file and get the created component. 
   */
  async load(path: string | Blob, params?: Partial<StageLoadFileParams>) {
    const cmpt = await this.stage.loadFile(path, params) as ngl.Component;

    return new NglComponent(cmpt);
  }

  /**
   * Try to automatically center the camera to the objects in the stage.
   */
  center(duration?: number) {
    this.stage.autoView(duration);
  }

  add(item: ngl.Structure | Surface | ngl.Volume | ngl.Shape) {
    const component = this.stage.addComponentFromObject(item) as ngl.Component;
    return new NglComponent(component);
  }

  remove(component: NglComponent) {
    this.stage.removeComponent(component.component);
  }

  onClick(callback: (pp: PickingProxy) => any) {
    this.stage.signals.clicked.add(callback);
  }

  removePanOnClick() {
    // @ts-ignore Bad typing
    this.stage.mouseControls.remove("clickPick-*");
  }

  removeEvents() {
    this.stage.signals.clicked.removeAll();
  }

  restoreDefaultMouseEvents() {
    this.stage.mouseControls.preset("default");
  }
}

export type ViableRepresentation = 'ball+stick' | 'ribbon' | 'surface' | 'hyperball' | 'line' | 'buffer';

export class NglComponent {
  protected _repr: NglRepresentation<any>[] = [];

  constructor(public component: ngl.Component) {}

  add<T extends Representation>(type: ViableRepresentation, parameters?: Partial<RepresentationParameters>,  schemeParameters?:SchemeParameters) {
    
    const repr: RepresentationElement = this.component.addRepresentation(type, parameters);

    const wrapper = new NglRepresentation<T>(repr);

    if(schemeParameters && (schemeParameters.radius || schemeParameters.color)){
      const params: any = {}
      if(schemeParameters.radius){
        params["radiusType"] = "data"
        params["radiusData"] = martiniSchemes.getMartini3ProteinRadiusScheme(schemeParameters.ff, schemeParameters.beads, 0.2)
      }
      if(schemeParameters.color){
        params["color"] = martiniSchemes.getMartini3ProteinColorScheme(schemeParameters.ff, schemeParameters.beads)
      }

      repr.setParameters(params)
    }

    this._repr.push(wrapper);

    return wrapper;
  }

  removeOfType(type: ViableRepresentation) {
    for (const repr of this.representations) {
      if (repr.name === type) {
        this.remove(repr);
      }
    }
  }

  remove(repr: NglRepresentation<any>) {
    this._repr = this._repr.filter(e => e !== repr);
    this.component.removeRepresentation(repr.element);
  }

  get representations() {
    return this._repr;
  }

  /**
   * Try to automatically center the camera to this component.
   */
  center(duration?: number) {
    this.component.autoView(duration);
  }
}

export class NglRepresentation<T extends Representation> {
  constructor(public element: RepresentationElement) {}

  get representation() {
    return this.element.repr as T;
  }

  get name() {
    return this.element.name;
  }
  
  set(parameters: Partial<RepresentationParameters>) {
    this.element.setParameters(parameters);
  }

  get visible() {
    return this.element.getVisibility();
  }

  set visible(value: boolean) {
    this.element.setVisibility(value);
  }

  /**
   * Iterate **synchronously** over each atom, in the right order.
   * 
   * This can only work if the representation contains a structure.
   */
  atomIterator(callback: (ap: AtomProxy) => void) {
    (this.representation.structure as ngl.Structure).eachAtom(callback);

  }

  iterateOverSelection(selection: string, callback: (ap: AtomProxy) => void, on_end_selection = "*") {
    const repr = this.representation as any as BallAndStickRepresentation;
    const struct = (this.representation.structure as ngl.Structure);

    repr.setSelection(selection);
    // @ts-ignore
    struct.eachAtom(callback, repr.selection);
    repr.setSelection(on_end_selection);
  }

  iterateOverGoSitesOf(selection: string, callback: (ap: AtomProxy) => void, on_end_selection = ".CA") {
    this.iterateOverSelection("(" + selection + ") and .CA", callback, on_end_selection);
  }
  iterateOverElasticSitesOf(selection: string, callback: (ap: AtomProxy) => void, on_end_selection = ".BB") {
    this.iterateOverSelection("(" + selection + ") and .BB", callback, on_end_selection);
  }

  applySelection(selection: string) {
    const repr = this.representation as any as BallAndStickRepresentation;
    repr.setSelection(selection);
  }

  hasAtomOuterTheBox() {
    const box = this.box;

    if (!box) {
      return false;
    }
    
    let has_outside = false;

    // For PDBs with CRYST1 record, x, y & z are at indexes 0, 4 and 8
    const { 0: x_box, 4: y_box, 8: z_box } = box;

    this.atomIterator(ap => {
      // For atom, coords are extracted from AtomProxy
      const { x, y, z } = ap;

      // With insane, it is simple: box bondaries starts at 0. No negative coords. 
      // Just have to check if atom coords are at 0 <= x <= x_box and so on.

      if (x < 0 || x > x_box || y < 0 || y > y_box || z < 0 || z > z_box) {
        has_outside = true;
      }
    });
    
    return has_outside;
  }

  createShapeFromBox() {
    const box = this.box;

    if (!box) {
      return undefined;
    }

    const shape = new ngl.Shape();

    // For PDBs with CRYST1 record, x, y & z are at indexes 0, 4 and 8
    const { 0: x_box, 4: y_box, 8: z_box } = box;
    const text = "Box boundaries";

    // Draw the bonds for x
    shape.addCylinder([0, 0, 0], [x_box, 0, 0], NglWrapper.BOX_X_HIGHLIGHT_COLOR, .1, text);
    shape.addCylinder([0, 0, z_box], [x_box, 0, z_box], NglWrapper.BOX_X_HIGHLIGHT_COLOR, .1, text);
    shape.addCylinder([0, y_box, 0], [x_box, y_box, 0], NglWrapper.BOX_X_HIGHLIGHT_COLOR, .1, text);
    shape.addCylinder([0, y_box, z_box], [x_box, y_box, z_box], NglWrapper.BOX_X_HIGHLIGHT_COLOR, .1, text);

    // Draw the bonds for y
    shape.addCylinder([0, 0, 0], [0, y_box, 0], NglWrapper.BOX_Y_HIGHLIGHT_COLOR, .1, text);
    shape.addCylinder([0, 0, z_box], [0, y_box, z_box], NglWrapper.BOX_Y_HIGHLIGHT_COLOR, .1, text);
    shape.addCylinder([x_box, 0, 0], [x_box, y_box, 0], NglWrapper.BOX_Y_HIGHLIGHT_COLOR, .1, text);
    shape.addCylinder([x_box, 0, z_box], [x_box, y_box, z_box], NglWrapper.BOX_Y_HIGHLIGHT_COLOR, .1, text);

    // Draw the bonds for z
    shape.addCylinder([0, 0, 0], [0, 0, z_box], NglWrapper.BOX_Z_HIGHLIGHT_COLOR, .1, text);
    shape.addCylinder([x_box, 0, 0], [x_box, 0, z_box], NglWrapper.BOX_Z_HIGHLIGHT_COLOR, .1, text);
    shape.addCylinder([0, y_box, 0], [0, y_box, z_box], NglWrapper.BOX_Z_HIGHLIGHT_COLOR, .1, text);
    shape.addCylinder([x_box, y_box, 0], [x_box, y_box, z_box], NglWrapper.BOX_Z_HIGHLIGHT_COLOR, .1, text);

    // To apply it
    // const component = stage.add(shape);
    // const representation = component.add<ngl.BufferRepresentation>('buffer', { opacity });

    return shape;
  }

  get box() {
    const struct = (this.representation.structure as ngl.Structure);
    
    if (struct?.boxes?.length) {
      return struct.boxes[0];
    }
    return undefined;
  }
}

export default NglWrapper;
