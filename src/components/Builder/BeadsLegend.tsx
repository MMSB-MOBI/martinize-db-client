import React from 'react'; 
import {Button, Popper } from '@mui/material'
import * as d3 from 'd3'
import { getBeadsLegend, getBeadGeneralTypeAndAA } from '../../martiniNglSchemes';
import { AvailableForceFields } from '../../types/entities';


const width = 300
const height = 670
const padding = 10

const componentStyle = {
    position: "relative" as any, 
    top:"-95%",
    left:"90%",
    border: "solid",
    borderWidth: "1px", 
    width: width,
    padding: padding, 
    textAlign : "center" as any
  };

const svgStyle = {
    border: "solid", 
    borderWidth: "1px",
    padding: padding, 
}

const ButtonStyle = {
    position : 'relative' as any,
    top:"-95%",
    left:"85%",
}

interface BeadsLegendProps {
    ff : AvailableForceFields; 
}

interface BeadsLegendState { 
    open:boolean; 
    buttonText : string; 
    drawed : boolean; 
    anchorElmt: any; 
}

export default class BeadsLegend extends React.Component<BeadsLegendProps, BeadsLegendState> { 
    state : BeadsLegendState = {
        open : false,
        buttonText : "Open color legend",
        drawed : false, 
        anchorElmt : null
    }
    protected svg : any; 
    protected rect_height = 25
    protected rect_width = 100
    protected rect_number = 3
    protected y_gap = 10

    protected legendValues = getBeadsLegend(this.props.ff)
    protected beadsAA = getBeadGeneralTypeAndAA(this.props.ff)


    componentDidUpdate(){
        if(this.state.open && !this.state.drawed) this.drawLegend(); 
    }

    drawLegend() {
        const add_aa = this.props.ff === "martini3001" ? true : false
        const beads_end_position = this.createJustBeads(add_aa)
        const charged_end_position = this.createChargeBeadsLegend(beads_end_position)
        this.svg.append("text")
            .text(`Martini force field : ${this.props.ff}`)
            .attr("y", charged_end_position + 40)
            .attr("font-style", "italic")
        this.setState({drawed : true})
    }

    createHydrophobicityColorScale() { 
        const width = 15
        const height = 500

        const legendValues = getBeadsLegend("martini3001")

        const linearScale = d3.scaleLinear()
            .domain([-30,20])
            .range([0,500])

        const defs = this.svg.append("defs")
        const linearGradient = defs.append("linearGradient").attr("id", "linear-gradient")
        linearGradient
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");

            linearGradient.selectAll("stop")
            .data([
                {offset: "0%", color: "cyan"},
                {offset: "50%", color: "white"},
                {offset: "100%", color: "orange"}
              ])
            .enter().append("stop")
            .attr("offset", function(d:any) { return d.offset; })
            .attr("stop-color", function(d:any) { return d.color; });

        this.svg.append("text")
              .text("Hydrophobicity scale")
              .attr("y", 10)

        this.svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("y", 18)
            .attr("x", 0)
            .style("fill", "url(#linear-gradient)")
            .attr("stroke", "black")

        if(legendValues){
            const beadsToPlot = Object.keys(legendValues).filter(beadName => beadName.startsWith("C") || beadName.startsWith("N") || beadName.startsWith("P"))
            
            this.svg.selectAll("dot")
                .data(beadsToPlot)
                .enter().append("circle")
                .attr("r", 10)
                .attr("cy", (d: string) => 18 + linearScale(legendValues[d].hydrophobicity))
                .attr("cx", 30)
                .attr("fill", (d: string) => legendValues[d].color)
                .attr("stroke", "black")
            
            this.svg.selectAll("legend-text")
                .data(beadsToPlot)
                .enter().append("text")
                .text((d: string) => { return d})
                .attr("y", (d:string) => 18 + linearScale(legendValues[d].hydrophobicity))
                .attr("x", 50)
                //.attr("transform", (d: string) => `rotate(65 ${linearScale(legendValues[d].hydrophobicity)} 65)`)
                .style("dominant-baseline", "middle")  

            /*this.svg.append("text")
                .text("MET : SC1")
                .attr("x", linearScale(legendValues["C6"].hydrophobicity))
                .attr("y", 100)
                .style("text-anchor", "middle")*/
            
            /*this.svg.append("text")
                .text("P6")
                .attr("x", linearScale(legendValues["P6"].hydrophobicity))      
                .attr("y", 65)*/          
        }

       

    }

