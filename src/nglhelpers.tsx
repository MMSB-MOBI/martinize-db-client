// import { Stage, Component } from '@mmsb/ngl';
import * as ngl from '@mmsb/ngl';

export interface UserRadius { 
  [name: string]: number 
}

export function applyUserRadius(radius: UserRadius) {
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
    atoms[atom.toLocaleUpperCase()] = i;
    vdwradius[i] = radius[atom];
    i++;
  }
}
