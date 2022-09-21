import { Grid, Paper } from "@mui/material";
import * as React from "react";
import GeneratorMenu from './GeneratorMenu';
import PolymerViewer from './GeneratorViewer';
import { FormState, SimulationNode, SimulationLink } from './SimulationType';
import Warning from "./Dialog/warning";
import { simulationToJson } from './generateJson';
import { alarmBadLinks } from './ViewerFunction';
import SocketIo from 'socket.io-client';
import RunPolyplyDialog from "./Dialog/RunPolyplyDialog";
import ItpFile from 'itp-parser-forked'; import ApiHelper from "../../ApiHelper";
import AppBar from '@material-ui/core/AppBar';
import Typography from "@material-ui/core/Typography";
import { blue } from "@material-ui/core/colors";
import { Marger } from "../../helpers";
import FixLink from "./Dialog/FixLink";

// Pour plus tard
//https://github.com/korydondzila/React-TypeScript-D3/tree/master/src/components
//
// Objectif : faire pareil avec element selectionnable dans le bloc menu et ajoutable dans le bloc viewer si deposer
//https://javascript.plainenglish.io/how-to-implement-drag-and-drop-from-react-to-svg-d3-16700f01470c
interface StateSimulation {
  Simulation: d3.Simulation<SimulationNode, SimulationLink> | undefined,
  Warningmessage: string;
  customITP: { [name: string]: string };
  dialogWarning: string;
  nodesToAdd: SimulationNode[],
  linksToAdd: SimulationLink[],
  dataForForm: { [forcefield: string]: string[] },
  loading: Boolean,
  stepsubmit: number | undefined,
  itp: string,
  gro: string,
  pdb: string,
  top: string,
  itpfixing: boolean,
  errorLink: any[]
}


let currentAvaibleID = -1;
export let generateID = (): string => {
  currentAvaibleID++;
  return currentAvaibleID.toString()
}

export let decreaseID = (): void => {
  console.log("new currentAvaibleID", currentAvaibleID)
  currentAvaibleID--;
}

export default class GeneratorManager extends React.Component {
  createTheme(hint: 'light' | 'dark') {
    const bgclr = hint === 'dark' ? '#303030' : '#fafafa';

    return {
      palette: {
        type: hint,
        background: {
          default: bgclr,
        },
        primary: hint === 'dark' ? { main: blue[600] } : undefined,
      },
    };
  }

  //myViewerRef = React.createRef();

  state: StateSimulation = {
    Simulation: undefined,
    customITP: {},
    nodesToAdd: [],
    linksToAdd: [],
    dataForForm: {},
    Warningmessage: "",
    dialogWarning: "",
    loading: false,
    itpfixing: false,
    stepsubmit: undefined,
    top: "",
    itp: "",
    gro: "",
    pdb: "",
    errorLink: []
  }

  currentForceField = '';

  warningfunction = (message: string): void => {
    this.setState({ Warningmessage: message })
  }

  addprotsequence = (sequence: string) => {
    let i = 0;
    const fastaconv: { [aa: string]: string } = {
      'CYS': 'C', 'ASP': 'D', 'SER': 'S', 'GLN': 'Q', 'LYS': 'K',
      'ILE': 'I', 'PRO': 'P', 'THR': 'T', 'PHE': 'F', 'ASN': 'N',
      'GLY': 'G', 'HIS': 'H', 'LEU': 'L', 'ARG': 'R', 'TRP': 'W',
      'ALA': 'A', 'VAL': 'V', 'GLU': 'E', 'TYR': 'Y', 'MET': 'M'
    }

    // VERIFIER SI LE FORCEFIELD CONTIENT LES AA 
    // Aficher message d'erreur 
    for (let aa of Object.keys(fastaconv)) {
      if (!this.state.dataForForm[this.currentForceField].includes(aa)) {
        this.setState({ Warningmessage: "This residue (" + aa + " ) is not in this forcefield " + this.currentForceField })
        return
      }
    }

    const newMolecule: SimulationNode[] = [];
    let newlinks = [];

    // convert to node object et injecte dans la list
    for (let res of sequence) {
      //find 3 letter code 

      let res3: string = Object.keys(fastaconv).find((key: string) => fastaconv[key] === res)!
      let mol = {
        "resname": res3,
        "seqid": 0,
        "id": generateID(),
      };
      newMolecule.push(mol)

      // If last molecule do not create link with the next mol
      if (i > 0) {
        newlinks.push({
          "source": newMolecule[i - 1],
          "target": newMolecule[i]
        });
        if (newMolecule[i - 1].links) newMolecule[i - 1].links!.push(newMolecule[i]);
        else newMolecule[i - 1].links = [newMolecule[i]];

        if (newMolecule[i].links) newMolecule[i].links!.push(newMolecule[i - 1]);
        else newMolecule[i].links = [newMolecule[i - 1]];
        // add to state
      }
      i++

    }
    this.setState({ linksToAdd: newlinks });
    this.setState({ nodesToAdd: newMolecule });
  }

