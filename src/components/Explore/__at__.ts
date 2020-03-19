import React from 'react';

function calcSgrna(positions: number[], sgrna_length: number) {
  const mapping: Map<number, number> = new Map;
  const pos_with_end: [number, number][] = [];

  for (const p of positions) {
    pos_with_end.push([p, 1]);
    pos_with_end.push([p + sgrna_length, -1]);
  }
  
  pos_with_end.sort((a, b) => a[0] - b[0]);

  let previous_sgrna_count = 0;
  let previous_coord = 0;

  for (const [cur_pos, inc] of pos_with_end) {
    mapping.set(previous_coord, previous_sgrna_count);

    previous_sgrna_count += inc;
    previous_coord = cur_pos;
  }

  mapping.set(previous_coord, previous_sgrna_count);

  return mapping;
}

function getAtPosition(positions: [number, number][], i: number) {
  let upper = positions.length - 1;
  let lower = 0;

  while (true) {
    const sentinel = Math.floor((upper + lower) / 2);

    const item_at_sentinel = positions[sentinel];
    const previous = positions[sentinel - 1];

    if (lower > upper) {
      // Recherche le dernier item.
      return positions[positions.length - 1][1];
    }

    if (previous !== undefined) {
      if (previous[0] <= i && item_at_sentinel[0] > i) {
        // C'est ce i
        return previous[1];
      }

      // On lance la recherche dichotomique.
      // Si notre i > item_at_sentinel, alors on recherche entre sentinel et upper
      // Sinon, on recherche entre lower et sentinel
      if (i > previous[0]) {
        lower = sentinel + 1;
      }
      else {
        upper = sentinel;
      }
    }
    else {
      // sentinel === 0
      return item_at_sentinel[1];
    }
  }
} 

function getAllPositions(positions: Map<number, number>, genome_length: number) {
  const breakpoints = [...positions.keys()];
  let current_breakpoint_i = 0;

  const mapping: { [position: number]: number } = {};

  for (let i = 0; i < genome_length; i++) {
    let cur_pos_value = positions.get(breakpoints[current_breakpoint_i])!;
    const next_pos = breakpoints[current_breakpoint_i + 1];
    
    if (next_pos) {
      // Il y a une position suivante qui existe par rapport à la pos actuelle
      if (i >= next_pos) {
        // Si i >= à la position suivante, alors on décale
        // la position actuelle à la pos suivante
        current_breakpoint_i++;
        cur_pos_value = positions.get(breakpoints[current_breakpoint_i])!;
      }
    }

    mapping[i] = cur_pos_value;
  }

  return mapping;
}
