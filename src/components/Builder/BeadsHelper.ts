import ItpFile, { TopFile } from "itp-parser-forked"

export interface Bead {
    name: string, 
    charge : number,
    moleculeName? : string 
}

export async function itpBeads(top_file : File, itp_files:File[]) : Promise<Bead[]> {
    const beads: Bead[] = []

    const system = await  TopFile.read(top_file, itp_files)
    
    for (const molecule of system.molecules){
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