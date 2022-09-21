import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@material-ui/core';
import ItpFile from 'itp-parser-forked';
import Grid from '@mui/material/Grid';
import { Marger } from '../../../helpers';

interface props {
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
    error: string,

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
            error: '',
        }
    }

    componentDidUpdate(prevProps: Readonly<props>, prevState: Readonly<state>, snapshot?: any): void {
        console.log(this.props.error)
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
        let test = listparseditp.filter((e: any) => (e.idres == idresmodif))
        console.log(test)
        return test
    }

    render() {

        return (
            <Dialog open={true}  >
                <DialogTitle>Hello! Bienvenue sur le composant de fix bonds! </DialogTitle>
                <DialogContent>

                    <Marger size={'2'}></Marger>
                    <FormControl>
                        <Grid container component="main"  >

                            <Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }}>

                                <Typography> Residue number {this.props.error[this.state.numeroLink][0]}</Typography>


                                <RadioGroup
                                    aria-labelledby="demo-radio-buttons-group-label"
                                    defaultValue="female"
                                    name="radio-buttons-group"
                                    onChange={(e) => { console.log((e.target as HTMLInputElement).value) }}
                                >
                                    {
                                        this.getbeadslist(this.props.error[this.state.numeroLink][0])
                                            .map((e: any) => {
                                                return <FormControlLabel
                                                    labelPlacement="start"
                                                    value={`Id : ${e.idbead}, Bead : ${e.bead}`}
                                                    control={<Radio />}
                                                    label={`Id : ${e.idbead}, Bead : ${e.bead}`} />
                                            })
                                    }
                                </RadioGroup>
                            </Grid>
                            <Grid item xs={2} style={{ textAlign: 'right', alignItems: 'right', justifyContent: 'center', }}>
                            </Grid>
                            <Grid item xs={5} style={{ textAlign: 'right', alignItems: 'right', justifyContent: 'center', }}>

                                <Typography> Residue number {this.props.error[this.state.numeroLink][1]} </Typography>
                                <RadioGroup
                                    aria-labelledby="demo-radio-buttons-group-label"
                                    defaultValue="female"
                                    name="radio-buttons-group"
                                >
                                    {
                                        this.getbeadslist(this.props.error[this.state.numeroLink][1])
                                            .map((e: any) => {
                                                return <FormControlLabel
                                                    value={`Id : ${e.idbead}, Bead : ${e.bead}`}
                                                    control={<Radio />}
                                                    label={`Id : ${e.idbead}, Bead : ${e.bead}`} />
                                            })
                                    }
                                </RadioGroup>
                            </Grid>
                        </Grid>
                    </FormControl>


                </DialogContent>
                <DialogActions>
                    {this.state.numeroLink ? (<>
                        <div>
                            <Button onClick={() => { this.props.close() }}>Previous Link</Button>
                        </div>
                    </>) : (<></>)}

                    <Button color='warning' onClick={() => { this.props.close() }}>Close that</Button>

                    {(this.state.numeroLink + 1) === this.props.error.length ? (<>
                        <div>
                            <Button onClick={() => { this.props.close() }}>Apply</Button>
                        </div>
                    </>) : (<>
                        <Button onClick={() => { this.props.close() }}>Next Link</Button>
                    </>)}



                </DialogActions>
            </Dialog >
        );
    }
}

