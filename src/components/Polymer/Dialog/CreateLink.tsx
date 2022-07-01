import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { Input, TextField, Typography } from '@material-ui/core';
import ItpFile from 'itp-parser-forked';

interface props {
    close: () => void,
    showCreate: boolean,
}

interface state {
    itp1: string | undefined,
    itp2: string | undefined,
    out: string | undefined,
    error: string,
}

export default class CreateLink extends React.Component<props, state> {

    constructor(props: props) {
        // Required step: always call the parent class' constructor
        super(props);

        // Set the state directly. Use props if necessary.
        this.state = {
            itp1: undefined,
            itp2: undefined,
            out: undefined,
            error: '',
        }
    }

    handleUpload1 = (selectorFiles: FileList) => {
        this.setState({ error: "" })
        if (selectorFiles.length === 1) {
            let file = selectorFiles[0]
            const ext = file.name.split('.').slice(-1)[0]
            if (ext === 'itp') {
                let reader = new FileReader();
                reader.onload = (event: any) => {
                    this.setState({ itp1: event.target.result })
                    if (this.state.itp2 !== undefined) this.doLeBordel()
                }
                reader.readAsText(file);
            }
            else {
                this.setState({ error: "Bad file ! Should be an itp" })
                console.log("Bad file ! Should be an itp")
            }
        }
        else {
            console.log("Only one files should be upload")
            this.setState({ error: "Only one files should be upload" })
        }
    }

    handleUpload2 = (selectorFiles: FileList) => {
        this.setState({ error: "" })
        if (selectorFiles.length === 1) {
            let file = selectorFiles[0]
            const ext = file.name.split('.').slice(-1)[0]
            if (ext === 'itp') {
                let reader = new FileReader();
                reader.onload = (event: any) => {
                    this.setState({ itp2: event.target.result })
                    if (this.state.itp1 !== undefined) this.doLeBordel()
                     
                }
                reader.readAsText(file);
            }
            else {
                this.setState({ error: "Bad file ! Should be an itp" })
                console.log("Bad file ! Should be an itp")
            }
        }
        else {
            console.log("Only one files should be upload")
            this.setState({ error: "Only one files should be upload" })
        }
    }

    doLeBordel = () => {
        if ((this.state.itp1 !== undefined) && (this.state.itp2 !== undefined)) {
            const itp1 = ItpFile.readFromString(this.state.itp1);
            const atoms1 = itp1.getField('atoms')

            console.log("atoms 1", atoms1.length)

            const itp2 = ItpFile.readFromString(this.state.itp2);
            const atoms2 = itp2.getField('atoms')

            console.log("atoms 2", atoms2.length)

            console.log(atoms1)
            console.log(atoms1[atoms1.length - 1])
            let lastID = parseInt(atoms1[atoms1.length - 1].split(' ')[0])
            let angle: string[] = []
            console.log("lastID", lastID)
            if (lastID === 1) {
                angle = ["1", "2", "3"]
                
            }
            else {
                angle = [(lastID - 1).toString(), lastID.toString(), (lastID + 1).toString()]
            }
            let res = `
            [link]
            [molmeta]
            by_atom_id true
            [bonds]
            `+ lastID.toString() + ` ` + (lastID + 1).toString() + ` 1 0.280 7000.0
            [angles]
            `+ angle[0] + ` ` + angle[1] + ` ` + angle[2] + ` 2 140.00 25.0
            `
            this.setState({ out: res })

        }

    }

    show = () => {
        if (this.props.showCreate) {
            return <Dialog
                open={this.props.showCreate}
            >
                <DialogTitle>Hello! Welcome to the Itp link file creation! </DialogTitle>
                <DialogContent>

                    <Typography> Itp 1 : </Typography>
                    <Input
                        color="primary"
                        onChange={(e: any) => this.handleUpload1(e.target.files)}
                        type="file"
                    />

                    <Typography> Itp 2 : </Typography>
                    <Input
                        color="primary"
                        onChange={(e: any) => this.handleUpload2(e.target.files)}
                        type="file"
                    />

                    {(this.state.error !== '') &&
                        <Typography display="block" variant="h6" style={{ backgroundColor: "red" }}  >
                            {this.state.error}
                        </Typography>
                    }

                    {( this.state.out !== undefined) &&
                        <Typography display="block" variant="h6"  >
                        {this.state.out}
                        </Typography>
                         
                         
                       
                    }  
                         


                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { this.props.close() }}>Close that</Button>
                </DialogActions>
            </Dialog >
        }
        else return;
    }


    render() {
        return (
            <div>
                {this.show()}
            </div >
        );
    }
}

