import * as React from "react";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import * as d3 from "d3";
import { SimulationNode, SimulationLink, SimulationGroup } from '../SimulationType';
import { DownloadJson } from '../generateJson';
import { addLinkToSVG, addNodeToSVG, reloadSimulation, removeNode } from "../ViewerFunction";
import { decreaseID } from '../GeneratorManager'


interface props {
    x: number;
    y: number;
    nodeClick: SimulationNode | undefined,
    hullClick: Element | undefined,
    simulation: d3.Simulation<SimulationNode, SimulationLink>;
    forcefield: string,
    handlePaste: (arg: any, arg2?: string) => void;
    handleUpdate: () => void;
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
}

export default class CustomContextMenu extends React.Component<props> {

    addMagicLink() {
        console.log("Add link between node to create a chain")
        let nodetoLink: SimulationNode[] = [];

        let newlinks = []
        //Recherche les nodes sans link ou avec un seul link
        this.props.svg.selectAll<SVGPathElement, SimulationNode>("path")
            .each((d: SimulationNode) => {
                if (!d.links) nodetoLink.push(d)
                else if (d.links!.length === 1) nodetoLink.push(d)
                else if (d.links!.length === 0) nodetoLink.push(d)

            })

        console.log("nodetolink", nodetoLink)

        // Parcourir la liste pour trouver noeud avec lien manquant avec id consecutif 
        let nextid: number = parseInt(nodetoLink[0].id) + 1
        for (let node of nodetoLink) {

            if (parseInt(node.id) === nextid) {

                let nodetarget = nodetoLink.filter((n) => parseInt(n.id) === (nextid - 1))[0]

                let link = {
                    source: node,
                    target: nodetarget
                }
                newlinks.push(link)

                if (node.links) node.links.push(nodetarget);
                else node.links = [nodetarget];

                if (nodetarget.links) nodetarget.links.push(node);
                else nodetarget.links = [node];

            }
            nextid = parseInt(node.id) + 1

        }
        addLinkToSVG(newlinks)
        this.props.handleUpdate()
    }

    removeHull = (hull: Element, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
        //get id of hull 
        const id: string = hull.getAttribute("group")!

        this.props.svg.selectAll<SVGPathElement, SimulationGroup>("path.area")
            .filter(function (d: SimulationGroup): boolean {
                return (this.getAttribute("group") === id)
            })
            .remove();

        this.props.svg.selectAll<SVGPathElement, SimulationNode>("path.nodes")
            .filter((d: SimulationNode) => {
                return (d.group === parseInt(id))
            })
            .each((d: SimulationNode) => {
                d.group = undefined
            });

        this.props.svg.selectAll<SVGPathElement, SimulationNode>("path.onfocus")
            .filter((d: SimulationNode) => {
                return (d.group === parseInt(id))
            })
            .each((d: SimulationNode) => {
                d.group = undefined
            });
    }

    removeLink = (node: SimulationNode, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
        console.log("Remove links", node)
        if (node.links !== undefined) {
            for (let linkednode of node.links) {
                //remove link between node and removed node
                linkednode.links = linkednode.links!.filter((nodeToRM: SimulationNode) => nodeToRM.id !== node.id);
            }
        }

        this.props.svg.selectAll("line").filter((link: any) => ((link.source.id === node.id) || (link.target.id === node.id))).remove();
        delete node.links
        this.props.handleUpdate();
    }


    removeBadLinks = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
        //Iterate throw differents bad links 
        this.props.svg.selectAll<SVGLineElement, SimulationLink>("line.error").
            each((d: SimulationLink) => {
                d.source.links = d.source.links!.filter((nodeToRM: SimulationNode) => nodeToRM.id !== d.target.id);
                d.target.links = d.target.links!.filter((nodeToRM: SimulationNode) => nodeToRM.id !== d.source.id);
            })
            .remove()

