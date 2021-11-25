import { NglRepresentation } from "./components/Builder/NglWrapper";
import * as ngl from '@mmsb/ngl';
import AtomProxy from '@mmsb/ngl/declarations/proxy/atom-proxy';
import { AvailableForceFields } from './types/entities'
import { Bead } from './components/Builder/BeadsHelper'
const martini3ColorScheme: {[beadType: string] : string} = require('./schemes/martini3_cyan_orange.json');
const martini2ColorScheme: {[beadType: string] : string} = require('./schemes/martini2_cyan_orange.json');

type BeadSize = 'R' | 'S' | 'T'
 
const DEFAULT_COLOR = "0xbfbfbf" //gray, 0x instead of # because ngl
const DEFAULT_RADIUS = 0.5

const MARTINI3_BEADS_REGEX = new RegExp("^(?<type>(?<size>[S|T]{0,1})[N|P|C|X|Q]{1}[1-9]{1})(?<add>[a-z]{0,2})$")
const MARTINI3_BEADS_RADIUS = {"S" : 2.30, "T" : 1.91, "R" : 2.64}

const MARTINI2_BEADS_RADIUS = {"R" : 2.64, "S" : 2.41, "T" : 1.80}
const MARTINI2_BEADS_REGEX = new RegExp("^(?<size>[S|T]{0,1})(?<type>[N|P|C|X|Q]{1}(?<add>[a-z0-9]*))$")
const MARTINI2_REGEX_EXCEPTIONS = ["AC1", "AC2"]

const FF_TO_SCHEMES : {[ff:string] : {color:{[beadType: string] : string}, radius: {[key in BeadSize]: number}, regex: RegExp, regexExceptions?:string[]}} = {
    'martini3001' : {color : martini3ColorScheme, radius: MARTINI3_BEADS_RADIUS, regex : MARTINI3_BEADS_REGEX},
    'martini22' : {color : martini2ColorScheme, radius: MARTINI2_BEADS_RADIUS, regex: MARTINI2_BEADS_REGEX, regexExceptions: MARTINI2_REGEX_EXCEPTIONS}
}

export const martiniSchemes = new class MartiniColorSchemes {
    
    constructor(){
        //this._martini3RadiusSelector = this._getMartini3RadiusSelector()
    }

    getMartini3ProteinRadiusScheme(ff:AvailableForceFields, beads: Bead[], factor:number=1){
        return beads.map(bead => {
            if (!(ff in FF_TO_SCHEMES)) return DEFAULT_RADIUS
            const regMatch = bead.name.match(FF_TO_SCHEMES[ff].regex)
            const beadSize = (regMatch?.groups?.size ? regMatch?.groups?.size : "R") as BeadSize
            return FF_TO_SCHEMES[ff].radius[beadSize] * factor
        })
    }

    getMartini3ProteinColorScheme(ff: AvailableForceFields, beads:Bead[]){
        console.log("color scheme", ff); 
        const schemeId = ngl.ColormakerRegistry.addScheme(function() {
            let knownFf = true; 
            let regexExc: string[] | undefined
            if(!(ff in FF_TO_SCHEMES)) knownFf = false
            else regexExc = FF_TO_SCHEMES[ff].regexExceptions
            //@ts-ignore
            this.atomColor = function (atom: AtomProxy){
                if(!knownFf) return DEFAULT_COLOR
                const bead = beads[atom.index]
                let beadName: string | undefined; 
                if (regexExc && regexExc.includes(bead.name)){
                    beadName = bead.name
                }
                else {
                    const regMatch = bead.name.match(FF_TO_SCHEMES[ff].regex)
                    beadName = regMatch?.groups?.type
                }
                
                const colorScheme =  FF_TO_SCHEMES[ff].color
                if(beadName && beadName in colorScheme){
                    if(bead.charge === -1) return "0xff0000" //red
                    if(bead.charge === 1) return "0x0000ff" //blue
                    return colorScheme[beadName].replace('#', '0x')
                }
                else return DEFAULT_COLOR
            }
        })

        return schemeId
    }
}
 
