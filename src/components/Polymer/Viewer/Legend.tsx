
import * as React from "react";
import * as d3 from "d3";

const legend : { [residue : string] : {color : string, shape: string} } = require('./legend.json')

export const donne_la_color = ( residue : string ) => {
    return legend[ residue][ "color"]
}

export const donne_la_shape = ( residue : string ) : string  => {
    return legend[ residue][ "shape"]
}