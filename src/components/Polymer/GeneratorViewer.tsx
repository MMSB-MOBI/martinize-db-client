import * as React from "react";
import * as d3 from "d3";
import CustomContextMenu from "./Viewer/CustomContextMenu";
import { SimulationNode, SimulationLink, SimulationGroup } from './SimulationType';

import { initSimulation, reloadSimulation, addNodeToSVG, addLinkToSVG, setSVG, setRadius, removeNode } from './ViewerFunction';
import { decreaseID, generateID } from './GeneratorManager'
import './GeneratorViewer.css';

interface propsviewer {

  forcefield: string,
  newNodes: SimulationNode[];
  newLinks: SimulationLink[];
  warningfunction: (arg: any) => void;
  getSimulation: (arg: any) => void;
}

interface statecustommenu {
  x: number,
  y: number,
  nodeClick: SimulationNode | undefined,
  hullClick: Element | undefined,

  show: boolean,
}

export default class GeneratorViewer extends React.Component<propsviewer, statecustommenu> {

  state: statecustommenu = {
    x: 0,
    y: 0,
    nodeClick: undefined,
    hullClick: undefined,
    show: false,

  };


  // Ajouter un point d'exclamation veut dire qu'on est sur que la valeur n'est pas nul
  ref!: SVGSVGElement;
  frame!: HTMLDivElement;
  frameCount = 0

  taille = 800;
  nodeRadius = 50;
  currentnodeRadius = 50;
  mouseX = 0;
  mouseY = 0;
  prevPropsNewnode: any = null;
  prevPropsNewLink: any = null;

  // Init simulation 
  simulation = initSimulation(this.taille, this.currentnodeRadius);

