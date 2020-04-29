import { ElasticOrGoBounds } from '../../../StashedBuildHelper';
import NglWrapper, { NglComponent } from '../NglWrapper';
import * as ngl from '@mmsb/ngl';
import { MBState } from "../Builder";
import GoBondsHelper from "../GoBondsHelper";

export interface AddOrRemoveBoundParams {
  source: number;
  target: number;
  go: GoBondsHelper;
  stage: NglWrapper;
  coords: [number, number, number][];
  links_component: NglComponent;
}

/** 
 * Source&Target are GO index + 1 !! 
 * 
 * {ngl_click_event}.atom.index + 1
 */
export function addBond({ source, target, go, stage, coords, links_component }: AddOrRemoveBoundParams) {
  const go_i = source, go_j = target;
  const go_i_name = go.goIndexToGoName(go_i), go_j_name = go.goIndexToGoName(go_j);

  go.add(go_i_name, go_j_name, `${go_i_name}    ${go_j_name}    1  0.7923518221  9.4140000000`);
 
  // Remove the old go bonds component
  stage.remove(links_component);

  // Redraw all the bounds (very quick)
  const { component: new_cmp, representation } = drawBondsInStage(stage, go.bonds, coords, 'go');
 
  // Save the new component
  return { component: new_cmp, representation };
}

/** 
 * Source&Target are REAL ATOM index 
 * 
 * {ngl_click_event}.type === "cylinder"
 * {ngl_click_event}.object.name.startsWith("[GO]")
 * const [source, target] = {ngl_click_event}.object.name.split('atoms ')[1].split('-').map(Number)
 */
export function removeBond({ source, target, go, stage, coords, links_component }: AddOrRemoveBoundParams) {
  const go_i_name = go.realIndexToGoName(source), go_j_name = go.realIndexToGoName(target);
  
  go.remove(go_i_name, go_j_name);

  // Remove the old go bonds component
  stage.remove(links_component);
 
  // Redraw all the bounds (very quick)
  const { component: new_cmp, representation } = drawBondsInStage(stage, go.bonds, coords, 'go');
 
  // Save the new component
  return { component: new_cmp, representation };
}

/**
 * Remove all bonds from source
 * 
 * {source} is GO index + 1 !
 */
export function removeAllOfBond({ source, go, stage, coords, links_component }: AddOrRemoveBoundParams) {  
  const go_i_name = go.goIndexToGoName(source);
  
  go.remove(go_i_name);

  // Remove the old go bonds component
  stage.remove(links_component);
 
  // Redraw all the bounds (very quick)
  const { component: new_cmp, representation } = drawBondsInStage(stage, go.bonds, coords, 'go');
 
  // Save the new component
  return { component: new_cmp, representation };
}

export const V_BONDS_DEFAULT_COLOR = new ngl.Color(0, 255, 0);
export const V_BONDS_HIGHLIGHT_COLOR = new ngl.Color(1, .1, .1);

export function drawBondsInStage(
  stage: NglWrapper, 
  points: ElasticOrGoBounds[], 
  coords: [number, number, number][], 
  mode: 'go' | 'elastic', 
  highlight?: [number, number] | number,
  default_opacity = 0.2,
) {
  const shape = new ngl.Shape("add-bonds");
  const upper_mode = mode.toLocaleUpperCase();
  let h1 = 0, h2 = 0;

  if (Array.isArray(highlight)) {
    [h1, h2] = highlight;
  }
  else if (typeof highlight === 'number') {
    // Highlight every link from highlight go atom
    h1 = highlight;
  }

  function isHighlighted(atom1_index: number, atom2_index: number) {
    if (highlight && Array.isArray(highlight)) {
      return (atom1_index === h1 && atom2_index === h2) || (atom2_index === h1 && atom1_index === h2);
    }
    // Highlight is a number
    else if (h1) {
      return atom1_index === h1 || atom2_index === h1;
    }
  }
  
  for (const [atom1_index, atom2_index] of points) {
    // atom index starts at 1, atom array stats to 0
    const atom1 = coords[atom1_index - 1];
    const atom2 = coords[atom2_index - 1];
    
    if (!atom1 || !atom2) {
      console.warn("Not found atom", atom1_index, atom2_index, coords);
      continue;
    }
    
    const name = `[${upper_mode}] Bond w/ atoms ${atom1_index}-${atom2_index}`;
    if (isHighlighted(atom1_index, atom2_index)) {
      shape.addCylinder(atom1, atom2, V_BONDS_HIGHLIGHT_COLOR, .1, name);
      continue;
    }

    shape.addCylinder(atom1, atom2, V_BONDS_DEFAULT_COLOR, .1, name);
  }

  const component = stage.add(shape);
  const representation = component.add<ngl.BufferRepresentation>('buffer', { opacity: default_opacity });

  return { component, representation };
}

/**
 * Add or remove go bonds in the stage, and refresh files in state.
 * 
 * Meant to be used only with protein builder.
 * 
 * Return newly created virtual link component and representation.
 */
export async function addOrRemoveGoBonds(
  { 
    files, 
    coordinates, 
    virtual_links: links_component, 
    virtual_link_opacity, 
    virtual_link_visible 
  }: MBState, 
  ngl_wrapper: NglWrapper,
  atom_index_1: number, 
  atom_index_2: number,
  mode: 'add' | 'remove' | 'remove_all',
) {
  if (!files || !files.go || !links_component) {
    console.warn("One required element is missing", files, links_component);
    return;
  }

  const target_fn = mode === 'add' ? addBond : (mode === 'remove' ? removeBond : removeAllOfBond);

  const { component, representation } = target_fn({
    source: atom_index_1,
    target: atom_index_2,
    go: files.go,
    stage: ngl_wrapper,
    coords: coordinates,
    links_component,
  });

  representation.set({ opacity: virtual_link_opacity });
  representation.visible = virtual_link_visible;

  // Save the ITP file // TODO DO IT ON DOWNLOAD

  return { component, representation };
}
