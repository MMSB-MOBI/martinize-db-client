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
import { Marger } from '../../../helpers';

interface props {
    customITPS: { [name: string]: string },
    close: () => void,
    showCreate: boolean,
    addthisRule: (arg0: string, arg1: string) => void,
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

        const nextbead = (this.state.beadlistitp1.length + parseInt(this.state.beadselected2)).toString()
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

    handleUpload1 = (itpname: string) => {
        this.setState({ itp1: itpname })
        this.setState({ error: "" })
        const parseditp1 = ItpFile.readFromString(this.props.customITPS[itpname]);
        const beads = this.extract_idbeads(parseditp1.getField('atoms'))
        console.log( beads)
        this.setState({ beadlistitp1: beads })
    }

    handleUpload2 = (itpname: string) => {
        this.setState({ itp2: itpname })
        this.setState({ error: "" })
        const parseditp2 = ItpFile.readFromString(this.props.customITPS[itpname]);
        const beads = this.extract_idbeads(parseditp2.getField('atoms'))
        this.setState({ beadlistitp2: beads })
    }



    show = () => {
        if (this.props.showCreate) {
            return <Dialog
                open={this.props.showCreate}
            >
                <DialogTitle>Hello! Welcome to the Itp link file creation! </DialogTitle>
                <DialogContent>

                    <Typography> Please choose your molecule to link : </Typography>

                    <SimpleSelect
                        required
                        label="Molecule number 1 :"
                        variant="standard"
                        values={Object.keys(this.props.customITPS).map(e => ({ id: e, name: e }))}
                        id="itp1"
                        value={this.state.itp1 ?? ''}
                        onChange={v => this.handleUpload1(v)} />

                    <Marger size={'2'}></Marger>

                    <SimpleSelect
                        required
                        label="Molecule number 2 :"
                        variant="standard"
                        values={Object.keys(this.props.customITPS).map(e => ({ id: e, name: e }))}
                        id="itp2"
                        value={this.state.itp2 ?? ''}
                        onChange={v => this.handleUpload2(v)} />

                    {((this.state.beadlistitp2 !== undefined) && (this.state.beadlistitp1 !== undefined)) &&
                        <Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >

                            <SimpleSelect
                                //formControlClass={this.props.classes.ff_select}
                                required
                                label="Start angle"
                                variant="standard"
                                values={this.state.beadlistitp1.map((e: any) => ({ id: e.id, name: `Id : ${e.id}, Bead : ${e.bead}`  }))}
                                id="beadangle"
                                value={this.state.angleid}
                                onChange={v => { this.setState({ angleid: v }) }} />


                            <SimpleSelect
                                //formControlClass={this.props.classes.ff_select}
                                required
                                label="Bead to connect itp 1"
                                variant="standard"
                                values={this.state.beadlistitp1.map((e: any) => ({ id: e.id, name: `Id : ${e.id}, Bead : ${e.bead}` }))}
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
                    <Button onClick={() => { this.props.addthisRule("tempname", this.state.out!); this.props.close() }}>Add this link</Button>
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