    //return end y position
    createJustBeads(addAA : boolean = true) : number {
        
        const bead_x = 15
        const text_x = 30
        const start_y = 35
        const gap = 30
        const radius = 10

        let end_y = start_y

        this.svg.append("text")
            .text("Hydrophobicity scale")
            .attr("y", 15)
            .attr("font-weight", "bold")
        //const beadsAA = getBeadsAAByType("martini3001")
        //console.log(beadsAA); 
        if(this.legendValues){
            const beadsToPlot = Object.keys(this.legendValues).filter(beadName => beadName.startsWith("C") || beadName.startsWith("N") || beadName.startsWith("P"))

            this.svg.selectAll("dot")
                    .data(beadsToPlot)
                    .enter().append("circle")
                    .attr("r", radius)
                    .attr("cy", (d: string, i : number) => {end_y = start_y + i * gap; return end_y})
                    .attr("cx", bead_x)
                    //@ts-ignore
                    .attr("fill", (d: string) => this.legendValues[d].color)
                    .attr("stroke", "black")

            this.svg.selectAll("legend-text")
                    .data(beadsToPlot)
                    .enter().append("text")
                    .text((d: string) => {
                        let toPrint = d
                        if(addAA){
                            if(this.beadsAA && d in this.beadsAA){
                                const aaList = new Set()
                                for(const aa of this.beadsAA[d]){
                                    if (aa.atomName.startsWith("SC")) aaList.add(aa.aminoAcid)
                                }
                                if(aaList.size > 0) toPrint += " : " + [...aaList].join(" ")
                            }
                            if (d === "P6") toPrint += " : terminal beads"
                        }
                        return toPrint
                    })
                    .attr("y", (d:string, i : number) => start_y + i * gap)
                    .attr("x", text_x)
                    //.attr("transform", (d: string) => `rotate(65 ${linearScale(legendValues[d].hydrophobicity)} 65)`)
                    .style("dominant-baseline", "middle")  

            }

        return end_y
    }

    createBeadsThreeColumns(){
        this.createJustBeads(); 
        if(this.legendValues){
            const smallBeads = Object.keys(this.legendValues).filter(beadName => beadName.startsWith("SC") || beadName.startsWith("SN") || beadName.startsWith("SP"))
            this.svg.selectAll("small-dot")
                .data(smallBeads)
                .enter().append("circle")
                .attr("r", 10)
                .attr("cx", 75)
                .attr("cy", (_: string, i: number) => 35 + i * 30)
                //@ts-ignore
                .attr("fill", (bead : string) => this.legendValues[bead].color)
                .attr("stroke", "black")
            this.svg.selectAll("legend-text-small")
                .data(smallBeads)
                .enter().append("text")
                .text((d: string) => {
                    return d
                })
                .attr("y", (d:string, i : number) => 35 + i * 30)
                .attr("x", 90)
                //.attr("transform", (d: string) => `rotate(65 ${linearScale(legendValues[d].hydrophobicity)} 65)`)
                .style("dominant-baseline", "middle")  

                const tinyBeads = Object.keys(this.legendValues).filter(beadName => beadName.startsWith("TC") || beadName.startsWith("TN") || beadName.startsWith("TP"))
                this.svg.selectAll("tiny-dot")
                    .data(tinyBeads)
                    .enter().append("circle")
                    .attr("r", 10)
                    .attr("cx", 135)
                    .attr("cy", (_: string, i: number) => 35 + i * 30)
                    //@ts-ignore
                    .attr("fill", (bead : string) => this.legendValues[bead].color)
                    .attr("stroke", "black")
                this.svg.selectAll("legend-text-tiny")
                    .data(tinyBeads)
                    .enter().append("text")
                    .text((d: string) => {
                        return d
                    })
                    .attr("y", (d:string, i : number) => 35 + i * 30)
                    .attr("x", 150)
                    //.attr("transform", (d: string) => `rotate(65 ${linearScale(legendValues[d].hydrophobicity)} 65)`)
                    .style("dominant-baseline", "middle")  
    
            }

        }