        this.props.handleUpdate();

    }

    removeSelectedNodes = (nodes: d3.Selection<SVGCircleElement, SimulationNode, SVGSVGElement, unknown>) => {
        nodes.each((node: SimulationNode) => {
            console.log(node)
            removeNode(node, this.props.handleUpdate, decreaseID);
        })
    }

    removeLinksSelected = (nodes: d3.Selection<SVGCircleElement, SimulationNode, SVGSVGElement, unknown>) => {
        let listnodes: SimulationNode[] = []
        nodes.each((node: SimulationNode) => {
            listnodes.push(node);
        })

        console.log("Remove links between : ", listnodes)
        for (let node of listnodes) {
            console.log("Start for le node numero ", node.id)
            if (node.links !== undefined) {
                for (let linkednode of node.links) {
                    console.log(linkednode)
                    if (listnodes.includes(linkednode)) {
                        console.log(linkednode.id, node.id)
                        // BUUUUUUUUG

                        node.links = node.links!.filter((nodeToRM: SimulationNode) => nodeToRM.id !== linkednode.id);
                        this.props.svg.selectAll("line").filter((link: any) => ((link.source.id === node.id) && (link.target.id === linkednode.id))).remove();
                    }
                }
            }
        }
        this.props.handleUpdate();
    }

    clear = () => {
        this.props.svg.selectAll<SVGCircleElement, SimulationNode>("g")
            .each(node => removeNode(node, this.props.handleUpdate, decreaseID))
    }



    //list d3 qui forme le polygon autour de cette liste
    groupPolymer = (listNodesD3: d3.Selection<SVGCircleElement, SimulationNode, SVGSVGElement, unknown>, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
        //clean the previous selected nodes
        svg
            .selectAll<SVGCircleElement, SimulationNode>('path.onfocus')
            .attr("class", "nodes");

        let idCreatedPolygoneNode: SimulationNode[] = [];
        listNodesD3.each((d: SimulationNode) => {

            if ((idCreatedPolygoneNode.includes(d) === false) && (d.group === undefined)) {
                let connexe = this.giveConnexeNode(d, svg);
                if (connexe.size() < 4) {
                    console.log("each node ", d.id, "Trop petit pour faire un group, hull needs 4 nodes")
                    return
                }
                // else if (deja fait donc il faut regarder si les noeuds id sont deja group ou si un des noeud est deja groupé)  ; 
                else {
                    //Create hull to group polymer 

                    //Get the last id with the number of group_path object in d3
                    let id = svg.selectAll(".group_path").data().length + 1
                    //Get coord of every nodes
                    let selectedNodesCoords: [number, number][] = [];
                    connexe
                        .each((d: SimulationNode) => {
                            selectedNodesCoords.push([d.x!, d.y!]);
                            //and give a id 
                            d.group = id
                        });

                    const color = d3.interpolateTurbo(id / 12);
                    let hull = d3.polygonHull(selectedNodesCoords);
                    //stupid hack 
                    let self = this

                    console.log("Create hull number :", id)
                    svg
                        .selectAll("group_path")
                        .data([hull])
                        .enter()
                        .append("path")
                        .attr("group", id)
                        .attr("class", "group_path")
                        .attr("d", (d) => "M" + d!.join("L") + "Z")
                        .attr("fill", color)
                        .attr("stroke", color)
                        .attr("stroke-width", "20")
                        .attr("stroke-location", "outside")
                        .attr("stroke-linejoin", "round")
                        .style("opacity", 0.2)
                        .on('click', function () {
                            self.colapse({ id: id, nodesD3: connexe, color: color })
                            this.remove()
                            self.props.handleUpdate();
                        });

                    connexe.each((d: SimulationNode) => {
                        idCreatedPolygoneNode.push(d)
                    });
                };
            }
        })

        this.props.handleUpdate();
    }

    giveConnexeNode = (node: SimulationNode, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
        //Give one node and class on focus rest of polymer nodes 
        //Return one selection of connexe nodes

        // Create a list and add our initial node in it
        let dejavue = [];
        dejavue.push(node);
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
            while (dejavue.length !== 0) {
                let firstNode: SimulationNode = dejavue.shift()!;
                //console.log(firstNode)
                if (firstNode !== undefined) {
                    for (let connectedNodes of firstNode!.links!) {
                        dejavue.push(connectedNodes);
                        connexeNodesId.add(connectedNodes.id);
                    }
                    explored.push(firstNode)
                    dejavue = dejavue.filter(val => !explored.includes(val));
                }
            }
        }
        // Return a selection of one connexe graph 
        // Maybe juste one node
        return svg.selectAll<SVGCircleElement, SimulationNode>('path.nodes').filter((d: SimulationNode) => connexeNodesId.has(d.id))
    }


    expandgroup_node = (bignode: SVGPathElement, dataNodes: SimulationGroup): void => {
        console.log("EXPAND BIG BANG  !", bignode, dataNodes)
        bignode.remove()
        const x = bignode.getAttribute("x")
        const y = bignode.getAttribute("y")
        dataNodes.nodesD3!.data().map(n => n.x = parseInt(x!))
        dataNodes.nodesD3!.data().map(n => n.y = parseInt(y!))
        addNodeToSVG(dataNodes.nodesD3!.data(), this.props.simulation, this.props.handleUpdate)

        let listLink: SimulationLink[] = []
        for (let node of dataNodes.nodesD3!.data()) {
            for (let nodelink of node.links!)
                listLink.push({
                    "source": node,
                    "target": nodelink
                });
        }

        addLinkToSVG(listLink)
        this.props.svg.selectAll<SVGPathElement, SimulationGroup>("path.area")
            .filter(function (d: SimulationGroup): boolean {
                return (this.getAttribute("group") === dataNodes.id.toString())
            })
            .attr("display", '')
        this.props.handleUpdate()
    }

    colapse = (group: SimulationGroup): void => {
        //Create SimulationGroup object 


        console.log("Colapse ", group.id)
        //Remove nodes from the svg 
        this.props.svg.selectAll<SVGCircleElement, SimulationNode>("path.nodes")
            .filter((n: SimulationNode) => (n.group === group.id))
            .remove()

        //Remove links from the svg
              
        const  listid = group.nodesD3!.data().map(n => n.id)
        this.props.svg.selectAll("line").filter((link: any) => ((listid.includes(link.source.id) || listid.includes(link.target.id)))).remove();


        //Cheatcode
        const self = this

        this.props.svg
            .selectAll("group_node")
            .data([group])
            .enter()
            .append("path")
            .attr("group", group.id)
            .attr('class', "group_node")
            .attr("d", d3.symbol().type(d3.symbolCircle).size( 1000 * Math.sqrt( group.nodesD3!.data().length )  ))
            .attr("fill", group.color!)
            .style("opacity", 0.7)
            .attr("id", function (d: SimulationGroup) { return d.id })
            .attr("group", function (d: SimulationGroup) { return d.id })
            .on('click', function (this: any, event: any, d: SimulationGroup): void {
                self.expandgroup_node(this, group);
            });

        //Remove the old path around nodes 

    }


    // Si des noeuds sont selectionnés
    ifSelectedNode = () => {
        let selectedNodes = this.props.svg.selectAll<SVGCircleElement, SimulationNode>('.onfocus')
        if (selectedNodes.size() > 0) {
            return <div key={1}>
                <Typography >
                    {selectedNodes.size()} nodes selected
                </Typography>
                <Divider />
                <MenuItem onClick={() => { this.removeLinksSelected(selectedNodes) }}>Remove links between </MenuItem>
                <MenuItem onClick={() => { this.groupPolymer(selectedNodes, this.props.svg) }}> Group this polymer</MenuItem>
                <MenuItem onClick={() => { this.removeSelectedNodes(selectedNodes) }}> Remove {selectedNodes.size()} selected nodes</MenuItem>
                <MenuItem onClick={() => { this.props.handlePaste(selectedNodes) }}> Paste {selectedNodes.size()} selected nodes</MenuItem>
                <MenuItem onClick={() => { selectedNodes.attr("class", "nodes") }}>Unselected</MenuItem>

            </div>;
        } else {
            return null;
        }
    }

    ifnode = () => {
        if (this.props.nodeClick) {
            return <div key={0}>
                <MenuItem onClick={() => { this.removeLink(this.props.nodeClick!, this.props.svg) }}>Remove link</MenuItem>
                <MenuItem onClick={() => { if (this.props.nodeClick !== undefined) removeNode(this.props.nodeClick, this.props.handleUpdate, decreaseID) }}>Remove node #{this.props.nodeClick.id}</MenuItem>
                <MenuItem onClick={() => { this.giveConnexeNode(this.props.nodeClick!, this.props.svg).attr("class", "onfocus") }}>Select this polymer</MenuItem>
                <Divider />
            </div>;
        }
        else if (this.props.hullClick) {
            return <div key={0}>
                <MenuItem onClick={() => { this.removeHull(this.props.hullClick!, this.props.svg) }}>Remove group</MenuItem>
                <Divider />
            </div>;
        }
        else return;
    }


    render() {
        return (
            <Menu
                anchorReference="anchorPosition"
                anchorPosition={{ top: this.props.y + 2, left: this.props.x + 2 }}
                open={true} >
                {this.ifnode()}
                {this.ifSelectedNode()}
                <MenuItem onClick={() => { this.clear() }}>Clear</MenuItem>
                <MenuItem onClick={() => { this.addMagicLink() }}>Magic Link it</MenuItem>
                <MenuItem onClick={() => { this.removeBadLinks(this.props.svg) }}>Remove bad links</MenuItem>
                <MenuItem onClick={() => { DownloadJson(this.props.simulation, this.props.forcefield) }}>Download Json</MenuItem>
            </Menu>
        )
    }
}
