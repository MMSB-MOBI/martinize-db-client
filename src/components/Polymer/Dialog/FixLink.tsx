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
    error: any[],
    close: () => void,
}

interface state {
    bonds: any[],
    numeroLink: number,
    angleid: any,
    tofix: any[],
    out: string | undefined,
    errorfix: any[],
}

export default class FixLink extends React.Component<props, state> {


    constructor(props: props) {
        // Required step: always call the parent class' constructor
        super(props);

        // Set the state directly. Use props if necessary.
        this.state = {
            numeroLink: 0,
            bonds: [],
            tofix: [],
            angleid: undefined,
            out: undefined,
            errorfix: Array.from({ length: this.props.error.length }, (_, i) => {
                const startbead = this.getbeadslist(this.props.error[i][0])[0]["idbead"]
                const endbead = this.getbeadslist(this.props.error[i][1])[0]["idbead"]
                let dic = { start: startbead, end: endbead, angle: "0.336", force: "1200" };
                return dic
            })
        }
    }

    componentDidUpdate(prevProps: Readonly<props>, prevState: Readonly<state>, snapshot?: any): void {
        //console.log(this.props.error)
    }

    ApplyFix = () => {
        console.log(this.state.errorfix)

        const splititp = this.props.itp.split("[ bonds ]")
        let itpFIX = splititp[0] + "[ bonds ]\n"

        for (const fix of this.state.errorfix) {
            itpFIX = itpFIX + `${fix["start"]} ${fix["end"]} 1 ${fix["angle"]} ${fix["force"]}\n`
        }

        itpFIX = itpFIX + splititp[1]

        this.props.send(itpFIX)
        this.props.close()
    }


    itplineToDico = (li: string[]) => {
        // 301 SC3  128 ARG SC1 301  0.0
        let out = []
        for (let e of li) {
            const esplit = e.split(' ').filter(e => e !== '')
            out.push({ idbead: esplit[0], idres: esplit[2], resname: esplit[3], bead: esplit[4], })
        }
        return out
    }

    getbeadslist = (idres: string) => {
        //Need to change because id start with 0 and id res start with 1 
        const idresmodif = Number(idres) + 1
        const itp = ItpFile.readFromString(this.props.itp);
        const atoms = itp.getField('atoms', true)
        const listparseditp = this.itplineToDico(atoms)
        return listparseditp.filter((e: any) => (e.idres == idresmodif))
    }

    handlechangeBead = (beadtruc: string, position: string) => {
        let copy = this.state.errorfix
        copy[this.state.numeroLink][position] = beadtruc
        this.setState({ errorfix: copy })
        //console.log(this.state.errorfix)
    }

    handleangle = (a: string) => {
        let copy = this.state.errorfix
        copy[this.state.numeroLink]["angle"] = a
        this.setState({ errorfix: copy })
        //console.log(this.state.errorfix)
    }

    handleforce = (f: string) => {
        let copy = this.state.errorfix
        copy[this.state.numeroLink]["force"] = f
        this.setState({ errorfix: copy })
        //console.log(this.state.errorfix)
    }


    render() {

        return (
            <Dialog open={true}  >
                <DialogTitle>Hello! Bienvenue sur le composant de fix bonds! </DialogTitle>
                <DialogContent>

                    <Marger size={'2'}></Marger>
                    <FormControl>
                        <Grid container component="main"  >

                            <Grid item xs={4} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }}>

                                <Typography variant='h5'> Residue #{this.props.error[this.state.numeroLink][0]}</Typography>

                                <RadioGroup
                                    aria-labelledby="demo-radio-buttons-group-label"
                                    value={this.state.errorfix[this.state.numeroLink]["start"]}
                                    name="radio-buttons-group"
                                    onChange={(e) => { this.handlechangeBead((e.target as HTMLInputElement).value, "start") }}
                                >
                                    {
                                        this.getbeadslist(this.props.error[this.state.numeroLink][0])
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
                            <Grid item xs={3}  >
                            </Grid>
                            <Grid item xs={4} style={{ textAlign: 'right', alignItems: 'right', justifyContent: 'center', }}>

                                <Typography variant='h5'> Residue #{this.props.error[this.state.numeroLink][1]} </Typography>
                                <RadioGroup
                                    aria-labelledby="demo-radio-buttons-group-label"
                                    value={this.state.errorfix[this.state.numeroLink]["end"]}
                                    name="radio-buttons-group"
                                    onChange={(e) => { this.handlechangeBead((e.target as HTMLInputElement).value, "end") }}
                                >
                                    {
                                        this.getbeadslist(this.props.error[this.state.numeroLink][1])
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
                                    onChange={v => this.handleangle(v.target.value)}
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
                                    onChange={v => this.handleforce(v.target.value)}
                                />
                            </Grid>
                        </Grid>



                    </FormControl>


                </DialogContent>
                <DialogActions>
                    {this.state.numeroLink ? (<>
                        <div>
                            <Button onClick={() => { this.setState({ numeroLink: this.state.numeroLink - 1 }) }}>Previous Link</Button>
                        </div>
                    </>) : (<></>)}

                    <Button color='warning' onClick={() => { this.props.close() }}>Remove and close</Button>

                    {(this.state.numeroLink + 1) === this.props.error.length ? (<>
                        <div>
                            <Button onClick={() => { this.ApplyFix() }}>Apply</Button>
                        </div>
                    </>) : (<>
                        <Button onClick={() => { this.setState({ numeroLink: this.state.numeroLink + 1 }) }}>Next Link</Button>
                    </>)}

                </DialogActions>
            </Dialog >
        );
    }
}