    createChargeBeadsLegend(start_position: number): number { 
        const width = 25
        const height = 20
        const y_start = start_position + 35
        const x_start = 0

        this.svg.append("text")
            .text("Charged beads")
            .attr("y", y_start)
            .attr("x", x_start )
            .attr("font-weight", "bold")

        this.svg.append("circle")
            .attr("r", 10)
            .attr("cy", y_start + 20)
            .attr("cx", x_start + 15)
            .style("fill", "red")
            .attr("stroke", "black")
        this.svg.append("text")
            .text("Negative")
            .attr("y", y_start + 10 + (height / 2))
            .attr("x", x_start + width + 5)
            .style("dominant-baseline", "middle")
        
        this.svg.append("circle")
            .attr("r", 10)
            .attr("cy", y_start + 20)
            .attr("cx", x_start + width + 75 + 12)
            .style("fill", "blue")
            .attr("stroke", "black")
        this.svg.append("text")
            .text("Positive")
            .attr("y", y_start + 10 + (height / 2))
            .attr('x', x_start + width + 75 + width)
            .style("dominant-baseline", "middle")

        return y_start + 10 + (height / 2)
        
        
        

    }

    /*createAATable() {
        const aaBeads = getBeadGeneralTypeAndAA("martini3001")
        let previous_y = 10
        this.svg.selectAll("text-aa")
            .data(Object.keys(aaBeads))
            .enter()
            .append("text")
                .text((aa : string) => {
                    const sideChains = Object.keys(aaBeads[aa]).filter(atomName => atomName.startsWith("SC"))
                    const toPrint = sideChains.map(sc => `${sc} : ${aaBeads[aa][sc].bead}`).join("; ")
                    return `${aa} : ${toPrint}`})
                .attr("x", 200)
                .attr("y", () => {previous_y = previous_y + 20; return previous_y})
            

    }*/

    createRect(color:string, position: number, legend: string) {
        const y = position === 0 ? 0 : position * this.rect_height + position * this.y_gap
        this.svg.append("circle")
            .attr("r", this.rect_width)
            .attr("cy", y)
            .style("fill", color)
            .attr("stroke", "black")

        this.svg.append("text")
            .text(legend)
            .attr("x", this.rect_width + 15)
            .attr("y", y + (this.rect_height / 2))
            .style("dominant-baseline", "middle")        
    }

    triggerOpenLegend = (event: React.MouseEvent<HTMLButtonElement>) => {
        if(this.state.open){
            this.setState({open : false, buttonText : "Open color legend", anchorElmt : null})
        }
        else {
            this.setState({open: true, buttonText : "Close color legend", anchorElmt : event.currentTarget})
        }
    }

    handleClose = () => {
        this.setState({open : false, buttonText : "Open color legend", drawed : false, anchorElmt : null})
    }

    render(){
        return(

            <React.Fragment>
                <Button style={ButtonStyle} onClick={this.triggerOpenLegend}> {this.state.buttonText} </Button>
                <Popper
                    id="test"
                    open={this.state.open}
                    anchorEl={this.state.anchorElmt}
                    keepMounted={true}>
                    <div> 
                    <svg style={svgStyle}
                        width={width - padding*2}
                        height={height}
                        ref={handle => {
                            (this.svg = d3.select(handle))
                            }}>
                    </svg>
                    </div>
                    
                </Popper>

                   
                   
            </React.Fragment>)
            
    }
}