export default interface polymerobj {
  nodes: node[];
  links: link[];
  addnode : (arg0: resform) => void,
  rmnode : (arg0: any) => void,
  rmlink : (id1: string , id2 : string) => void
}

type resform = {
    forcefield: string;
    moleculeToAdd: string;
    numberToAdd: number;
  }

type node = {
  resname: String,
  seqid: 0,
  id: Number,
  cx: Number,
  cy: Number
}

type link = {
  source: Number,
  target: Number
}

