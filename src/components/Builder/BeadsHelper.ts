import ItpFile from "itp-parser-forked"

export interface Bead {
    name: string, 
    charge : number
}

export async function itpBeads(itp_files:File[]) : Promise<Bead[]> {
    const beads: Bead[] = []
    for (const itp of itp_files){
        console.log("itp beads", itp)
        const mol = await ItpFile.read(itp)
        for (const atom of mol.atoms){
            const [,name,,,,,charge] = atom.split(ItpFile.BLANK_REGEX)
            const numberCharge = parseInt(charge)
            beads.push({name, charge : numberCharge})
        }
    }

    return beads
}