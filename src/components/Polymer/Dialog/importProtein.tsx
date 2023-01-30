import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { DialogContentText, Input, TextField, Typography } from '@material-ui/core';
import Grid from '@mui/material/Grid';
import { Marger } from '../../../helpers';
import ItpFile from 'itp-parser-forked';
import { Alert } from '@mui/material';


interface props {
    open: boolean;
    close: () => void;
    addprotcoord: (gro: string) => void;
    addNEwMolFromITP: (itp: string) => void;
    addCustomitp: (name: string, itpstring: string) => void;
}

interface state {
    itp: string,
    gro: string,
    ok_gro: boolean,
    ok_itp: boolean,
    give2files: boolean,
}

export class ImportProtein extends React.Component<props, state> {

    constructor(props: props) {
        // Required step: always call the parent class' constructor
        super(props);

        // Set the state directly. Use props if necessary.
        this.state = {
            itp: "",
            gro: "",
            ok_gro: false,
            ok_itp: false,
            give2files: false
        }
    }

    handleitp = (selectorFiles: FileList) => {
        if (selectorFiles.length === 1) {
            let file = selectorFiles[0]
            const ext = file.name.split('.').slice(-1)[0]
            if (ext === 'itp') {
                let file = selectorFiles[0]
                let reader = new FileReader();
                reader.onload = (event: any) => {
                    if (event.target.result.includes("moleculetype")) {
                        console.log("Valid .itp file");
                        this.setState({ itp: event.target.result })
                    } else {
                        this.setState({ ok_itp: true })
                        console.log("Invalid file. Not a well-formed .itp file");
                    }

                }
                reader.readAsText(file);
            }
        }
    }

    handlegro = (selectorFiles: FileList) => {
        if (selectorFiles.length === 1) {
            let file = selectorFiles[0]
            const ext = file.name.split('.').slice(-1)[0]
            if (ext === 'gro') {
                let file = selectorFiles[0]
                let reader = new FileReader();
                reader.onload = (event: any) => {
                    if (event.target.result.includes("nan")) {
                        this.setState({ ok_gro: true })
                        this.setState({ gro: event.target.result })
                    }
                    else {
                        this.setState({ ok_gro: false })
                        this.setState({ gro: event.target.result })
                    }

                }
                reader.readAsText(file);
            }
        }
    }

    load = () => {
        if ((this.state.gro === "") || (this.state.itp === "")) {
            this.setState({ give2files: true })
        }
        else {
            this.props.addprotcoord(this.state.gro)
            this.props.addNEwMolFromITP(this.state.itp)
            const itp = ItpFile.readFromString(this.state.itp);

            let molname = ""
            for (let l of itp.getField('moleculetype')) {
                if (!l.startsWith(";")) {
                    molname = l.split(" ")[0]
                }
            }
            this.props.addCustomitp(molname, this.state.itp)
            this.props.close()
        }


        return
    }

    render() {
        return (
            <div>
                <Dialog
                    onClose={this.props.close}
                    aria-describedby="alert-dialog-slide-description"
                    open={this.props.open} >
                    <DialogTitle>Molecule import</DialogTitle>

                    <DialogContent>

                        {this.state.ok_gro &&
                            <Alert severity="warning">Missing some coordinates in your gromacs file!</Alert>
                        }
                        {this.state.ok_itp &&
                            <Alert severity="warning">Missing MoleculeType field. Impossible to load.</Alert>
                        }
                        {this.state.give2files &&
                            <Alert severity="error">Missing one file. Please provide an itp file and a gro file.</Alert>
                        }

                        <Marger size="1rem" />
                        <Grid container component="main" style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'left', }}>
                            <Grid item xs={5}>
                                <Typography variant='button' >
                                    Topology file (.itp)
                                </Typography>
                            </Grid>
                            <Grid item xs={7}>
                                <Input
                                    inputProps={{ accept: ".itp" }}
                                    color="primary"
                                    onChange={(e: any) => this.handleitp(e.target.files)}
                                    type="file"
                                />
                            </Grid>

                            <Marger size="1rem" />

                            <Grid item xs={5}>
                                <Typography variant='button' >
                                    Coordinate file (.gro)
                                </Typography>
                            </Grid>
                            <Grid item xs={7}>
                                <Input
                                    inputProps={{ accept: ".gro" }}
                                    color="primary"
                                    onChange={(e: any) => this.handlegro(e.target.files)}
                                    type="file"
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>

                    <Grid container component="main" style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'left', }}>

                        <Grid item xs={2}>
                        </Grid>

                        <Grid item xs={3}>
                            <Button color="secondary" onClick={this.props.close}>Cancel</Button>
                        </Grid>

                        <Grid item xs={3}>
                        </Grid>

                        <Grid item xs={3}>
                            <Button color="primary" onClick={this.load}>Load</Button>
                        </Grid>
                    </Grid>

                    <Marger size="1rem" />

                </Dialog>
            </div >
        );
    }
}