  addnodeFromJson = (jsonFile: any): void => {
    // Warning !! 
    // Attention a l'id qui est different entre la nouvelle representation et l'ancien json 
    // besoin de faire une table de correspondance ancien et nouveau id

    //Check forcefield !! 
    if (this.currentForceField === '') {
      console.log("this.currentForceField === ")
      this.currentForceField = jsonFile.forcefield
    }

    else if ((this.currentForceField !== jsonFile.forcefield) && (jsonFile.forcefield !== undefined)) {
      this.setState({ Warningmessage: "Wrong forcefield " + this.currentForceField + " different than " + jsonFile.forcefield })
    }
    else {
      const idModification: Record<string, string | number>[] = [];

      const newMolecule: SimulationNode[] = [];
      for (let node of jsonFile.nodes) {
        const newid = generateID()
        idModification.push({
          oldID: node.id,
          newID: newid,
        })

        node.id = newid
        newMolecule.push(node)
      }

      let newlinks = []
      for (let link of jsonFile.links) {
        //Transform old id to new id ! 
        const sourceNewID = idModification.filter((d: any) => (d.oldID === link.source))[0].newID
        const targetNewID = idModification.filter((d: any) => (d.oldID === link.target))[0].newID
        let node1 = newMolecule.filter((d: SimulationNode) => (d.id === sourceNewID))[0]
        let node2 = newMolecule.filter((d: SimulationNode) => (d.id === targetNewID))[0]
        newlinks.push({
          "source": node1,
          "target": node2
        });

        if (node1.links) node1.links.push(node2);
        else node1.links = [node2];

        if (node2.links) node2.links.push(node1);
        else node2.links = [node1];

      }
      this.setState({ linksToAdd: newlinks });
      this.setState({ nodesToAdd: newMolecule });
    }
  }

  addNEwMolFromITP = (itpstring: string) => {
    // Besoin de traiter different l'information 
    // Ajouter un -seqf
    // json avevc champs supp 
    // "from_itp":"nom de la molecule"
    // "id": 0...1


    const itp = ItpFile.readFromString(itpstring);

    let molname = ""
    for (let l of itp.getField('moleculetype')) {
      if (!l.startsWith(";")) {
        molname = l.split(" ")[0]
      }
    }
    console.log("add this custom molecule  ", molname)
    const atoms = itp.getField('atoms', true)
    const links = itp.getField('bonds')

    //Add molname inside the list of residue that you can choose
    // 1st generer une liste de noeuds
    console.log("Number of atoms", atoms.length, "Number of links", links.length)
    const newMolecules: SimulationNode[] = [];

    let dictionary: { [name: string]: string } = this.state.customITP
    dictionary[molname] = itpstring
    this.setState({ customITP: dictionary })

    // convert to node object et injecte dans la list
    //Voila la forme du bordel
    // 1 P5    1 POPE NH3  1  0.0
    //Super pratique 
    //Garder en memoire l'id d'avant sur l'itp 
    let oldid = -1

    for (let nodestr of atoms) {
      const nodelist = nodestr.split(' ').filter((e) => { return e !== "" })
      //check si c'est une bead de l'ancien residu ou pas
      if (parseInt(nodelist[2]) === 0) { }

      if (oldid === parseInt(nodelist[2])) continue

      let mol = {
        "resname": nodelist[3],
        "seqid": 0,
        "id": generateID(),
        "from_itp": molname,
      };
      newMolecules.push(mol)
      oldid = parseInt(nodelist[2])
    }

    console.log(newMolecules)
    let newlinks = []
    // 3rd faire la liste des liens
    if (newMolecules.length !== 1) {
      for (let linkstr of links) {

        if (linkstr.startsWith(";")) continue
        else if (linkstr.startsWith("#")) continue
        else {
          const link = linkstr.split(' ').filter((e) => { return e !== "" })

          let idlink1 = parseInt(atoms[parseInt(link[0]) - 1].split(' ').filter((e) => { return e !== "" })[2])
          let idlink2 = parseInt(atoms[parseInt(link[1]) - 1].split(' ').filter((e) => { return e !== "" })[2])

          let node1 = newMolecules[idlink1 - 1]
          let node2 = newMolecules[idlink2 - 1]

          if (idlink1 !== idlink2) {
            newlinks.push({
              "source": newMolecules[idlink1 - 1],
              "target": newMolecules[idlink2 - 1]
            });

            if (node1.links) node1.links.push(node2);
            else node1.links = [node2];

            if (node2.links) node2.links.push(node1);
            else node2.links = [node1];
          }
        }
      }
      this.setState({ nodesToAdd: newMolecules, linksToAdd: newlinks });
    }
    this.setState({ nodesToAdd: newMolecules });

    this.state.dataForForm[this.currentForceField].push(molname)

  }

