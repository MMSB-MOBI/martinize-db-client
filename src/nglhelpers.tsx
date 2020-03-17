import { Stage, Component } from '@mmsb/ngl';
import * as ngl from '@mmsb/ngl';

export function applyUserRadius(radius: { [name: string]: number }) {
  // Apply radius
  const atoms = ngl.STRUCTURES_CONSTANTS.AtomicNumbers;
  const vdwradius = ngl.STRUCTURES_CONSTANTS.VdwRadii;

  // Get the number of the last item
  let i = Object.keys(vdwradius).length + 1;
  
  for (const atom in radius) {
    if (atom in atoms) {
      continue;
    }

    atoms[atom] = i;
    vdwradius[i] = radius[atom] * 10;
    console.log("Set atom", atom, "to", radius[atom]);
    i++;
  }
}