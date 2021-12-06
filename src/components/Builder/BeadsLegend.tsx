import React from 'react'; 
import { Container, Button, Popover, Typography } from '@mui/material'
import * as d3 from 'd3'
import { relative } from 'path';
import { getBeadsLegend, getBeadsAAByType } from '../../martiniNglSchemes';
import { ThreeSixty } from '@material-ui/icons';

const width = 400
const padding = 10

const componentStyle = {
    position: "relative" as any, 
    top:"-95%",
    left:"75%",
    border: "solid",
    borderWidth: "1px", 
    width: width,
    padding: padding, 
    textAlign : "center" as any
  };

interface BeadsLegendProps {
}

interface BeadsLegendState { 
    open:boolean; 
    buttonText : string; 
}


export default class BeadsLegend extends React.Component<BeadsLegendProps, BeadsLegendState> { 
    state : BeadsLegendState = {
        open : false,
        buttonText : "Open color legend"
    }
    protected svg : any; 
    protected rect_height = 25
    protected rect_width = 100
    protected rect_number = 3
    protected y_gap = 10

    componentDidUpdate() {
        console.log("did update")
        if(this.state.open){
            this.createJustBeads()
            //this.createHydrophobicityColorScale(); 
            this.createChargeBeadsLegend()
        }
       
    }

    drawLegend() {
        console.log("draw legend")
        this.createJustBeads()
        this.createChargeBeadsLegend()
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
                .text((d: string) => {console.log(d); return d})
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

    createJustBeads(){
        this.svg.append("text")
            .text("Hydrophobicity scale")
            .attr("y", 15)
            .attr("font-weight", "bold")

        const legendValues = getBeadsLegend("martini3001")
        //const beadsAA = getBeadsAAByType("martini3001")
        //console.log(beadsAA); 
        if(legendValues){
            const beadsToPlot = Object.keys(legendValues).filter(beadName => beadName.startsWith("C") || beadName.startsWith("N") || beadName.startsWith("P"))

            this.svg.selectAll("dot")
                    .data(beadsToPlot)
                    .enter().append("circle")
                    .attr("r", 10)
                    .attr("cy", (d: string, i : number) => 35 + i * 30)
                    .attr("cx", 15)
                    .attr("fill", (d: string) => legendValues[d].color)
                    .attr("stroke", "black")

            this.svg.selectAll("legend-text")
                    .data(beadsToPlot)
                    .enter().append("text")
                    .text((d: string) => {
                        /*let toPrint = ""
                        if(beadsAA && d in beadsAA){
                            for(const [size, atomObj] of Object.entries(beadsAA[d])){
                                toPrint += size + ": "
                                for(const [atomName, aaArray] of Object.entries(atomObj)){
                                    toPrint += aaArray.join("|") + "(" + atomName + ")" 
                                }
                            }
                            return `${d}...${toPrint}`
                        }
                        if (d === "P6") return `${d}... terminal beads`*/
                        return d
                    })
                    .attr("y", (d:string, i : number) => 35 + i * 30)
                    .attr("x", 30)
                    //.attr("transform", (d: string) => `rotate(65 ${linearScale(legendValues[d].hydrophobicity)} 65)`)
                    .style("dominant-baseline", "middle")  

            }

           
       
        

    }

    createChargeBeadsLegend() { 
        const width = 25
        const height = 20
        const y_start = 15
        const x_start = 150

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
        
        
        

    }

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

    triggerOpenLegend = () => {
        if(this.state.open){
            this.setState({open : false, buttonText : "Open color legend"})
        }
        else {
            this.setState({open: true, buttonText : "Close color legend"})
        }
    }

    render(){
        return(

            <div style={componentStyle}>
                <Button onClick={this.triggerOpenLegend}> {this.state.buttonText} </Button>
                {this.state.open && 
                    <svg
                        width={width - padding*2}
                        height={600}
                        ref={handle => (this.svg = d3.select(handle))}>
                    </svg>
                   }
            </div>)
            
    }
}