  addFromITP = (itpstring: string) => {
    const itp = ItpFile.readFromString(itpstring);

    const atoms = itp.getField('atoms')
    const links = itp.getField('bonds')
    let good = true
    // 1st generer une liste de noeuds

    console.log("atoms", atoms.length)
    console.log("links", links.length)
    const newMolecules: SimulationNode[] = [];

    // convert to node object et injecte dans la list
    //Voila la forme du bordel
    // 1 P5    1 POPE NH3  1  0.0
    //Super pratique 
    //Garder en memoire l'id d'avant sur l'itp 
    let oldid = 0

    for (let nodestr of atoms) {
      const nodelist = nodestr.split(' ').filter((e) => { return e !== "" })
      // 2nd check s'ils sont inside le forcefield 
      if (!(this.state.dataForForm[this.currentForceField].includes(nodelist[3]))) {
        this.setState({ Warningmessage: nodelist[3] + " not in " + this.currentForceField })
        console.log(nodelist[3] + " not in " + this.currentForceField)
        good = false
        break
      }
      else if (nodelist[2] !== oldid.toString()) {
        let mol = {
          "resname": nodelist[3],
          "seqid": 0,
          "id": generateID(),
        };

        newMolecules.push(mol)
        oldid = parseInt(nodelist[2])
      }
    }

    if (good) {

      let newlinks = []
      // 3rd faire la liste des liens
      for (let linkstr of links) {
        if (linkstr.startsWith(";")) continue
        else if (linkstr.startsWith("#")) continue
        else {
          const link = linkstr.split(' ').filter((e) => { return e !== "" })

          console.log("add this link ", link)
          let idlink1 = parseInt(atoms[parseInt(link[0]) - 1].split(' ').filter((e) => { return e !== "" })[2])
          let idlink2 = parseInt(atoms[parseInt(link[1]) - 1].split(' ').filter((e) => { return e !== "" })[2])

          let node1 = newMolecules[idlink1 - 1]
          let node2 = newMolecules[idlink2 - 1]

          if (idlink1 !== idlink2) {
            newlinks.push({
              "source": newMolecules[idlink1 - 1],
              "target": newMolecules[idlink2 - 1]
            });

            if (node1.links) node1.links.push(node2);
            else node1.links = [node2];

            if (node2.links) node2.links.push(node1);
            else node2.links = [node1];

          }
        }
      }

      this.setState({ nodesToAdd: newMolecules });
      this.setState({ linksToAdd: newlinks });


    }
  }

