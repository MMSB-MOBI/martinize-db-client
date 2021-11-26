import ItpFile, { TopFile } from "itp-parser-forked"

export interface Bead {
    name: string, 
    charge : number,
    moleculeName? : string 
}

export async function itpBeads(top_file : File|string, itp_files:File[]|string[]) : Promise<Bead[]> {
    const beads: Bead[] = []


    let top : File
    if(top_file instanceof File) top = top_file
    else top = new File([top_file], "full.top")

    //@ts-ignore
    const itps : File [] = itp_files.map((itp, idx) => { 
        if(itp instanceof File) return itp
        else return new File([itp], `itp${idx}.itp`)
    })

    const system = await TopFile.read(top, itps)
    for (const molecule of system.molecules){
        if(molecule.type.startsWith(";")) continue
        if(molecule.itp){
            const this_itp_beads: Bead[] = []
            for (const atom of molecule.itp.atoms){
                const [,name,,,,,charge] = atom.split(ItpFile.BLANK_REGEX)
                const numberCharge = parseInt(charge)
                this_itp_beads.push({name, charge : numberCharge})
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
                beads.push({name: "other", charge : 0, moleculeName : molecule.type})
            }
        }

    }
    return beads
}