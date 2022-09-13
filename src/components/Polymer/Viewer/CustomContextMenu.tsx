import * as React from "react";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import * as d3 from "d3";
import { SimulationNode, SimulationLink, SimulationGroup } from '../SimulationType';
import { DownloadJson } from '../generateJson';
import { addLinkToSVG, addNodeToSVG, removeNode } from "../ViewerFunction";
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
        console.log("find group polymer fonction ", listNodesD3)

        //clean the previous selected nodes
        svg
            .selectAll<SVGCircleElement, SimulationNode>('path.onfocus')
            .attr("class", "nodes");


        let idCreatedPolygoneNode: SimulationNode[] = [];
        listNodesD3.each((d: SimulationNode) => {
            if ((idCreatedPolygoneNode.includes(d) === false) && (d.group === undefined)) {
                let connexe = this.giveConnexeNode(d, svg);
                if (connexe.size() < 4) {
                    console.log("Trop petit pour faire un group, hull needs 4 nodes")
                    return
                }
                // else if (deja fait donc il faut regarder si les noeuds id sont deja group ou si un des noeud est deja groupé)  ; 
                else {

                    this.createPolymerPolygon(connexe, svg);
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
        return svg.selectAll<SVGCircleElement, SimulationNode>('path').filter((d: SimulationNode) => connexeNodesId.has(d.id))
    }


    expandBigNodes = (bignode: SVGPathElement, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, dataNodes: SimulationGroup): void => {
        console.log("EXPAND BIG BANG  !", bignode, dataNodes)
        bignode.remove()
        const x = bignode.getAttribute("cx")
        const y = bignode.getAttribute("cy")
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

    colapse = (hull: SVGPathElement, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, listnodes: d3.Selection<SVGCircleElement, SimulationNode, SVGSVGElement, unknown>): void => {
        let mongroup: SimulationGroup = { id: parseInt(hull.getAttribute("group")!), nodesD3: listnodes }

        //Cheatcode
        const self = this
        console.log("Hello, on COLLAPSE")
        console.log("SUPPRIME MOI CA !!", listnodes)
        //Remove nodes from the svg 
        svg.selectAll<SVGCircleElement, SimulationNode>("circle")
            .filter((n: SimulationNode) => (n.group === mongroup.id))
            .remove()

        //Remove links from the svg
        const listid = listnodes.data().map(n => n.id)

        svg.selectAll("line").filter((link: any) => ((listid.includes(link.source.id) || listid.includes(link.target.id)))).remove();

        console.log("data from svg", svg.selectAll("circle.BIGnodes").data(), "and data from fonction", mongroup)

        let dataUpdate: SimulationGroup[] = svg.selectAll<SVGCircleElement, SimulationGroup>("circle.BIGnodes").data()
        dataUpdate.push(mongroup)
        svg.selectAll("circle.BIGnodes")
            .data(dataUpdate)
            .enter()
            .append('circle')
            .attr('class', "BIGnodes")
            .attr("r", function (d: SimulationGroup) { return 30 + d.nodesD3!.data().length / 2 })
            .attr("fill", hull.getAttribute("fill"))
            .style("opacity", 0.7)
            .attr("id", function (d: SimulationGroup) { return d.id })
            .on('click', function (this: any, event: any, d: SimulationGroup): void {
                self.expandBigNodes(this, svg, mongroup);
            });
    }

    createPolymerPolygon = (listNodesD3: d3.Selection<SVGCircleElement, SimulationNode, SVGSVGElement, unknown>, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, groupeID?: number) => {

        console.log("createPolymerPolygon with ", listNodesD3)

        console.log(groupeID)
        if (groupeID === undefined) {
            groupeID = 1;
            svg.selectAll("path.group_path")
                .each(function () {
                    var id = d3.select(this).attr("group");
                    var numberid: number = +id;
                    groupeID = numberid + 1;
                });
        }

        //Get coord of every nodes
        let selectedNodesCoords: [number, number][] = [];
        listNodesD3
            .each((d: SimulationNode) => {
                selectedNodesCoords.push([d.x!, d.y!]);
                d.group = groupeID
            });


        console.log("path", selectedNodesCoords)
        const color = d3.interpolateTurbo(groupeID! / 10);
        let hull = d3.polygonHull(selectedNodesCoords);
        //stupid hack 
        let self = this

        svg
            .selectAll("group_path")
            .data([hull])
            .enter()
            .append("path")
            .attr("expand", "false")
            .attr("group", groupeID!)
            .attr("class", "group_path")
            .attr("d", (d) => "M" + d!.join("L") + "Z")
            .attr("fill", color)
            .attr("stroke", color)
            .attr("stroke-width", "40")
            .attr("stroke-location", "outside")
            .attr("stroke-linejoin", "round")
            .style("opacity", 0.2)
            .on('click', function (this: SVGPathElement, event: any, d: [number, number][] | null) {
                // if (this.getAttribute("expand") === "false") {
                self.colapse(this, svg, listNodesD3)
                self.props.handleUpdate()
                this.setAttribute("display", "none")
                // }
                // else {
                //     //listNodesD3.attr('display', null)
                //     self.update();
                //     this.setAttribute("expand", "false")
                // }
            });
    }

    // Si des noeuds sont selectionnés
    ifSelectedNode = () => {
        let selectedNodes = this.props.svg.selectAll<SVGCircleElement, SimulationNode>('.onfocus')
        if (selectedNodes.size() > 0) {
            console.log(this.props)
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
