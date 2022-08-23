import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { Input, TextField, Typography } from '@material-ui/core';
import ItpFile from 'itp-parser-forked';
import Grid from '@mui/material/Grid';
import { SimpleSelect } from '../../../Shared';
import { ThreeSixtyRounded } from '@material-ui/icons';

interface props {
    close: () => void,
    showCreate: boolean,
    addthisRule: (s: string) => void,
}

interface state {
    itp1: string | undefined,
    itp2: string | undefined,
    beadlistitp1: any,
    beadlistitp2: any,
    angleid: any,
    beadselected1: any,
    beadselected2: any,
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
            beadlistitp1: undefined,
            beadlistitp2: undefined,
            beadselected1: undefined,
            beadselected2: undefined,
            angleid: undefined,
            out: undefined,
            error: '',
        }
    }

    componentDidUpdate(prevProps: Readonly<props>, prevState: Readonly<state>, snapshot?: any): void {
        if ((this.state.beadselected1 !== undefined) && (this.state.beadselected2 !== undefined) && (this.state.angleid !== undefined)) {
            if ((prevState.beadselected1 !== this.state.beadselected1) || (prevState.beadselected2 !== this.state.beadselected2) || (prevState.angleid !== this.state.angleid)) {
                this.run()
            }
        }
    }

    run() {
        //Prepare the out file

        // [link]
        // [molmeta]
        // by_atom_id true
        // [bonds]
        // ; BB -> MEE
        // 303 305 1 0.280 7000.0
        // [angles]
        // ; -BB BB MEE
        // 300 303 305 2 140.00 25.0

        const nextbead = ( this.state.beadlistitp1.length + parseInt(this.state.beadselected2)).toString()
        let res = `
    ;  connexion rule
    [link]
    [molmeta]
    by_atom_id true
    [bonds]
    ` + this.state.beadselected1 + ` ` + nextbead + ` 1 0.280 7000.0
    [angles]
    `+ this.state.angleid + ` ` + this.state.beadselected1 + ` ` + nextbead + ` 2 140.00 25.0
    `
        this.setState({ out: res })

    }

    extract_idbeads = (li: string[]) => {
        // 301 SC3  128 ARG SC1 301  0.0
        let out = []
        for (let e of li) {
            const esplit = e.split(' ').filter(e => e !== '')
            const atomID = esplit[0]
            const beadID = esplit[4]
            out.push({ id: atomID, bead: beadID })
        }
        return out
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
                    const parseditp1 = ItpFile.readFromString(this.state.itp1!);
                    const beads = this.extract_idbeads(parseditp1.getField('atoms'))
                    this.setState({ beadlistitp1: beads })
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
                    const parseditp2 = ItpFile.readFromString(this.state.itp2!);
                    const beads = this.extract_idbeads(parseditp2.getField('atoms'))
                    this.setState({ beadlistitp2: beads })
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

                    {/* {(this.state.beadselected1 !== undefined) &&
                        <Typography>  Bead : {this.state.beadlistitp1[parseInt(this.state.beadselected1)].bead}  id : {this.state.beadlistitp1[parseInt(this.state.beadselected1)].id} </Typography>
                    } */}

                    <Typography> Itp 2 : </Typography>
                    <Input
                        color="primary"
                        onChange={(e: any) => this.handleUpload2(e.target.files)}
                        type="file"
                    />

                    {((this.state.beadlistitp2 !== undefined) && (this.state.beadlistitp1 !== undefined)) &&
                        <Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >

                            <SimpleSelect
                                //formControlClass={this.props.classes.ff_select}
                                required
                                label="Start angle"
                                variant="standard"
                                values={this.state.beadlistitp1.map((e: any) => ({ id: e.id, name: e.id }))}
                                id="beadangle"
                                value={this.state.angleid}
                                onChange={v => { this.setState({ angleid: v }) }} />


                            <SimpleSelect
                                //formControlClass={this.props.classes.ff_select}
                                required
                                label="Bead to connect itp 1"
                                variant="standard"
                                values={this.state.beadlistitp1.map((e: any) => ({ id: e.id, name: e.id }))}
                                id="bead1"
                                value={this.state.beadselected1}
                                onChange={v => { this.setState({ beadselected1: v }) }} />


                            <SimpleSelect
                                //formControlClass={this.props.classes.ff_select}
                                required
                                label="Bead to connect itp 2"
                                variant="standard"
                                values={this.state.beadlistitp2.map((e: any) => ({ id: e.id, name: e.id }))}
                                id="bead2"
                                value={this.state.beadselected2}
                                onChange={v => { this.setState({ beadselected2: v }) }} />


                        </Grid>
                    }
                    {/* {(this.state.beadselected2 !== undefined) &&
                        <Typography>  Bead : {this.state.beadlistitp2[parseInt(this.state.beadselected2)].bead}  id : {this.state.beadlistitp2[parseInt(this.state.beadselected1)].id} </Typography>
                    } */}


                    {(this.state.error !== '') &&
                        <Typography display="block" variant="h6" style={{ backgroundColor: "red" }}  >
                            {this.state.error}
                        </Typography>
                    }

                    {(this.state.out !== undefined) &&
                        <Typography display="block" variant="h6"  >
                            {this.state.out}
                        </Typography>
                    }

                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { this.props.addthisRule(this.state.out!); this.props.close() }}>Add this link</Button>
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

