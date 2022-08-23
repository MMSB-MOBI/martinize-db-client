import * as React from "react";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import * as d3 from "d3";
import { SimulationNode, SimulationLink, SimulationGroup } from '../SimulationType';
import { DownloadJson } from '../generateJson';
import { addLinkToSVG, addNodeToSVG } from "../addNodeLink";
import { decreaseID } from '../GeneratorManager'


interface props {
    x: number;
    y: number;
    nodeClick: SimulationNode | undefined,
    hullClick: Element | undefined,
    selected: any;
    simulation: d3.Simulation<SimulationNode, SimulationLink>;
    forcefield: string,
    handlePaste: (arg: any, arg2?: string) => void;
    handleUpdate: () => void;
    
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
}

export default class CustomContextMenu extends React.Component<props> {

    update() {
        this.props.handleUpdate()
    }

    addMagicLink() {
        console.log("Add link between node to create a chain")
        let nodetoLink: SimulationNode[] = [];

        let newlinks = []
        //Recherche les nodes sans link ou avec un seul link
        this.props.svg.selectAll<SVGPathElement, SimulationNode>("circle")
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
        this.update()
    }

    removeHull = (hull: Element, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
        //get id of hull 
        const id: string = hull.getAttribute("group")!

        this.props.svg.selectAll<SVGPathElement, SimulationGroup>("path")
            .filter(function (d: SimulationGroup): boolean {
                return (this.getAttribute("group") === id)
            })
            .remove();

        this.props.svg.selectAll<SVGPathElement, SimulationNode>("circle.nodes")
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



    giveConnexeNode = (node: SimulationNode, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
        //Give one node and class on focus rest of polymer nodes 
        //Return one selection of connexe nodes

        //clean the previous selected nodes
        this.props.svg
            .selectAll<SVGCircleElement, SimulationNode>('circle.onfocus')
            .attr("class", "nodes");

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
        return svg.selectAll<SVGCircleElement, SimulationNode>('circle').filter((d: SimulationNode) => connexeNodesId.has(d.id))
    }

    //list d3 qui forme le polygon autour de cette liste
    groupPolymer = (listNodesD3: d3.Selection<SVGSVGElement, SimulationNode, null, undefined>, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
        console.log("find group polymer fonction ", listNodesD3)

        let idCreatedPolygoneNode: SimulationNode[] = [];


        listNodesD3.each((d: SimulationNode) => {
            if ((idCreatedPolygoneNode.includes(d) === false) && (d.group === undefined)) {
                let connexe = this.giveConnexeNode(d, svg);
                if (connexe.size() < 4) {
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
        this.props.svg.selectAll<SVGPathElement, SimulationGroup>("path")
            .filter(function (d: SimulationGroup): boolean {
                return (this.getAttribute("group") === dataNodes.id.toString())
            })
            .attr("display", '')
        this.update()
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
            svg.selectAll('path')
                .each(function () {
                    var id = d3.select(this).attr("group");
                    var numberid: number = +id;
                    groupeID = numberid + 1;
                });
        }

        let selectedNodesCoords: [number, number][] = [];
        listNodesD3
            .each((d: SimulationNode) => {
                selectedNodesCoords.push([d.x!, d.y!]);
                d.group = groupeID
            });


        console.log("path", selectedNodesCoords)
        const color = d3.interpolateTurbo(groupeID! / 10);
        let hull = d3.polygonHull(selectedNodesCoords);
        let self = this

        svg
            .selectAll("area")
            .data([hull])
            .enter()
            .append("path")
            // .attr("expand", "false")
            .attr("group", groupeID!)
            .attr("class", "area")
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
                self.update();
                this.setAttribute("display", "none")
                // }
                // else {
                //     //listNodesD3.attr('display', null)
                //     self.update();
                //     this.setAttribute("expand", "false")
                // }
            });
    }

    removeNode = (nodeToRemove: SimulationNode) => {
        // console.log("remove this node : ", nodeToRemove)
        //remove link in object node
        if (nodeToRemove.links !== undefined) {
            for (let linkednode of nodeToRemove.links) {
                //remove link between node and removed node
                linkednode.links = linkednode.links!.filter((nodeToRM: SimulationNode) => nodeToRM.id !== nodeToRemove.id);
            }
        }
        this.props.svg.selectAll<SVGCircleElement, SimulationNode>("circle").filter((d: SimulationNode) => (d.id === nodeToRemove.id)).remove();
        //and then remove link inside svg
        this.props.svg.selectAll("line").filter((link: any) => ((link.source.id === nodeToRemove.id) || (link.target.id === nodeToRemove.id))).remove();

        console.log("Nombre de nodes au dessus de ", nodeToRemove.id, ...[this.props.svg.selectAll<SVGCircleElement, SimulationNode>("circle")
            .filter((d: SimulationNode) => ((Number(d.id) > (Number(nodeToRemove.id)))))
            .data().length])

        console.log("le node a supprimé est : ", nodeToRemove)
        //Update new ID to fit with polyply 
        this.props.svg.selectAll<SVGCircleElement, SimulationNode>("circle")
            .filter((d: SimulationNode) => ((Number(d.id) > (Number(nodeToRemove.id)))))
            .each(d => {
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

        this.props.handleUpdate();

    }

    removeSelectedNodes = (nodes: d3.Selection<SVGSVGElement, SimulationNode, null, undefined>) => {
        nodes.each((node: SimulationNode) => {
            this.removeNode(node);
        })
    }

    removeLinksSelected = (nodes: d3.Selection<SVGSVGElement, SimulationNode, null, undefined>) => {
        let listnodes: SimulationNode[] = []
        nodes.each((node: SimulationNode) => {
            listnodes.push(node);
        })

        console.log("Remove links between : ", listnodes)
        for (let node of listnodes) {
            console.log( "Start for le node numero ", node.id )
            if (node.links !== undefined) {
                for (let linkednode of node.links) {
                    console.log(linkednode)
                    if (listnodes.includes(linkednode)) {
                            console.log( linkednode.id,  node.id)
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
        this.props.svg.selectAll<SVGCircleElement, SimulationNode>("circle")
            .each(node => this.removeNode(node))
    }

    // Si des noeuds sont selectionnés
    ifSelectedNode = () => {
        if (this.props.selected.size() > 0) {
            console.log(this.props)
            return <div key={1}>
                <Typography >
                    {this.props.selected.size()} nodes selected
                </Typography>
                <Divider />
                <MenuItem onClick={() => { this.removeLinksSelected(this.props.selected) }}>Remove links between </MenuItem>
                <MenuItem onClick={() => { this.groupPolymer(this.props.selected, this.props.svg) }}> Group this polymer</MenuItem>
                <MenuItem onClick={() => { this.removeSelectedNodes(this.props.selected) }}> Remove {this.props.selected.size()} selected nodes</MenuItem>
                <MenuItem onClick={() => { this.props.handlePaste(this.props.selected) }}> Paste {this.props.selected.size()} selected nodes</MenuItem>
                <MenuItem onClick={() => { this.props.selected.attr("class", "nodes") }}>Unselected</MenuItem>

            </div>;
        } else {
            return null;
        }
    }

    ifnode = () => {
        if (this.props.nodeClick) {
            return <div key={0}>
                <MenuItem onClick={() => { this.removeLink(this.props.nodeClick!, this.props.svg) }}>Remove link</MenuItem>
                <MenuItem onClick={() => { if (this.props.nodeClick !== undefined) this.removeNode(this.props.nodeClick) }}>Remove node #{this.props.nodeClick.id}</MenuItem>
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