  componentDidMount() {

    //Draw svg frame
    d3.select(this.ref)
      .attr("style", "outline: thin solid grey;")
      .attr("width", this.taille)
      .attr("height", this.taille)

    console.log("InitSVG");

    //Define brush behaviour
    const brush = d3.brush();
    const gBrush = d3.select(this.ref).append("g")
      .attr("class", "brush")
    gBrush
      .call(brush
        .on("start brush", (event: any) => {
          //this.simulation.stop(); //Stop simulation when brush
          const selection: any = event.selection; //Get brush zone coord [[x0, y0], [x1, y1]],
          if (selection) {
            //unselect nodes 
            d3.select(this.ref)
              .selectAll("path")
              .attr("class", "nodes");

            //select all node inside brush zone 
            d3.select(this.ref)
              .selectAll("path")
              .filter((d: any) => ((d.x < selection[1][0]) && (d.x > selection[0][0]) && (d.y < selection[1][1]) && (d.y > selection[0][1])))
              .attr("class", "onfocus");

            //Faire verif :
            //Si 2 noeuds sont selectionnés le lien qui les unis est selectionné par defaut 
            // mysvg.selectAll("line")
            //   .filter((d: any) => ((d.x < selection[1][0]) && (d.x > selection[0][0]) && (d.y < selection[1][1]) && (d.y > selection[0][1])))
            //   .attr("class", "onfocus");
            // Si un noeud sort de la zone enlever le onfocus
          }
        })
        .on("end", (event: any) => {
          if (!event.selection) return;
          console.log(event)
          brush.clear(gBrush)
        })
      );

    d3.select(this.ref).call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.1, 1.8]).on("zoom", (event) => {
      //On recupere la valeur de zoom 
      const zoomValue = event.transform.k;
      //On modifie le rayon en fonction du zoom 
      this.currentnodeRadius = this.nodeRadius * zoomValue;
      console.log("zoom value", zoomValue);

      d3.select(this.ref).selectAll("circle")
        // .each( (d: SimulationNode) => {
        //   console.log("r", node.attr("r"))
        //   const newr = parseInt(node.attr("r")) * zoomValue / parseInt(node.attr("r"))
        //   console.log("newr", newr)
        //   const newstrokew = parseInt(node.attr("r")) * zoomValue / 4
        //   node.attr("r", newr)
        //   node.attr("stroke-width", newstrokew))
        .attr("r", this.currentnodeRadius)
        .attr("stroke-width", this.currentnodeRadius / 4)

      d3.select(this.ref).selectAll("line")
        .attr("stroke-width", this.currentnodeRadius / 3)

      //Change simulation property
      this.simulation.force("link", d3.forceLink()
        .distance(this.currentnodeRadius * 2.5))
        .force("x", d3.forceX(this.taille / 2).strength(0.02 / zoomValue))
        .force("y", d3.forceY(this.taille / 2).strength(0.02 / zoomValue))

      setRadius(this.currentnodeRadius)
      this.UpdateSVG()
    }));
    setRadius(this.currentnodeRadius)
    setSVG(this.ref);
  }

  componentDidUpdate(prevProps: propsviewer, prevStates: statecustommenu) {
    //Check state and props 
    if ((prevProps.newNodes !== this.props.newNodes) || (prevProps.newLinks !== this.props.newLinks)) {
      this.UpdateSVG()
    }
  }


  // Define graph property
  UpdateSVG = () => {
    // Verifier si on doit bien ajouter des props ou si c'est deja fait 
    if (this.prevPropsNewLink !== this.props.newLinks) {
      let Linktoadd: SimulationLink[] = [];
      for (let link of this.props.newLinks) {
        // if (checkLink(link.source, link.target)) {
        Linktoadd.push(link)
        // }
      }
      addLinkToSVG(Linktoadd)
    }
    // Si des news props apparaissent depuis manager on ajoute les noeuds !!!
    if (this.prevPropsNewnode !== this.props.newNodes) {
      addNodeToSVG(this.props.newNodes, this.simulation, this.UpdateSVG)

      //Keep the previous props in memory
      this.prevPropsNewLink = this.props.newLinks;
      this.prevPropsNewnode = this.props.newNodes;
    }

    // Build a list of grouped nodes instead of compute it a each iteration
    const groups: SimulationGroup[] = [];

    const svgPath = [];
    d3.select(this.ref)
      .selectAll('path.area')
      .each(function () {
        svgPath.push(this);
      });

    if (svgPath.length !== 0) {
      for (let i = 1; i <= svgPath.length; i++) {
        let selectedNodes: SimulationNode[] = [];
        d3.select(this.ref).selectAll("path")
          .filter((d: any) => (d.group === i))
          .each((d: any) => {
            selectedNodes.push(d);
          });
        //If nodes was removed
        if (selectedNodes.length !== 0) {
          groups.push({ id: i, nodes: selectedNodes })
        }
        else {
          d3.select(this.ref).selectAll('path.area').filter((g: any) => parseInt(g.group) === i).remove()
        }
      }
    }
    //Send new simulation to Manager component
    this.props.getSimulation(this.simulation)
    reloadSimulation(this.simulation, groups)
  }

  handleClose = () => {
    this.setState({ show: false, nodeClick: undefined, hullClick: undefined })
  };

  pasteThesedNodes = (listNodesToPaste: any, idStarting?: string) => {
    console.log("pasteSelectedNode")
    const idModification: any[] = [];
    let oldNodes: SimulationNode[] = []
    //On parcours la selection svg des noeuds a copier 
    //et on inscrit l'ancien id et le nouveau dans une liste idModification
    if (idStarting) {
      let upid = 0
      listNodesToPaste
        .each((d: SimulationNode) => {
          let newId = Number(idStarting) + upid
          oldNodes.push(d)
          idModification.push({
            oldID: d.id,
            resname: d.resname,
            newID: newId.toString(),
          })
          upid++
        });
    }
    else {
      listNodesToPaste
        .each((d: SimulationNode) => {
          oldNodes.push(d)
          idModification.push({
            oldID: d.id,
            resname: d.resname,
            newID: generateID(),
          })
        });
    }

    // console.log("listNodesToPaste", listNodesToPaste);
    // console.log("oldNodes", oldNodes);
    // console.log("idModification", idModification);
    //Create new node
    let newNodes = []
    for (let node of oldNodes) {
      const oldid = node.id;
      const newid = idModification.filter((d: any) => (d.oldID === oldid))[0].newID
      console.log(node, oldid, newid)
      let newNode: SimulationNode = {
        resname: node.resname,
        seqid: 0,
        id: newid
      }
      newNodes.push(newNode)
    }

    console.log("newNodes", newNodes)

    addNodeToSVG(newNodes, this.simulation, this.UpdateSVG)
    // and then addLink
    // create newlink
    let newlinks: SimulationLink[] = []
    for (let oldnode of oldNodes) {
      const newid = idModification.filter((d: any) => (d.oldID === oldnode.id))[0].newID
      const newnodesource = newNodes.filter((d: any) => (d.id === newid))[0]
      if (oldnode.links !== undefined) {
        for (let oldnodelink of oldnode.links) {
          //parmis tous les liens de l'ancien noeud je parcours et j'en creer de nouveau 
          let newtarget = idModification.filter((d: any) => (d.oldID === oldnodelink.id))[0]
          if (newtarget) {
            const newnodetarget = newNodes.filter((d: any) => (d.id === newtarget.newID))[0]
            let newlink: SimulationLink = {
              source: newnodesource,
              target: newnodetarget
            }
            //check if the link doesnt exist 
            newlinks.push(newlink)
            // Link ajouté en double Il faut check si les source target ne sont pas identiques
            if (newnodesource.links === undefined) newnodesource.links = [newnodetarget]
            else newnodesource.links!.push(newnodetarget)
          }
        }
      }

    }
    addLinkToSVG(newlinks)
    this.UpdateSVG()
  }


  handleContextMenu = (event: React.MouseEvent) => {
    console.log("Custom menu");
    event.preventDefault();
    const element = document.elementFromPoint(event.clientX, event.clientY);
    console.log(element)
    if (element?.className === "nodes") {
      const nodeToRm: any = d3.select(element).data()[0]
      this.setState({ x: event.clientX, y: event.clientY, nodeClick: nodeToRm, show: true, });
    }
    else if (element?.tagName === "path") {
      this.setState({ x: event.clientX, y: event.clientY, show: true, hullClick: element });
    }
    else {
      this.setState({ x: event.clientX, y: event.clientY, show: true });
    }
  };

  render() {
    const ifContextMenuShouldAppear = (show: boolean) => {
      if (show) {
        return <CustomContextMenu
          forcefield={this.props.forcefield}
          x={this.state.x}
          y={this.state.y}
          nodeClick={this.state.nodeClick}
          hullClick={this.state.hullClick}
          svg={d3.select(this.ref)}
          handlePaste={this.pasteThesedNodes}
          handleUpdate={this.UpdateSVG}
          simulation={this.simulation}>
        </CustomContextMenu>;
      }
      else return;
    }

    const clickAncCloseMenu = (event: React.MouseEvent) => {
      if (this.state.show) {
        this.handleClose()
      }
    }

    const handleDelete = (event: React.KeyboardEvent) => {
      if (event.key === "Delete") {
        d3.select(this.ref).selectAll<SVGCircleElement, SimulationNode>('circle.onfocus').each((node: SimulationNode) => {
          removeNode(node, this.UpdateSVG, decreaseID);
        })
      }
    }

    return (
      <div className="svg"
        onKeyDown={(e: React.KeyboardEvent) => handleDelete(e)}
        tabIndex={0}
        onClick={(e) => { clickAncCloseMenu(e) }}
        onContextMenu={this.handleContextMenu}
        style={{ cursor: 'context-menu' }}
        ref={(ref: HTMLDivElement) => this.frame = ref} >

        <svg className="container" id="svg" ref={(ref: SVGSVGElement) => this.ref = ref}></svg>

        {ifContextMenuShouldAppear(this.state.show)}
      </div >
    );
  }

}