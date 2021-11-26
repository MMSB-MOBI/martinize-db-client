import { NglRepresentation } from "./components/Builder/NglWrapper";
import * as ngl from '@mmsb/ngl';
import AtomProxy from '@mmsb/ngl/declarations/proxy/atom-proxy';
import { AvailableForceFields } from './types/entities'
import { Bead } from './components/Builder/BeadsHelper'
const martini3ColorScheme: {[beadType: string] : string} = require('./schemes/martini3_cyan_orange.json');
const martini2ColorScheme: {[beadType: string] : string} = require('./schemes/martini2_cyan_orange.json');

type BeadSize = 'R' | 'S' | 'T'
 
const DEFAULT_COLOR = "#4d4d4d"
const DEFAULT_RADIUS = 0.5

const MOLECULE_EXCEPTIONS_COLOR : {[molecule : string]: string} = {
    "W" : "#a6a6a6", 
    "NA+" : "blue", 
    "CL-" : "red"
} //it's molecule types in .top files that are not described in itp file, like solvents 

const MARTINI3_BEADS_REGEX = new RegExp("^(?<type>(?<size>[S|T]{0,1})[N|P|C|X|Q]{1}[1-9]{1})(?<add>[a-z]{0,2})$")
const MARTINI3_BEADS_RADIUS = {"S" : 2.30, "T" : 1.91, "R" : 2.64}

const MARTINI2_BEADS_RADIUS = {"R" : 2.64, "S" : 2.41, "T" : 1.80}
const MARTINI2_BEADS_REGEX = new RegExp("^(?<size>[S|T]{0,1})(?<type>[N|P|C|X|Q]{1}(?<add>[a-z0-9]*))$")
const MARTINI2_REGEX_EXCEPTIONS = ["AC1", "AC2"]

const FF_TO_SCHEMES : {[ff:string] : {color:{[beadType: string] : string}, radius: {[key in BeadSize]: number}, regex: RegExp, regexExceptions?:string[]}} = {
    'martini3001' : {color : martini3ColorScheme, radius: MARTINI3_BEADS_RADIUS, regex : MARTINI3_BEADS_REGEX},
    'martini22' : {color : martini2ColorScheme, radius: MARTINI2_BEADS_RADIUS, regex: MARTINI2_BEADS_REGEX, regexExceptions: MARTINI2_REGEX_EXCEPTIONS}
}

export default class MartiniSchemes {
    
    protected _originalColorMap : {[ff:string]: string[]} = {}; //{force field : color[]} list of colors, colors in position 0 is color of bead 0 and so on
    protected _originalColorSchemeId : {[ff: string]: string} = {} //{force field : schemeId}

    protected _getColor(bead: Bead, colorAndRegex : {color:{[beadType: string] : string}, regex: RegExp, regexExceptions?:string[]}) {
        if(bead.name === "other"){
            if(bead.moleculeName && (bead.moleculeName in MOLECULE_EXCEPTIONS_COLOR)) return MOLECULE_EXCEPTIONS_COLOR[bead.moleculeName]
            return DEFAULT_COLOR
        }
        else {
            const regexExc = colorAndRegex.regexExceptions
            const beadRegex = colorAndRegex.regex
            const colorScheme = colorAndRegex.color
            const beadName = (regexExc && regexExc.includes(bead.name)) ? bead.name : bead.name.match(beadRegex)?.groups?.type
            if (beadName && beadName in colorScheme){
                if(Math.sign(bead.charge) === -1) return "red"
                if(Math.sign(bead.charge) === 1) return "blue"
                return colorScheme[beadName]
            }
            return DEFAULT_COLOR
        }
    }

    protected _createColorMap(ff:string, beads: Bead[]):string[]{
        const colorMap: string[] = new Array(beads.length)
        const colorScheme = (ff in FF_TO_SCHEMES) ? FF_TO_SCHEMES[ff].color : undefined
        if (!colorScheme) colorMap.fill(DEFAULT_COLOR, 0, beads.length)
        else {
            const regexExc = FF_TO_SCHEMES[ff].regexExceptions
            const beadRegex = FF_TO_SCHEMES[ff].regex
            for (const [idx,bead] of beads.entries()){
                const color = this._getColor(bead, {color: colorScheme, regex: beadRegex, regexExceptions : regexExc})

                colorMap[idx] = color
            }
        }

        return colorMap
    }

    protected _createSchemeId(colorMap: string[]): string{
        const colorObj : {[color:string] : number[]} = {} //{color : atom_index[]}
        for(const [idx, color] of colorMap.entries()){
            if(!(color in colorObj)) colorObj[color] = []
            colorObj[color].push(idx)
        }

        const colorSelection = Object.keys(colorObj).map(color => [color, "@" + colorObj[color].join(",")]) 

        //@ts-ignore
        return ngl.ColormakerRegistry.addSelectionScheme(colorSelection)
    }

    protected _createSchemeIdForFewAtoms(atoms : {[atomIdx: string]: string}){
        const colorObj : {[color:string] : string[]} = {}
        for (const [atomIdx, color] of Object.entries(atoms)){
            if(!(color in colorObj)) colorObj[color] = []
            colorObj[color].push(atomIdx)
        }
        const colorSelection = Object.keys(colorObj).map(color => [color, "@" + colorObj[color].join(",")]) 
        //@ts-ignore
        return ngl.ColormakerRegistry.addSelectionScheme(colorSelection)
    }

    protected _cloneAndModifyColorScheme(colorMap: string[], toModify: {[atomIdx:number]: string}){
        const newColorMap = [...colorMap];
        for(const [atomIdx, color] of Object.entries(toModify)){
            newColorMap[parseInt(atomIdx)] = color
        }
        
        return this._createSchemeId(newColorMap)
    }

    getProteinColorScheme(ff: AvailableForceFields, beads:Bead[]): string{
        if(!(ff in this._originalColorMap)) this._originalColorMap[ff] = this._createColorMap(ff, beads)
        if(!(ff in this._originalColorSchemeId)) this._originalColorSchemeId[ff] = this._createSchemeId(this._originalColorMap[ff])
        return this._originalColorSchemeId[ff]
    }

    getProteinRadiusScheme(ff:AvailableForceFields, beads: Bead[], factor:number=1){
        return beads.map(bead => {
            if (!(ff in FF_TO_SCHEMES)) return DEFAULT_RADIUS
            if(bead.name === "other") return DEFAULT_RADIUS
            const regMatch = bead.name.match(FF_TO_SCHEMES[ff].regex)
            const beadSize = (regMatch?.groups?.size ? regMatch?.groups?.size : "R") as BeadSize
            return FF_TO_SCHEMES[ff].radius[beadSize] * factor
        })
    }

    highlightAtomColorScheme(ff: AvailableForceFields, toHighlight: {[atomIdx:number]: string}): string{ 
        if(ff in this._originalColorMap) return this._cloneAndModifyColorScheme(this._originalColorMap[ff], toHighlight)
        return this._createSchemeIdForFewAtoms(toHighlight)
    }

    getRegisteredColorSchemeId(ff: AvailableForceFields): string | undefined{
        if(ff in this._originalColorSchemeId) return this._originalColorSchemeId[ff]
    }

}
 
