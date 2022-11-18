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
import { LinearProgress } from '@mui/material';

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
}

interface state {
    box: string,
    name: string,
    numberpolymer: string
}

export default class RunPolyplyDialog extends React.Component<props, state> {

    constructor(props: props) {
        // Required step: always call the parent class' constructor
        super(props);

        // Set the state directly. Use props if necessary.
        this.state = {
            box: "10",
            name: "polymol",
            numberpolymer: "1"
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

    async dlzip(itp: string, gro: string, filename: string) {

        const zip = new JSZip();

        zip.file("out.itp", itp);
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

                    <DialogTitle>Send to polyply !</DialogTitle>

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
                    {this.props.itp ? (<>

                        <Button onClick={() => { this.dl(this.props.itp, "out.itp"); }}> <Icon className={"fas fa-download"} /> Download .itp</Button>
                    </>
                    ) : (<></>)}

                    {this.props.gro ? (<>

                        <Button onClick={() => { this.dl(this.props.gro, "out.gro"); }}> <Icon className={"fas fa-download"} /> Download .gro</Button>
                    </>) : (<></>)}


                    {(this.props.gro && this.props.itp) ? (<>

                        <Button onClick={() => { this.dlzip(this.props.itp, this.props.gro, "out.zip"); }}> <Icon className={"fas fa-download"} /> Download all</Button>
                    </>) : (<></>)}

                    {this.props.pdb ? (<>
                        <div>
                            <ResultViewer top={this.props.top} pdb={this.props.pdb} itp={this.props.itp} ff="martini3001" />
                        </div>
                    </>) : (<></>)}

                    {((this.props.currentStep! === 0) || (this.props.currentStep! === 4)) ? (<>
                        <DialogActions >
                            <Button color='warning' onClick={() => { this.props.close() }}>Close</Button>
                        </DialogActions>
                    </>) : (<>
                        <Marger size="1rem" />
                        <LinearProgress />
                    </>)}

                    {(this.props.currentStep! === 4) ? (<>
                        <DialogActions >
                            <Button color='success' onClick={() => { this.props.add_to_history() }}>Add to history</Button>
                        </DialogActions>
                    </>) : (<>

                    </>)}


                </Dialog >
            ) : (<></>)
        )
    }
}

