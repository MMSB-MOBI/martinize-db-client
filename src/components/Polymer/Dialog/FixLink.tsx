import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { FormControl, FormControlLabel, OutlinedInput, Radio, RadioGroup, TextField, Typography } from '@material-ui/core';
import ItpFile from 'itp-parser-forked';
import Grid from '@mui/material/Grid';
import { Marger } from '../../../helpers';

interface props {
    send: (itp: string) => void;
    itp: string,
    close: () => void,
    current_position: number | undefined,
    fixing_error: any[],
    update_error: (e: any) => void,
    function_truc: (id: number) => void
}

interface state {
    bonds: any[],
    numeroLink: number,
    angleid: any,
    tofix: any[],
    out: string | undefined,

}

export default class FixLink extends React.Component<props, state> {
    constructor(props: props) {
        // Required step: always call the parent class' constructor
        super(props);

        // Set the state directly. Use props if necessary.
        this.state = {
            numeroLink: this.props.current_position ? this.props.current_position : 0,
            bonds: [],
            tofix: [],
            angleid: undefined,
            out: undefined,
        }
    }

    componentDidUpdate(prevProps: Readonly<props>, prevState: Readonly<state>, snapshot?: any): void {
        //console.log(this.props.error)
    }

    ApplyFix = () => {

        const splititp = this.props.itp.split("[ bonds ]")
        let itpFIX = splititp[0] + "[ bonds ]\n"

        for (const fix of this.props.fixing_error) {
            itpFIX = itpFIX + `${fix["start"]} ${fix["end"]} 1 ${fix["angle"]} ${fix["force"]}\n`
        }

        itpFIX = itpFIX + splititp[1]

        this.props.send(itpFIX)
        this.props.close()
    }




    handlechangeBead = (beadtruc: string, position: string) => {
        let copy = this.props.fixing_error
        copy[this.state.numeroLink][position] = beadtruc
        this.props.update_error(copy)
        //console.log(this.props.fixing_error)
    }

    handleangle = (a: string) => {
        let copy = this.props.fixing_error
        copy[this.state.numeroLink]["angle"] = a
        this.props.update_error(copy)
        //console.log(this.props.fixing_error)
    }

    handleforce = (f: string) => {
        let copy = this.props.fixing_error
        copy[this.state.numeroLink]["force"] = f
        this.props.update_error(copy)
        //console.log(this.props.fixing_error)
    }


    render() {

        console.log(this.props, this.state)

        return (
            <Dialog open={true}  >
                <DialogTitle>Hello! Bienvenue sur le composant de fix bonds! </DialogTitle>
                <DialogContent>

                    <Marger size={'2'}></Marger>
                    <FormControl>
                        <Grid container component="main"  >

                            <Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }}>

                                <Typography variant='h6'> Residue {this.props.fixing_error[this.state.numeroLink]['startresname']}  #{this.props.fixing_error[this.state.numeroLink]['start']}</Typography>

                                <RadioGroup
                                    aria-labelledby="demo-radio-buttons-group-label"
                                    value={this.props.fixing_error[this.state.numeroLink]["start"]}
                                    name="radio-buttons-group"
                                    onChange={(e) => { this.props.function_truc(this.state.numeroLink); this.handlechangeBead((e.target as HTMLInputElement).value, "start") }}
                                >
                                    {
                                        this.props.fixing_error[this.state.numeroLink]["startchoice"]
                                            .map((e: any) => {
                                                return <FormControlLabel
                                                    labelPlacement="start"
                                                    value={e.idbead}
                                                    control={<Radio />}
                                                    label={` Bead : ${e.bead}`} />
                                            })
                                    }
                                </RadioGroup>
                            </Grid>
                            <Grid item xs={2}  >
                            </Grid>
                            <Grid item xs={5} style={{ textAlign: 'right', alignItems: 'right', justifyContent: 'center', }}>

                                <Typography variant='h6'> Residue {this.props.fixing_error[this.state.numeroLink]['endresname']}  #{this.props.fixing_error[this.state.numeroLink]['end']}</Typography>
                                <RadioGroup
                                    aria-labelledby="demo-radio-buttons-group-label"
                                    value={this.props.fixing_error[this.state.numeroLink]["end"]}
                                    name="radio-buttons-group"
                                    onChange={(e) => { this.props.function_truc(this.state.numeroLink); this.handlechangeBead((e.target as HTMLInputElement).value, "end") }}
                                >
                                    {
                                        this.props.fixing_error[this.state.numeroLink]["endchoice"]
                                            .map((e: any) => {
                                                return <FormControlLabel
                                                    value={e.idbead}
                                                    control={<Radio />}
                                                    label={` Bead : ${e.bead}`} />
                                            })
                                    }
                                </RadioGroup>
                            </Grid>
                        </Grid>

                        <Grid container component="main"  >
                            <Grid item xs={5} style={{ textAlign: 'right', alignItems: 'right', justifyContent: 'center', }}>
                                <TextField
                                    id="outlined-number"
                                    label="angle"
                                    type="number"
                                    inputProps={{ step: "0.1" }}
                                    defaultValue="0.336"
                                    onChange={v => { this.props.function_truc(this.state.numeroLink); this.handleforce(v.target.value) }}
                                />
                            </Grid>

                            <Grid item xs={2}  >

                            </Grid>

                            <Grid item xs={5} style={{ textAlign: 'right', alignItems: 'right', justifyContent: 'center', }}>
                                <TextField
                                    id="outlined-number"
                                    label="force"
                                    type="number"
                                    inputProps={{ step: "100" }}
                                    defaultValue="1200"
                                    onChange={v => { this.props.function_truc(this.state.numeroLink); this.handleforce(v.target.value) }}
                                />
                            </Grid>
                        </Grid>



                    </FormControl>


                </DialogContent>
                <DialogActions>
                    {this.state.numeroLink ? (<>
                        <div>
                            <Button onClick={() => { this.props.function_truc(this.state.numeroLink); this.setState({ numeroLink: this.state.numeroLink - 1 }) }}>Previous Link</Button>
                        </div>
                    </>) : (<></>)}

                    <Button color='warning' onClick={() => { this.props.close() }}>Close</Button>

                    {((this.state.numeroLink + 1) !== this.props.fixing_error.length) &&
                        <Button onClick={() => { this.props.function_truc(this.state.numeroLink); this.setState({ numeroLink: this.state.numeroLink + 1 }) }}>Next Link</Button>
                    }

                    {(this.props.fixing_error.map((e: any) => { return e.is_fixed }).includes(false)) ?
                        <>  </> :
                        <Button color='success' onClick={() => { this.ApplyFix() }}>Apply</Button>
                    }

                </DialogActions>
            </Dialog >
        );
    }
}

