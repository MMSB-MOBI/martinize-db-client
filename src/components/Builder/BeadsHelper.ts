import ItpFile, { TopFile } from "itp-parser-forked"

export interface Bead {
    name: string, 
    charge : number,
    moleculeName? : string 
    goVirtSite? : boolean; 
}

export async function itpBeads(top_file : File|string, itp_files:File[]|string[], mode?: string) : Promise<Bead[]> {
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
            for (const atom of molecule.itp.atoms){
                if(atom.startsWith(";")) continue
                
                const [,name,,,atomName,,charge] = atom.split(ItpFile.BLANK_REGEX)
                const numberCharge = parseInt(charge)

                let beadToPush: Bead = {name, charge: numberCharge}
                
                if(mode === "go"){
                    console.log("mode go")
                    if(atomName === "BB") bb_registration.push(name)
                    if(name.startsWith("molecule")){
                        const correspondingBB = bb_registration[goVirtSiteNumber]
                        console.log(name, correspondingBB); 
                        beadToPush = {name: correspondingBB, charge : numberCharge, goVirtSite : true}
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
                beads.push({name: "other", charge : 0, moleculeName : molecule.type})
            }
        }

    }
    return beads
}