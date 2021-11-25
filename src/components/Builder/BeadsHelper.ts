import ItpFile from "itp-parser-forked"

interface Bead {
    name: string, 
    charge : number
}

export async function itpBeads(itp_files:File[]) : Promise<string[]> {
    const beads: string[] = []
    for (const itp of itp_files){
        console.log("itp beads", itp)
        const mol = await ItpFile.read(itp)
        for (const atom of mol.atoms){
            const [,beadName,] = atom.split(ItpFile.BLANK_REGEX)
            beads.push(beadName)
        }
    }

    return beads
}