  returnITPinfo = (itpstring: string) => {
    const itp = ItpFile.readFromString(itpstring);
    const atoms = itp.getField('atoms')
    const links = itp.getField('bonds')
    let good = true
    // 1st generer une liste de noeuds

    console.log("atoms", atoms.length)
    console.log("links", links.length)
    const newMolecules: SimulationNode[] = [];

    // convert to node object et injecte dans la list
    //Voila la forme du bordel
    // 1 P5    1 POPE NH3  1  0.0
    //Super pratique 
    //Garder en memoire l'id d'avant sur l'itp 
    let oldid = 0

    let id = 0
    for (let nodestr of atoms) {
      const nodelist = nodestr.split(' ').filter((e) => { return e !== "" })
      // 2nd check s'ils sont inside le forcefield 
      if (!(this.state.dataForForm[this.currentForceField].includes(nodelist[3]))) {
        this.setState({ Warningmessage: nodelist[3] + " not in " + this.currentForceField })
        console.log(nodelist[3] + " not in " + this.currentForceField)
        good = false
        break
      }
      else if (nodelist[2] !== oldid.toString()) {
        let mol = {
          "resname": nodelist[3],
          "seqid": 0,
          "id": id.toString()
        };

        newMolecules.push(mol)
        oldid = parseInt(nodelist[2])
        id++
      }
    }

    if (good) {

      let newlinks = []
      // 3rd faire la liste des liens
      for (let linkstr of links) {
        if (linkstr.startsWith(";")) continue
        else if (linkstr.startsWith("#")) continue
        else {
          const link = linkstr.split(' ').filter((e) => { return e !== "" })

          let idlink1 = parseInt(atoms[parseInt(link[0]) - 1].split(' ').filter((e) => { return e !== "" })[2])
          let idlink2 = parseInt(atoms[parseInt(link[1]) - 1].split(' ').filter((e) => { return e !== "" })[2])

          let node1 = newMolecules[idlink1 - 1]
          let node2 = newMolecules[idlink2 - 1]

          if (idlink1 !== idlink2) {
            newlinks.push({
              "source": newMolecules[idlink1 - 1],
              "target": newMolecules[idlink2 - 1]
            });

            if (node1.links) node1.links.push(node2);
            else node1.links = [node2];

            if (node2.links) node2.links.push(node1);
            else node2.links = [node1];

          }
        }
      }
      return [newMolecules, newlinks]
    }
  }

  setForcefield = (ff: string): void => {
    if ((this.currentForceField === '') || (this.currentForceField === ff)) {
      this.currentForceField = ff
    }
    else if (this.state.nodesToAdd.length === 0) {

      this.currentForceField = ff
    }
    else {
      this.setState({ Warningmessage: "Change forcefield to " + this.currentForceField })
    }
  }

  giveConnexeNode = (node: SimulationNode) => {
    //Give one node and class on focus rest of polymer nodes 
    //Return one selection of connexe nodes

    //clean the previous selected nodes

    // Create a list and add our initial node in it
    let s = [];
    s.push(node);
    // Mark the first node as explored
    let explored: any[] = [];
    //List of id 
    let connexeNodesId = new Set();
    connexeNodesId.add(node.id);
    //Chek si le noeud n'est pas connecter aux autres 
    if (node.links === undefined) {
      connexeNodesId.add(node.id);
    }
    else {
      //continue while list of linked node is not emphty 
      while (s.length !== 0) {
        let firstNode = s.shift();
        //console.log(firstNode)
        if (firstNode !== undefined) {
          for (let connectedNodes of firstNode!.links!) {
            s.push(connectedNodes);
            connexeNodesId.add(connectedNodes.id);
          }
          explored.push(firstNode)
          s = s.filter(val => !explored.includes(val));
        }
      }
    }
    // Return a selection of one connexe graph 
    // Maybe juste one node
    return connexeNodesId
  }


  addnode = (toadd: FormState): void => {
    //Check forcefield 
    if (toadd.numberToAdd > 500) {
      this.setState({ Warningmessage: "Whaou !!! To many nodes ! (limite 500)" })
    }
    else if ((this.currentForceField === '') || (this.currentForceField === toadd.forcefield)) {
      this.currentForceField = toadd.forcefield;
      const newMolecule: SimulationNode[] = [];
      let newlinks = [];

      // convert to node object et injecte dans la list
      for (let i = 0; i < toadd.numberToAdd; i++) {
        let mol = {
          "resname": toadd.moleculeToAdd,
          "seqid": 0,
          "id": generateID(),
        };
        newMolecule.push(mol)

        // If last molecule do not create link with the next mol
        if (i > 0) {
          newlinks.push({
            "source": newMolecule[i - 1],
            "target": newMolecule[i]
          });
          if (newMolecule[i - 1].links) newMolecule[i - 1].links!.push(newMolecule[i]);
          else newMolecule[i - 1].links = [newMolecule[i]];

          if (newMolecule[i].links) newMolecule[i].links!.push(newMolecule[i - 1]);
          else newMolecule[i].links = [newMolecule[i - 1]];
          // add to state
        }

      }
      this.setState({ linksToAdd: newlinks });
      this.setState({ nodesToAdd: newMolecule });
    }
    else {

      this.setState({ Warningmessage: "Change forcefield to " + this.currentForceField })
    }
  }

