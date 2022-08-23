import * as React from "react";
import * as d3 from "d3";
import CustomContextMenu from "./Viewer/CustomContextMenu";
import { SimulationNode, SimulationLink, SimulationGroup } from './SimulationType';
import { initSVG, initSimulation, reloadSimulation } from './Viewer/SimulationSVGFunction';
import { addNodeToSVG, addLinkToSVG, setSVG, setRadius } from './addNodeLink';
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
  nodeRadius = 10;
  currentnodeRadius = 10;
  mouseX = 0;
  mouseY = 0;
  prevPropsNewnode: any = null;
  prevPropsNewLink: any = null;

  /* Quad tree structure
  tree =  d3.quadtree<SimulationNode>();
  if(this.props.nodes.length > 0) {
    this.tree
    .x((d)=>d.x??0)
    .y((d)=>d.y??0)
    .addAll(this.props.nodes);
  }*/

  // Init simulation 
  simulation = initSimulation(this.taille, this.currentnodeRadius);

  componentDidMount() {

    //Draw svg frame
    initSVG(this.ref, this.taille);
    console.log(document.getElementsByClassName("svg"))

    const mySVG = d3.select(this.ref)

    mySVG.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.1, 1.8]).on("zoom", (event) => {
      //On recupere la valeur de zoom 
      const zoomValue = event.transform.k;
      //On modifie le rayon en fonction du zoom 
      this.currentnodeRadius = this.nodeRadius * zoomValue;
      console.log("zoom value", zoomValue);

      mySVG.selectAll("circle")
        // .each( (d: SimulationNode) => {
        //   console.log("r", node.attr("r"))
        //   const newr = parseInt(node.attr("r")) * zoomValue / parseInt(node.attr("r"))
        //   console.log("newr", newr)
        //   const newstrokew = parseInt(node.attr("r")) * zoomValue / 4
        //   node.attr("r", newr)
        //   node.attr("stroke-width", newstrokew))
        .attr("r", this.currentnodeRadius)
        .attr("stroke-width", this.currentnodeRadius / 4)

      mySVG.selectAll("line")
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
    console.log("UpdateSVG", this)
    const svgContext = d3.select(this.ref);


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
      addNodeToSVG(this.props.newNodes, this.simulation, this.handleUpdateSVG)

      //Keep the previous props in memory
      this.prevPropsNewLink = this.props.newLinks;
      this.prevPropsNewnode = this.props.newNodes;
    }

    // Build a list of grouped nodes instead of compute it a each iteration
    const groups: SimulationGroup[] = [];

    const svgPath = [];
    svgContext
      .selectAll('path.area')
      .each(function () {
        svgPath.push(this);
      });

    if (svgPath.length !== 0) {
      for (let i = 1; i <= svgPath.length; i++) {
        let selectedNodes: SimulationNode[] = [];
        d3.select(this.ref).selectAll("circle")
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
    reloadSimulation(svgContext, this.simulation, groups)
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

    addNodeToSVG(newNodes, this.simulation, this.handleUpdateSVG)
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
    if (element?.tagName === "circle") {
      const nodeToRm: any = d3.select(element).data()[0]
      this.setState({ x: event.clientX, y: event.clientY, nodeClick: nodeToRm, show: true, });
    }
    else if (element?.tagName === "path") {
      console.log(element)
      this.setState({ x: event.clientX, y: event.clientY, show: true, hullClick: element });
    }
    else {
      this.setState({ x: event.clientX, y: event.clientY, show: true });
    }
  };

  handleUpdateSVG = () => {
    this.UpdateSVG()
  };



  render() {

    const ifContextMenuShouldAppear = (show: boolean) => {
      if (show) {
        const CircleSelected = d3.select(this.ref).selectAll('circle.onfocus');
        return <CustomContextMenu
          forcefield={this.props.forcefield}
          x={this.state.x}
          y={this.state.y}
          nodeClick={this.state.nodeClick}
          hullClick={this.state.hullClick}
          selected={CircleSelected}

          svg={d3.select(this.ref)}
          handlePaste={this.pasteThesedNodes}
          handleUpdate={this.handleUpdateSVG}
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
        d3.select(this.ref)
          .selectAll('circle.onfocus')
          .each((nodeToRemove: any) => {
            if (nodeToRemove.links !== undefined) {
              for (let linkednode of nodeToRemove.links) {
                //remove link between node and removed node
                linkednode.links = linkednode.links!.filter((nodeToRM: SimulationNode) => nodeToRM.id !== nodeToRemove.id);
              }
            }
            d3.select(this.ref).selectAll<SVGCircleElement, SimulationNode>("circle").filter((d: SimulationNode) => (d.id === nodeToRemove.id)).remove();
            //and then remove link inside svg
            d3.select(this.ref).selectAll("line").filter((link: any) => ((link.source.id === nodeToRemove.id) || (link.target.id === nodeToRemove.id))).remove();

            console.log("Nombre de nodes au dessus de ", nodeToRemove.id, ...[d3.select(this.ref).selectAll<SVGCircleElement, SimulationNode>("circle")
              .filter((d: SimulationNode) => ((Number(d.id) > (Number(nodeToRemove.id)))))
              .data().length])

            console.log("le node a supprimé est : ", nodeToRemove)
            //Update new ID to fit with polyply 
            d3.select(this.ref).selectAll<SVGCircleElement, SimulationNode>("circle")
              .filter((d: SimulationNode) => ((Number(d.id) > (Number(nodeToRemove.id)))))
              .each((d) => {
                //Compute new ID 
                let newID: number = parseInt(d.id) - 1
                //d.index = newID
                d.id = newID.toString()
                d.index = newID
                console.log("New ", d)
              })
            //Check if minimun id != de currentID 
            //Mettre une condition d'arret pour ne pas decrease 

            decreaseID()

          })

      }


    }
  



  return(


      <div className = "svg"
        onKeyDown = {(e: React.KeyboardEvent) => handleDelete(e)}
tabIndex = { 0}
onClick = {(e) => { clickAncCloseMenu(e) }}
onContextMenu = { this.handleContextMenu }
style = {{ cursor: 'context-menu' }}
ref = {(ref: HTMLDivElement) => this.frame = ref} >

  <svg className="container" id="svg" ref={(ref: SVGSVGElement) => this.ref = ref}></svg>

{ ifContextMenuShouldAppear(this.state.show) }

      </div >


    );
  }

}