import { SimulationNode, SimulationLink, SimulationGroup } from './SimulationType';
import * as d3 from "d3";
import { donne_la_color, donne_la_shape } from './Viewer/Legend'


let Mysvg: SVGElement;
export function setSVG(svgref: SVGElement) {
    Mysvg = svgref;
}

let radius: number;
export function setRadius(newradius: number) {
    radius = newradius;
}
//Define simulation forcefield 
export function initSimulation(sizeSVG: number, sizeNodeRadius: number): d3.Simulation<SimulationNode, SimulationLink> {
    const simulation = d3.forceSimulation<SimulationNode, SimulationLink>()
        .force("charge", d3.forceManyBody())
        .force("x", d3.forceX(sizeSVG / 2).strength(0.02))
        .force("y", d3.forceY(sizeSVG / 2).strength(0.02))
        .force("link", d3.forceLink()
            //.distance(() => { return sizeNodeRadius * 2.5 })
        )
    return simulation
}

export function reloadSimulation(simulation: d3.Simulation<SimulationNode, SimulationLink>, groupsData: SimulationGroup[]) {
    console.log("Reload simulation");

    const updatePolymerPath = (listOfGroups: SimulationGroup[]) => {
        //If groups are created
        if (listOfGroups.length !== 0) {
            for (let group of listOfGroups) {
                let coords: [number, number][] = [];

                group.nodes!.map((d: SimulationNode) => coords.push([d.x!, d.y!]))
                let hull = d3.polygonHull(coords)

                d3.select(Mysvg).selectAll("path")
                    .filter(function () {
                        return d3.select(this).attr("group") === group.id.toString(); // filter by single attribute
                    })
                    .data([hull])
                    .attr("d", (d) => "M" + d!.join("L") + "Z")
            }
        }
    }

    // Define ticked with coords 
    const ticked = () => {
        console.log("Tick");
        d3.select(Mysvg).selectAll("line")
            .attr("x1", (d: any) => d.source.x)
            .attr("y1", (d: any) => d.source.y)
            .attr("x2", (d: any) => d.target.x)
            .attr("y2", (d: any) => d.target.y);

        d3.select(Mysvg).selectAll("path").attr('transform', (d: any) => { return 'translate(' + d.x + ',' + d.y + ')'; });
        updatePolymerPath(groupsData)

        //Fait remonter les noeuds dans le svg
        //svg.selectAll(".nodes").raise()
    }
    let simulationnodes: SimulationNode[] = []

    // //DETECTION DE NOUVEAU LIENS ???????????????????????
    const slinks: SimulationLink[] = [];
    d3.select(Mysvg).selectAll("line").each((d: any) => slinks.push(d))

    // const bignodes: SimulationNode[] = []
    // svg.selectAll("circle.BIGnodes").each((d: any) => bignodes.push(d))
    d3.select(Mysvg).selectAll("path").each((d: any) => simulationnodes.push(d))

    simulation.nodes(simulationnodes)
        .force<d3.ForceLink<SimulationNode, SimulationLink>>("link")?.links(slinks);

    simulation
        .on("tick", ticked)
        .alpha(1)
        .alphaMin(0.1)
        .velocityDecay(0.1)
        .restart();
}


export function alarmBadLinks(id1: string, id2: string) {
    console.log("ALERT bad Link", id1, id2);
    d3.select(Mysvg)
        .selectAll<SVGElement, SimulationLink>("line")
        .filter((d: SimulationLink) => (((d.source.id === id1) && (d.target.id === id2)) || ((d.source.id === id2) && (d.target.id === id1))))
        .attr("class", "error")
        .attr('stroke', "red")
}

export function removeNode(nodeToRemove: SimulationNode, updateFunction: () => void, decreaseIDFunction: () => void) {
    console.log("remove this little node : ", nodeToRemove.id)
    //remove link in object node
    if (nodeToRemove.links !== undefined) {
        for (let linkednode of nodeToRemove.links) {
            //remove link between node and removed node
            linkednode.links = linkednode.links!.filter((nodeToRM: SimulationNode) => nodeToRM.id !== nodeToRemove.id);
        }
    }
    d3.select(Mysvg).selectAll<SVGCircleElement, SimulationNode>("path").filter((d: SimulationNode) => (d.id === nodeToRemove.id)).remove();
    //and then remove link inside svg
    d3.select(Mysvg).selectAll("line").filter((link: any) => ((link.source.id === nodeToRemove.id) || (link.target.id === nodeToRemove.id))).remove();

    console.log("le node a supprimé est : ", nodeToRemove)
    //Update new ID to fit with polyply 
    d3.select(Mysvg).selectAll<SVGCircleElement, SimulationNode>("path")
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
    decreaseIDFunction()
    updateFunction();
}