  addlink = (id1: string, id2: string): void => {
    //1st step find correspondant nodes objects 
    const listnode = this.state.Simulation?.nodes().concat(this.state.nodesToAdd);
    const node1 = listnode?.find(element => element.id === id1);
    const node2 = listnode?.find(element => element.id === id2);

    if (node1 === undefined) {
      this.setState({ Warningmessage: "Nodes id number " + id1 + " does not exist" });
      return
    }
    if (node2 === undefined) {
      this.setState({ Warningmessage: "Nodes id number " + id2 + " does not exist" });
      return
    }

    let newlinks = [{
      "source": node1,
      "target": node2
    }];
    if (node1.links) node1.links.push(node2);
    else node1.links = [node2];

    if (node2.links) node2.links.push(node1);
    else node2.links = [node1];

    this.setState({ linksToAdd: newlinks });
  }

  closeDialog = (): void => {

    this.setState({ stepsubmit: undefined, loading: false, itp: "", gro: "", pdb: "", dialogWarning: "" })

  }

  closeFixlink = (): void => {
    this.setState({ itpfixing: false })
  }


  ClickToSend = (): void => {
    console.log("Go to server");
    this.setState({ stepsubmit: 0 })
    if (this.state.Simulation === undefined) {
      this.setState({ Warningmessage: "Error Simulation undefined " })
    }
    else {
      // Make dialog box appaer
      this.setState({ loading: true })
    }

  }

  Send = (box: string, name: string, number: string): void => {

    //Check if there is more than one polymer 
    const connexe1 = this.giveConnexeNode(this.state.Simulation!.nodes()[1])
    const nodeNumber = this.state.Simulation?.nodes().length
    if (nodeNumber !== connexe1.size) {
      console.log("Not connexe ! Try to send 2 trucs")
      //Get the first 
      console.log(connexe1)
    }

    this.setState({ stepsubmit: 1 })

    const jsonpolymer = simulationToJson(this.state.Simulation!, this.currentForceField)
    let data = {}
    if (Object.keys(this.state.customITP).length === 0) {
      data = {
        polymer: jsonpolymer,
        box: box,
        name: name,
        number: number
      }
    }
    else {
      data = {
        polymer: jsonpolymer,
        box: box,
        name: name,
        number: number,
        customITP: this.state.customITP
      }
    }

    const socket = SocketIo.connect("http://localhost:4123");
    socket.emit('runpolyply', data)

    socket.on("top", (topfilestr: string) => {
      this.setState({ top: topfilestr })
    })


    socket.on("itp", (res: string) => {
      if (res !== "") {
        this.setState({ stepsubmit: 2 })
        this.setState({ itp: res })
        //Besoin de verifier que l'itp fourni par polyply est le meme polymere que celui afficher
        // const jsonpolymer = simulationToJson(this.state.Simulation!, this.currentForceField)

        // const klcdwu = this.returnITPinfo(res)

        // console.log("this.returnITPinfo(res)", klcdwu)
        // const NBatomsITP: number = klcdwu![0].length
        // const NBlinksITP: number = klcdwu![1].length
        // const NBatomsSIM: number = jsonpolymer.nodes.length
        // const NBlinksSIM: number = jsonpolymer.links.length

        // console.log(NBatomsITP, NBlinksITP, NBatomsSIM, NBlinksSIM)
        // if (NBatomsSIM !== NBatomsITP) {
        //   this.setState({ dialogWarning: "WHOUWHOUWHOU alert au node" })

        // }
        // else if (NBlinksSIM !== NBlinksITP) {
        //   this.setState({ dialogWarning: "Probleme de lien entre le fichier generé par polyply et la representation" })
        //   //Check missing links
        //   console.log(this.state.Simulation)
        //   socket.emit("continue")

        // }
        // else {
        //   socket.emit("continue")
        // }
        socket.emit("continue", this.state.itp)
        console.log("continue")
      }
    })

    socket.on("gro", (data: string) => {
      console.log("gro !")
      this.setState({ gro: data })
      this.setState({ stepsubmit: 3 })
    })

    socket.on("pdb", (data: string) => {
      this.setState({ pdb: data })
      this.setState({ stepsubmit: 4 })
    })

    socket.on("oups", async (dicoError: any) => {
      this.setState({ stepsubmit: undefined })
      this.setState({ loading: false })
      
      //Si il y a des erreur, on affiche un warning 

      //check 
      if (dicoError.errorlinks.length > 0) {
        let listerror = []
        //To show error on the svg
        for (let i of dicoError.errorlinks) {
          listerror.push([i[1].toString(), i[3].toString()])
          alarmBadLinks(i[1].toString(), i[3].toString())
        }
        this.warningfunction("Fail ! Wrong links : " + dicoError.errorlinks + ". You can correct this mistake with \"click right\" -> \"Remove bad links\" or with \"fixlink\" button in red")
        this.setState({ itp: dicoError.itp, errorLink: listerror })
        //socket.emit("continue",)

      }
      else if (dicoError.message.length) {
        console.log(dicoError.message)
        this.setState({ Warningmessage: dicoError.message })
      }

      else {
        // (dicoError.disjoint === true) 
        this.setState({ Warningmessage: "Fail ! Your molecule consists of disjoint parts.Perhaps links were not applied correctly. Peut etre une option a ajouter pour mettre 2 molecule dans le melange ????????" })
      }

    })
  }

