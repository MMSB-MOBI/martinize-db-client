import * as d3 from "d3";
import { SimulationNode, SimulationLink, SimulationGroup } from '../SimulationType';

export function initSVG(reference: SVGElement, size: number): void {
    console.log("InitSVG");
    d3.select(reference)
        .attr("style", "outline: thin solid grey;")
        .attr("width", size)
        .attr("height", size)
    const mysvg = d3.select(reference)
    //Define brush behaviour
    const brush = d3.brush();
    const gBrush = mysvg.append("g")
        .attr("class", "brush")
    gBrush
        .call(brush
            .on("start brush", (event: any) => {
                //this.simulation.stop(); //Stop simulation when brush
                const selection: any = event.selection; //Get brush zone coord [[x0, y0], [x1, y1]],
                if (selection) {
                    //unselect nodes 
                    mysvg.selectAll("circle").attr("class", "nodes");

                    //select all node inside brush zone 
                    mysvg.selectAll("circle")
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

}

//Define simulation forcefield 
export function initSimulation(sizeSVG: number, sizeNodeRadius: number): d3.Simulation<SimulationNode, SimulationLink> {
    const simulation = d3.forceSimulation<SimulationNode, SimulationLink>()
        .force("charge", d3.forceManyBody())
        .force("x", d3.forceX(sizeSVG / 2).strength(0.02))
        .force("y", d3.forceY(sizeSVG / 2).strength(0.02))
        .force("link", d3.forceLink()
            .distance(() => { return sizeNodeRadius * 2.5 })
        )
    return simulation
}

export function reloadSimulation(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, simulation: d3.Simulation<SimulationNode, SimulationLink>, groupsData: SimulationGroup[]) {
    console.log("Reload simulation");

    const updatePolymerPath = (listOfGroups: SimulationGroup[]) => {
        //If groups are created
        if (listOfGroups.length !== 0) {
            for (let group of listOfGroups) {
                let coords: [number, number][] = [];

                group.nodes!.map((d: SimulationNode) => coords.push([d.x!, d.y!]))
                let hull = d3.polygonHull(coords)

                svg.selectAll("path")
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
        svg.selectAll("line")
            .attr("x1", (d: any) => d.source.x)
            .attr("y1", (d: any) => d.source.y)
            .attr("x2", (d: any) => d.target.x)
            .attr("y2", (d: any) => d.target.y);

        svg.selectAll("circle")
            .attr("cx", (d: any) => d.x)
            .attr("cy", (d: any) => d.y);

        updatePolymerPath(groupsData)

        //Fait remonter les noeuds dans le svg
        svg.selectAll("circle").raise()
    }

    const snodes: SimulationNode[] = []
    svg.selectAll("circle.nodes").each((d: any) => snodes.push(d))
    svg.selectAll("circle.onfocus").each((d: any) => snodes.push(d))

    //DETECTION DE NOUVEAU LIENS ???????????????????????
    const slinks: SimulationLink[] = [];
    svg.selectAll("line").each((d: any) => slinks.push(d))

    const bignodes: SimulationNode[] = []
    svg.selectAll("circle.BIGnodes").each((d: any) => bignodes.push(d))

    // simulation.stop()

    simulation.nodes(snodes.concat(bignodes) )
        .force<d3.ForceLink<SimulationNode, SimulationLink>>("link")?.links(slinks);
    
    simulation
        .on("tick", ticked)
        .alpha(1)
        .alphaMin(0.1)
        .velocityDecay(0.1)
        .restart();
}