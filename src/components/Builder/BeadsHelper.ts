import ItpFile, { TopFile } from "itp-parser-forked"
import {MARTINI2_BEADS_REGEX} from '../../martiniNglSchemes'

export interface Bead {
    name: string, 
    charge : number,
    moleculeName? : string 
    colorToTake : string //Use the color of this bead type 
}

export async function itpBeads(top_file : File|string, itp_files:File[]|string[], polarized:boolean = false, mode?: string, ) : Promise<Bead[]> {
    const beads: Bead[] = []
    let top : File
    if(top_file instanceof File) top = top_file
    else top = new File([top_file], "full.top")

    //@ts-ignore
    const itps : File [] = itp_files.map((itp, idx) => { 
        if(itp instanceof File) return itp
        else return new File([itp], `itp${idx}.itp`)
    })

    let bb_registration: string[] = []

    const system = await TopFile.read(top, itps)
    for (const molecule of system.molecules){
        if(molecule.type.startsWith(";")) continue
        if(molecule.itp){
            const this_itp_beads: Bead[] = []
            let goVirtSiteNumber = 0; 
            let previousBead = {name: "", idx: -1, colorToTake: ""}; 
            for (const atom of molecule.itp.atoms){
                if(atom.startsWith(";")) continue
                
                const [,name,,,atomName,,charge] = atom.split(ItpFile.BLANK_REGEX)
                const numberCharge = parseInt(charge)
                let beadToPush: Bead = {name, charge: numberCharge, colorToTake : name}

                if(polarized){
                    if(name === "D"){
                        beadToPush = {name, charge : numberCharge, colorToTake : previousBead.name}
                    }
                    if (previousBead.name.startsWith("Q") && name === "D") {
                        this_itp_beads[previousBead.idx].charge = numberCharge
                    }
                    if(name !== "D") previousBead.name = name.match(MARTINI2_BEADS_REGEX)?.groups?.type ?? ""
                    previousBead.idx += 1

                }

                if(mode === "go"){
                    if(atomName === "BB") bb_registration.push(name)
                    if(name.startsWith("molecule")){
                        const correspondingBB = bb_registration[goVirtSiteNumber]
                        beadToPush = {name, charge : numberCharge, colorToTake : correspondingBB}
                    } 
                }

                this_itp_beads.push(beadToPush)

            }
            let i = 0; 
            while( i < molecule.count){
                i++
                beads.push(...this_itp_beads)
            }
        }
        else { 
            let i = 0; 
            while ( i < molecule.count ) {
                i++
                beads.push({name: "other", charge : 0, moleculeName : molecule.type, colorToTake: "other"})
            }
        }

    }
    return beads
}