  componentDidMount() {
    ApiHelper.request('polymergenerator/data')
      .then((value: JSON) => { console.log(value); this.setState({ dataForForm: value }) })
      .catch((err: any) => { console.log(err); this.setState({ dataForForm: {} }) });


    // this.getDataForcefield()
    //   .then((value: JSON) => this.setState({ dataForForm: value }))
    //   .catch((err: any) => { console.log(err); this.setState({ dataForForm: {} }) });
  }

  // fetching the GET route from the Express server which matches the GET route from server.js
  getDataForcefield = async () => {
    const response = await fetch('api/polymergenerator/data');
    const body = await response.json();
    if (response.status !== 200) {
      throw Error(body.message)
    }
    return body;
  };

  fixlinkcomponentappear = () => {
    this.setState({ itpfixing: true })
  }

  render() {


    return (

      <Grid
        container
        component="main" >
        <Warning
          reponse={undefined}
          message={this.state.Warningmessage}
          close={() => { this.setState({ Warningmessage: "" }) }}>

        </Warning>

        <AppBar position="static">
          <Marger size="1rem" />
          <Typography variant="h2" >Polymer Generator  </Typography>
          <Marger size="1rem" />
        </AppBar>


        <Grid item md={4} component={Paper} elevation={6} square>

          <GeneratorMenu
            errorlink={this.state.errorLink}
            addFromITP={this.addFromITP}
            addprotsequence={this.addprotsequence}
            setForcefield={this.setForcefield}
            addnodeFromJson={this.addnodeFromJson}
            addnode={this.addnode}
            addlink={this.addlink}
            send={this.ClickToSend}
            customITPS={this.state.customITP}
            dataForceFieldMolecule={this.state.dataForForm}
            warningfunction={this.warningfunction}
            addNEwMolFromITP={this.addNEwMolFromITP}
            addNEwCustomLink={(name: string, itpstring: string) => { let dictionary: { [name: string]: string; } = this.state.customITP; dictionary[name] = itpstring; this.setState({ customITP: dictionary }); }}
            fixlinkcomponentappear={this.fixlinkcomponentappear} />

          {this.state.loading ? (
            <RunPolyplyDialog
              send={this.Send}
              currentStep={this.state.stepsubmit}
              itp={this.state.itp}
              gro={this.state.gro}
              pdb={this.state.pdb}
              close={this.closeDialog}
              top={this.state.top}
              warning={this.state.dialogWarning}> </RunPolyplyDialog>
          ) : (<></>)
          }

          {this.state.itpfixing ? (
            <FixLink
              itp={this.state.itp}
              close={this.closeFixlink}
              error={this.state.errorLink} > </FixLink>
          ) : (<></>)
          }




        </Grid>
        <Grid item xs={7} style={{ height: "100vw" }}>
          <PolymerViewer
            warningfunction={this.warningfunction}
            forcefield={this.currentForceField}
            getSimulation={(SimulationFromViewer: d3.Simulation<SimulationNode, SimulationLink>) => { this.setState({ Simulation: SimulationFromViewer }) }}
            newNodes={this.state.nodesToAdd}
            newLinks={this.state.linksToAdd}
          />
        </Grid>


      </Grid >
    );
  }
}