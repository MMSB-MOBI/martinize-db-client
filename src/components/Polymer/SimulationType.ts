import { SimulationNodeDatum } from 'd3';

export interface FormState {
  forcefield: string;
  moleculeToAdd: string;
  numberToAdd: number;
}

export interface SimulationNode extends SimulationNodeDatum {
  resname: string,
  seqid: number,
  links?: SimulationNode[],
  id: string
  x?: number,
  y?: number,
  fx?: number | null,
  fy?: number | null,
  group?: number,
}

export interface SimulationLink extends SimulationNodeDatum {
  source: SimulationNode,
  target: SimulationNode
}

export interface SimulationGroup extends SimulationNodeDatum {
  id: number,
  nodes?: SimulationNode[],
  nodesD3?: d3.Selection<SVGCircleElement, SimulationNode, SVGSVGElement, unknown>
}