import ItpFile from "itp-parser";
import { GoBoundsDetails, ElasticOrGoBounds } from "../../../StashedBuildHelper";
import NglWrapper, { NglComponent } from "../NglWrapper";
import * as ngl from '@mmsb/ngl';
import AtomProxy from "@mmsb/ngl/declarations/proxy/atom-proxy";

export interface AddOrRemoveBoundParams {
  source: number;
  target: number;
  itp_file: ItpFile;
  details: GoBoundsDetails;
  stage: NglWrapper;
  points: ElasticOrGoBounds[];
  coords: [number, number, number][];
  links_component: NglComponent;
}

/** 
 * Source&Target are GO index + 1 !! 
 * 
 * {ngl_click_event}.atom.index + 1
 */
export function addBond({ source, target, itp_file, details, stage, points, coords, links_component }: AddOrRemoveBoundParams) {
  const go_i = source, go_j = target;
  const go_i_name = details.index_to_name[go_i], go_j_name = details.index_to_name[go_j];

  itp_file.headlines.push(`${go_i_name}    ${go_j_name}    1  0.7923518221  9.4140000000`);
 
  // Remove the old go bonds component
  stage.remove(links_component);
 
  // Add the relations i, j in the points
  points.push([details.index_to_real[source], details.index_to_real[target]]);
 
  // Redraw all the bounds (very quick)
  const { component: new_cmp, representation } = drawBondsInStage(stage, points, coords, 'go');
 
  // Save the new component
  return { component: new_cmp, representation, points };
}

/** 
 * Source&Target are REAL ATOM index 
 * 
 * {ngl_click_event}.type === "cylinder"
 * {ngl_click_event}.object.name.startsWith("[GO]")
 * const [source, target] = {ngl_click_event}.object.name.split('atoms ')[1].split('-').map(Number)
 */
export function removeBond({ source, target, itp_file, details, stage, points, coords, links_component }: AddOrRemoveBoundParams) {
  const go_i = details.real_to_index[source], go_j = details.real_to_index[target];
  const go_i_name = details.index_to_name[go_i], go_j_name = details.index_to_name[go_j];

  const index = itp_file.headlines.findIndex(e => {
    const [name_1, name_2,] = e.split(/\s+/).filter(l => l); 

    return (name_1 === go_i_name && name_2 === go_j_name) || (name_2 === go_i_name && name_1 === go_j_name);
  });

  if (index !== -1) {
    // Remove line at index {index}
    itp_file.headlines.splice(index, 1);
  }
 
  // Remove the old go bonds component
  stage.remove(links_component);
 
  // Remove the relations i, j in the points
  const new_points = points.filter(e => {
    if (e[0] === source && e[1] === target) return false;
    if (e[1] === source && e[0] === target) return false;
    
    return true;
  });
 
  // Redraw all the bounds (very quick)
  const { component: new_cmp, representation } = drawBondsInStage(stage, new_points, coords, 'go');
 
  // Save the new component
  return { component: new_cmp, representation, points: new_points };
}

/**
 * Remove all bonds from source
 * 
 * {source} is GO index + 1 !
 */
export function removeAllOfBond({ source, itp_file, details, stage, points, coords, links_component }: AddOrRemoveBoundParams) {
  const go_i = source;
  const real_atom_i = details.index_to_real[go_i];
  const go_i_name = details.index_to_name[go_i];

  const indexes: number[] = [];
  let cur_i = 0;
  for (const line of itp_file.headlines) {
    const [name_1, name_2,] = line.split(/\s+/).filter(e => e); 

    if (name_1 === go_i_name || name_2 === go_i_name) {
      indexes.push(cur_i);
    }

    cur_i++;
  }

  console.log("Will remove", indexes);

  for (const index of indexes) {
    // NON OPTIMAL: TODO?
    // Remove line at index {index}
    itp_file.headlines.splice(index, 1);
  }
 
  // Remove the old go bonds component
  stage.remove(links_component);
 
  // Remove the relations i, j in the points
  const new_points = points.filter(e => {
    if (e[0] === real_atom_i || e[1] === real_atom_i) return false;
    
    return true;
  });
 
  // Redraw all the bounds (very quick)
  const { component: new_cmp, representation } = drawBondsInStage(stage, new_points, coords, 'go');
 
  // Save the new component
  return { component: new_cmp, representation, points: new_points };
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
