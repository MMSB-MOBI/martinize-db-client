
import * as React from "react";
import * as d3 from "d3";
//import { sin, cos, sqrt, pi, tau } from "Math";

const legend: { [residue: string]: { color: string, shape: string } } = require('./legend.json')


function hashStringToColor(str: string) {
    var hash = 5381;
    for (var i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
    }
    var r = (hash & 0xFF0000) >> 16;
    var g = (hash & 0x00FF00) >> 8;
    var b = hash & 0x0000FF;
    return "#" + ("0" + r.toString(16)).substr(-2) + ("0" + g.toString(16)).substr(-2) + ("0" + b.toString(16)).substr(-2);
};


// const pentagon = {
//     draw: function (context: any, size: number) {
//         const r = Math.sqrt(size / Math.PI);
//         context.moveTo(0, 0);
//         context.lineTo(0, -r);
//         //context.lineTo(x, y);
//         for (let i = 1; i < 5; ++i) {
//             const a = 2 * Math.PI * i / 5;
//             const c = Math.cos(a);
//             const s = Math.sin(a);
//             context.lineTo(s * r, -c * r);
//         }
//         context.lineTo(0, -r);
//         context.closePath();
//     }
// };

const hexagon = {
    draw: function (context: any, size: number) {
        const r = Math.sqrt(size / Math.PI);
        context.moveTo(0, -r);
        //context.lineTo(x, y);
        for (let i = 1; i < 6; ++i) {
            const a = 2 * Math.PI * i / 6;
            const c = Math.cos(a);
            const s = Math.sin(a);
            context.lineTo(s * r, -c * r);
        }
        context.lineTo(0, -r);
        context.closePath();
    }
};

const customSymbol = {/* "pentagon" : pentagon ,*/  "hexagon": hexagon }
const supportedd3Symbol = ["symbolCircle", "symbolTriangle", "symbolDiamond", "symbolCircle", "symbolCross"]

export const donne_la_color = (residue: string) => {
    if (Object.keys(legend).includes(residue)) return legend[residue]["color"]
    return hashStringToColor(residue)
    //return "#585858"
}

export const get_d3shape = (residue: string): any => {
    try {
        //@ts-ignore
        if (Object.keys(customSymbol).includes(legend[residue]["shape"])) return customSymbol[legend[residue]["shape"]]
        //@ts-ignore
        if ((Object.keys(legend).includes(residue)) && supportedd3Symbol.includes(legend[residue]["shape"])) return d3[legend[residue]["shape"]]
        return d3["symbolCircle"]
    } catch (error) {
        console.error(error);
        return d3["symbolCircle"]
    }


}