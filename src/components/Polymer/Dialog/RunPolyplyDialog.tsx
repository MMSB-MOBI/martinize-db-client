import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import { Marger } from '../../../helpers';
import Icon from '@mui/material/Icon';
import JSZip from 'jszip';
import ResultViewer from './ResultViewer';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import { Grid, LinearProgress, Link } from '@mui/material';

interface props {
    send: (arg1: string, arg2: string, number: string) => void;
    currentStep: number;
    top: string,
    itp: string,
    gro: string,
    pdb: string,
    warning: string,
    close: () => void;
    add_to_history: () => void;
    add_to_history_redirect: () => void;
    jobid: string | undefined
    forcefield: string
}

interface state {
    box: string,
    name: string,
    numberpolymer: string
    jobid: string,
}

export default class RunPolyplyDialog extends React.Component<props, state> {

    constructor(props: props) {
        // Required step: always call the parent class' constructor
        super(props);

        // Set the state directly. Use props if necessary.
        this.state = {
            box: "10",
            name: "polymol",
            numberpolymer: "1",
            jobid: ""
        }
    }

    steps = ['Set parameters', 'Generate ITP', 'Generate GRO', 'Generate visualisation'];

    dl(s: string, filename: string) {

        const blob = new Blob([s], { type: "text" });
        const a = document.createElement("a");
        a.download = filename;
        a.href = window.URL.createObjectURL(blob);
        const clickEvt = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
        });
        a.dispatchEvent(clickEvt);
        a.remove();
    }

    handlehistory = async () => {
        this.props.add_to_history()
        this.props.close()
    }

    handlehistoryandredirect = async () => {
        this.props.add_to_history_redirect()
        this.props.close()
    }


    async dlzip(itp: string, gro: string, pdb: string, filename: string) {

        const zip = new JSZip();

        zip.file("out.itp", itp);
        zip.file("out.pdb", pdb);
        zip.file("out.gro", gro);

        const blob = zip.generateAsync({
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: { level: 6 },
        });

        const a = document.createElement("a");
        a.download = filename;
        a.href = window.URL.createObjectURL(await blob);
        const clickEvt = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
        });
        a.dispatchEvent(clickEvt);
        a.remove();
    }

    render() {
        let show = false
        if (this.props.currentStep !== undefined) {
            show = true
        }

        return (
            show ? (
                <Dialog maxWidth="sm" fullWidth open={true} >
                    <DialogTitle>Send to polyply!</DialogTitle>

                    <DialogContent>
                        <Stepper activeStep={this.props.currentStep!} orientation="vertical" >

                            {this.steps.map((label) => (
                                <Step key={label}>
                                    <Marger size="1rem" />
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}


                            {this.props.warning ? (
                                <Typography> {this.props.warning} </Typography>

                            ) : (<></>)}
                        </Stepper>

                        {this.props.currentStep ? (<></>) : (
                            <>
                                <FormControl sx={{ m: 1, width: '12ch' }} variant="outlined">
                                    <TextField
                                        id="outlined-number"
                                        label="box size"
                                        type="number"
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        value={this.state.box}
                                        onChange={(e) => this.setState({ box: e.target.value })} />
                                </FormControl>

                                <FormControl sx={{ m: 1, width: '16ch' }} variant="outlined">
                                    <TextField
                                        id="outlined-number"
                                        label="Number of polymer"
                                        type="number"
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        value={this.state.numberpolymer}
                                        onChange={(e) => this.setState({ numberpolymer: e.target.value })} />
                                </FormControl>

                                <FormControl sx={{ m: 1, width: '25ch' }} variant="outlined">
                                    <OutlinedInput
                                        id="outlined-adornment-weight"
                                        value={this.state.name}
                                        onChange={(e) => this.setState({ name: e.target.value })}
                                        endAdornment={<InputAdornment position="end">name</InputAdornment>}
                                        aria-describedby="outlined-weight-helper-text" />
                                </FormControl>

                                <DialogActions>
                                    <Button onClick={() => { this.props.send(this.state.box, this.state.name, this.state.numberpolymer); }}>Submit</Button>
                                </DialogActions></>)
                        }

                    </DialogContent>

                    <Grid container component="main" style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'left', }}>
                        <Grid item xs={4}>
                            {this.props.itp &&
                                <Button onClick={() => { this.dl(this.props.itp, "out.itp"); }}> <Icon className={"fas fa-download"} /> Download .itp</Button>
                            }
                        </Grid>

                        <Grid item xs={4}>
                            {this.props.gro &&
                                <Button onClick={() => { this.dl(this.props.gro, "out.gro"); }}> <Icon className={"fas fa-download"} /> Download .gro</Button>
                            }
                        </Grid>

                        <Grid item xs={4}>
                            {this.props.pdb &&
                                <Button onClick={() => { this.dl(this.props.pdb, "out.pdb"); }}> <Icon className={"fas fa-download"} /> Download .pdb</Button>
                            }
                        </Grid>

                    </Grid>

                    {(this.props.gro && this.props.itp && this.props.pdb) ? (<>

                        <Button onClick={() => { this.dlzip(this.props.itp, this.props.gro, this.props.pdb, "out.zip"); }}> <Icon className={"fas fa-download"} /> Download all</Button>
                    </>) : (<></>)}

                    {this.props.pdb &&
                        <ResultViewer top={this.props.top} pdb={this.props.pdb} itp={this.props.itp} currentforcefield={this.props.forcefield} />
                    }


                    {((this.props.currentStep! === 0) || (this.props.currentStep! === 4)) ? (<>

                        <Grid container component="main" style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center', }}>
                            <Grid item xs={3} >
                                <DialogActions >
                                    <Button color='warning' onClick={() => { this.props.close() }}>Close</Button>
                                </DialogActions>
                            </Grid>


                            {(this.props.currentStep! === 4) &&
                                <>
                                    <Grid item xs={9} >
                                        <DialogActions >
                                            <Button color='success' onClick={this.handlehistory}>Add to history</Button>
                                        </DialogActions>
                                    </Grid>
                                    <Grid item xs={12} >
                                        <DialogActions >

                                            <Button onClick={this.handlehistoryandredirect}>
                                                Save and Go to molecule viewer
                                            </Button>

                                        </DialogActions>
                                    </Grid>

                                </>
                            }
                        </Grid>
                    </>) : (<>
                        <Marger size="1rem" />
                        <LinearProgress />
                    </>)}





                </Dialog >
            ) : (<></>)
        )
    }
}