export function addNodeToSVG(newnode: SimulationNode[], simulation: any, update: () => void) {
    let div: any;
    // Define the div for the tooltip

    if (document.getElementsByClassName("tooltip").length === 0) {
        div = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
    }
    else {
        div = d3.select("body").select("div.tooltip")
    }

    for (let x of newnode) {
        //Define entering nodes     
        d3.select(Mysvg)
            .append("g")
            .attr("class", "nodes")
            .selectAll(".path")
            .data([x])
            .enter().append("path")
            // @ts-ignore
            .attr("d", d3.symbol().type(d3[donne_la_shape(x.resname)]).size(radius))
            .attr("fill", donne_la_color(x.resname))
            .attr('stroke', "grey")
            // .attr("stroke-width", 2)
            .attr("expand", "true")
            .attr("id", function (d: SimulationNode) { return d.id })
            .call(d3.drag<any, SimulationNode>()
                .on("drag", dragged)
                .on("end", dragended)
            )
            .on("mouseover", function (event: any, d: SimulationNode) {
                div.transition()
                    .duration(20)
                    .style("opacity", 1)

                div.html(d.resname + " #" + d.id)
                    .style("left", (event.clientX) + "px")
                    .style("top", (event.clientY) + 20 + "px")
            })
            .on("mouseout", function (d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on('click', function (this: any, e: any, d: SimulationNode) {
                if (e.ctrlKey) {
                    d3.select(this).attr("class", "onfocus")
                }
                else console.log(d);
            });

    }


    // Define drag behaviour  
    type dragEvent = d3.D3DragEvent<any, SimulationNode, any>;

    const clamp = (x: number, lo: number, hi: number) => {
        return x < lo ? lo : x > hi ? hi : x;
    }

    function dragged(event: dragEvent, d: SimulationNode) {
        if (event.sourceEvent.shiftKey) {
            console.log("Shift key is pressed/ skipping dragged!");
            return;
        }
        const sizeSVG = d3.select(Mysvg).attr("height");
        // secret trick 
        const sizeSVGNumber: number = +sizeSVG;
        d.fx = clamp(event.x, 0, sizeSVGNumber);
        d.fy = clamp(event.y, 0, sizeSVGNumber);

        simulation
            .alphaDecay(.0005)
            .velocityDecay(0.2)
            .alpha(0.1)
            .restart();
    }

    function dragended(event: dragEvent, d: SimulationNode) {
        if (event.sourceEvent.shiftKey) {
            console.log("Shift key is pressed skipping dragended!");
            return;
        }
        // Comment below for sticky node
        d.fx = null;
        d.fy = null;

        //Check contact when drag node
        const closest = incontact(d)
        if (closest) {
            console.log("closest", closest)
            if (checkLink(d, closest)) {
                const newlink = { source: d, target: closest }

                if (d.links) d.links.push(closest);
                else d.links = [closest];

                if (closest.links) closest.links.push(d);
                else closest.links = [d];

                console.log("newlink", newlink)
                d3.select(Mysvg).selectAll("line")
                    .data([newlink], (d: any) => d.source.id + "-" + d.target.id)
                    .enter();
                addLinkToSVG([newlink]);
                update();
            }
        }
        simulation.velocityDecay(0.3)
            .alphaDecay(0.0228/*1 - Math.pow(0.001, 1 / self.simulation.alphaMin())*/)
            .alpha(1)
            .alphaTarget(0)
            .restart();
    }

    //Add function to detect contact between nodes and create link
    const incontact = (c: SimulationNode): SimulationNode | null => {
        let closest: [number, SimulationNode | null] = [radius * 2.2, null];
        simulation.nodes().forEach((d: SimulationNode) => {
            if (d.id === c.id) return;
            const dist = Math.sqrt(((c.x ?? 0) - (d.x ?? 0)) * ((c.x ?? 0) - (d.x ?? 0))
                + ((c.y ?? 0) - (d.y ?? 0)) * ((c.y ?? 0) - (d.y ?? 0))
            );
            if (dist < closest[0]) closest = [dist, d];
        });
        return closest[1]
    };

}

// function hashStringToColor(str: string) {
//     var hash = 5381;
//     for (var i = 0; i < str.length; i++) {
//         hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
//     }
//     var r = (hash & 0xFF0000) >> 16;
//     var g = (hash & 0x00FF00) >> 8;
//     var b = hash & 0x0000FF;
//     return "#" + ("0" + r.toString(16)).substr(-2) + ("0" + g.toString(16)).substr(-2) + ("0" + b.toString(16)).substr(-2);
// };

export function checkLink(node1: SimulationNode, node2: SimulationNode) {

    if ((node1.links === undefined) || (node2.links === undefined)) return true;
    for (let n of node1.links) {
        if (n === node2) return false
    }
    for (let n of node2.links) {
        if (n === node1) return false
    }
    return true;
}

export function addLinkToSVG(newLink: SimulationLink[]): void {
    const link = d3.select(Mysvg).selectAll("line")
        .data(newLink, (d: any) => d.source.id + "-" + d.target.id)
        .enter();

    link.append("line")
        .attr("class", "links")
        .attr("stroke", "grey")
        .attr("stroke-width", radius / 10)
        .attr("opacity", 0.5)
        .attr("stroke-linecap", "round")
        .attr("source", function (d: any) { return d.source.id })
        .attr("target", function (d: any) { return d.target.id });
}