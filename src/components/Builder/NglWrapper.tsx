import * as ngl from '@mmsb/ngl';
import { StageParameters, StageLoadFileParams } from '@mmsb/ngl/declarations/stage/stage';
import RepresentationElement from '@mmsb/ngl/declarations/component/representation-element';
import Representation, { RepresentationParameters } from '@mmsb/ngl/declarations/representation/representation';
import AtomProxy from '@mmsb/ngl/declarations/proxy/atom-proxy';
import Surface from '@mmsb/ngl/declarations/surface/surface';
import PickingProxy from '@mmsb/ngl/declarations/controls/picking-proxy';
import BallAndStickRepresentation from '@mmsb/ngl/declarations/representation/ballandstick-representation';

export class NglWrapper {
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

  add<T extends Representation>(type: ViableRepresentation, parameters?: Partial<RepresentationParameters>) {
    const repr: RepresentationElement = this.component.addRepresentation(type, parameters);

    const wrapper = new NglRepresentation<T>(repr);
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

  applySelection(selection: string) {
    const repr = this.representation as any as BallAndStickRepresentation;
    repr.setSelection(selection);
  }
}

export default NglWrapper;
