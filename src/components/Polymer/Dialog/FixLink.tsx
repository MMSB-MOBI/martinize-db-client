import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { FormControl, FormControlLabel, InputLabel, MenuItem, OutlinedInput, Radio, RadioGroup, Select, TextField, Typography } from '@material-ui/core';
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
    is_fixed: (id: number) => void
}

interface state {
    bonds: any[],
    numeroLink: number,
    angleid: any,
    tofix: any[],
    out: string | undefined,
    b1: string,
    b2: string,
}

const beadslist = [
    "P6", "P5", "P4", "P3", "P2", "P1", "N6", "N5", "N4", "N3", "N2", "N1", "C6", "C5", "C4", "C3", "C2", "C1",
    "X4", "X3", "X2", "X1", "P6d", "P5d", "P4d", "P3d", "P2d", "P1d", "N6d", "N5d", "N4d", "N3d", "N2d", "N1d",
    "P6a", "P5a", "P4a", "P3a", "P2a", "P1a", "N6a", "N5a", "N4a", "N3a", "N2a", "N1a", "C6v", "C5v", "C4v", "C3v", "C2v", "C1v", "X4v", "X3v", "X2v", "X1v", "C6e", "C5e", "C4e", "C3e", "C2e", "C1e", "X3e", "X4e", "X2e", "X1e", "D ", "Q5", "Q4", "Q3", "Q2", "Q1", "Q5p", "Q4p", "Q3p", "Q2p", "Q1p", "Q5n", "Q4n", "Q3n", "Q2n", "Q1n", "P6q", "P5q", "P4q", "P3q", "P2q", "P1q", "N6q", "N5q", "N4q", "N3q", "N2q", "N1q", "C6q", "C5q", "C4q", "C3q", "C2q", "C1q", "X4q", "X3q", "X2q", "X1q", "P6dq", "P5dq", "P4dq", "P3dq", "P2dq", "P1dq", "N6dq", "N5dq", "N4dq", "N3dq", "N2dq", "N1dq", "P6aq", "P5aq", "P4aq", "P3aq", "P2aq", "P1aq", "N6aq", "N5aq", "N4aq", "N3aq", "N2aq", "N1aq", "C6vq", "C5vq", "C4vq", "C3vq", "C2vq", "C1vq", "X4vq", "X3vq", "X2vq", "X1vq", "C6eq", "C5eq", "C4eq", "C3eq", "C2eq", "C1eq", "X4eq", "X3eq", "X2eq", "X1eq", "P6h", "P5h", "P4h", "P3h", "P2h", "P1h", "N6h", "N5h", "N4h", "N3h", "N2h", "N1h", "C6h", "C5h", "C4h", "C3h", "C2h", "C1h", "X4h", "X3h", "X2h", "X1h", "P6dh", "P5dh", "P4dh", "P3dh", "P2dh", "P1dh", "N6dh", "N5dh", "N4dh", "N3dh", "N2dh", "N1dh", "P6ah", "P5ah", "P4ah", "P3ah", "P2ah", "P1ah", "N6ah", "N5ah", "N4ah", "N3ah", "N2ah", "N1ah", "C6vh", "C5vh", "C4vh", "C3vh", "C2vh", "C1vh", "X4vh", "X3vh", "X2vh", "X1vh", "C6eh", "C5eh", "C4eh", "C3eh", "C2eh", "C1eh", "X4eh", "X3eh", "X2eh", "X1eh", "P6r", "P5r", "P4r", "P3r", "P2r", "P1r", "N6r", "N5r", "N4r", "N3r", "N2r", "N1r", "C6r", "C5r", "C4r", "C3r", "C2r", "C1r", "X4r", "X3r", "X2r", "X1r", "P6dr", "P5dr", "P4dr", "P3dr", "P2dr", "P1dr", "N6dr", "N5dr", "N4dr", "N3dr", "N2dr", "N1dr", "P6ar", "P5ar", "P4ar", "P3ar", "P2ar", "P1ar", "N6ar", "N5ar", "N4ar", "N3ar", "N2ar", "N1ar", "C6vr", "C5vr", "C4vr", "C3vr", "C2vr", "C1vr", "X4vr", "X3vr", "X2vr", "X1vr", "C6er", "C5er", "C4er", "C3er", "C2er", "C1er", "X4er", "X3er", "X2er", "X1er", "SP6", "SP5", "SP4", "SP3", "SP2", "SP1", "SN6", "SN5", "SN4", "SN3", "SN2", "SN1", "SC6", "SC5", "SC4", "SC3", "SC2", "SC1", "SX4", "SX3", "SX2", "SX1", "SP6d", "SP5d", "SP4d", "SP3d", "SP2d", "SP1d", "SN6d", "SN5d", "SN4d", "SN3d", "SN2d", "SN1d", "SP6a", "SP5a", "SP4a", "SP3a", "SP2a", "SP1a", "SN6a", "SN5a", "SN4a", "SN3a", "SN2a", "SN1a", "SC6v", "SC5v", "SC4v", "SC3v", "SC2v", "SC1v", "SX4v", "SX3v", "SX2v", "SX1v", "SC6e", "SC5e", "SC4e", "SC3e", "SC2e", "SC1e", "SX4e", "SX3e", "SX2e", "SX1e", "SD ", "SQ5", "SQ4", "SQ3", "SQ2", "SQ1", "SQ5p", "SQ4p", "SQ3p", "SQ2p", "SQ1p", "SQ5n", "SQ4n", "SQ3n", "SQ2n", "SQ1n", "SP6q", "SP5q", "SP4q", "SP3q", "SP2q", "SP1q", "SN6q", "SN5q", "SN4q", "SN3q", "SN2q", "SN1q", "SC6q", "SC5q", "SC4q", "SC3q", "SC2q", "SC1q", "SX4q", "SX3q", "SX2q", "SX1q", "SP6dq", "SP5dq", "SP4dq", "SP3dq", "SP2dq", "SP1dq", "SN6dq", "SN5dq", "SN4dq", "SN3dq", "SN2dq", "SN1dq", "SP6aq", "SP5aq", "SP4aq", "SP3aq", "SP2aq", "SP1aq", "SN6aq", "SN5aq", "SN4aq", "SN3aq", "SN2aq", "SN1aq", "SC6vq", "SC5vq", "SC4vq", "SC3vq", "SC2vq", "SC1vq", "SX4vq", "SX3vq", "SX2vq", "SX1vq", "SC6eq", "SC5eq", "SC4eq", "SC3eq", "SC2eq", "SC1eq", "SX4eq", "SX3eq", "SX2eq", "SX1eq", "SP6h", "SP5h", "SP4h", "SP3h", "SP2h", "SP1h", "SN6h", "SN5h", "SN4h", "SN3h", "SN2h", "SN1h", "SC6h", "SC5h", "SC4h", "SC3h", "SC2h", "SC1h", "SX4h", "SX3h", "SX2h", "SX1h", "SP6dh", "SP5dh", "SP4dh", "SP3dh", "SP2dh", "SP1dh", "SN6dh", "SN5dh", "SN4dh", "SN3dh", "SN2dh", "SN1dh", "SP6ah", "SP5ah", "SP4ah", "SP3ah", "SP2ah", "SP1ah", "SN6ah", "SN5ah", "SN4ah", "SN3ah", "SN2ah", "SN1ah", "SC6vh", "SC5vh", "SC4vh", "SC3vh", "SC2vh", "SC1vh", "SX4vh", "SX3vh", "SX2vh", "SX1vh", "SC6eh", "SC5eh", "SC4eh", "SC3eh", "SC2eh", "SC1eh", "SX4eh", "SX3eh", "SX2eh", "SX1eh", "SP6r", "SP5r", "SP4r", "SP3r", "SP2r", "SP1r", "SN6r", "SN5r", "SN4r", "SN3r", "SN2r", "SN1r", "SC6r", "SC5r", "SC4r", "SC3r", "SC2r", "SC1r", "SX4r", "SX3r", "SX2r", "SX1r", "SP6dr", "SP5dr", "SP4dr", "SP3dr", "SP2dr", "SP1dr", "SN6dr", "SN5dr", "SN4dr", "SN3dr", "SN2dr", "SN1dr", "SP6ar", "SP5ar", "SP4ar", "SP3ar", "SP2ar", "SP1ar", "SN6ar", "SN5ar", "SN4ar", "SN3ar", "SN2ar", "SN1ar", "SC6vr", "SC5vr", "SC4vr", "SC3vr", "SC2vr", "SC1vr", "SX4vr", "SX3vr", "SX2vr", "SX1vr", "SC6er", "SC5er", "SC4er", "SC3er", "SC2er", "SC1er", "SX4er", "SX3er", "SX2er", "SX1er", "TP6", "TP5", "TP4", "TP3", "TP2", "TP1", "TN6", "TN5", "TN4", "TN3", "TN2", "TN1", "TC6", "TC5", "TC4", "TC3", "TC2", "TC1", "TX4", "TX3", "TX2", "TX1", "TP6d", "TP5d", "TP4d", "TP3d", "TP2d", "TP1d", "TN6d", "TN5d", "TN4d", "TN3d", "TN2d", "TN1d", "TP6a", "TP5a", "TP4a", "TP3a", "TP2a", "TP1a", "TN6a", "TN5a", "TN4a", "TN3a", "TN2a", "TN1a", "TC6v", "TC5v", "TC4v", "TC3v", "TC2v", "TC1v", "TX4v", "TX3v", "TX2v", "TX1v", "TC6e", "TC5e", "TC4e", "TC3e", "TC2e", "TC1e", "TX4e", "TX3e", "TX2e", "TX1e", "TD ", "TQ5", "TQ4", "TQ3", "TQ2", "TQ1", "TQ5p", "TQ4p", "TQ3p", "TQ2p", "TQ1p", "TQ5n", "TQ4n", "TQ3n", "TQ2n", "TQ1n", "TP6q", "TP5q", "TP4q", "TP3q", "TP2q", "TP1q", "TN6q", "TN5q", "TN4q", "TN3q", "TN2q", "TN1q", "TC6q", "TC5q", "TC4q", "TC3q", "TC2q", "TC1q", "TX4q", "TX3q", "TX2q", "TX1q", "TP6dq", "TP5dq", "TP4dq", "TP3dq", "TP2dq", "TP1dq", "TN6dq", "TN5dq", "TN4dq", "TN3dq", "TN2dq", "TN1dq", "TP6aq", "TP5aq", "TP4aq", "TP3aq", "TP2aq", "TP1aq", "TN6aq", "TN5aq", "TN4aq", "TN3aq", "TN2aq", "TN1aq", "TC6vq", "TC5vq", "TC4vq", "TC3vq", "TC2vq", "TC1vq", "TX4vq", "TX3vq", "TX2vq", "TX1vq", "TC6eq", "TC5eq", "TC4eq", "TC3eq", "TC2eq", "TC1eq", "TX4eq", "TX3eq", "TX2eq", "TX1eq", "TP6h", "TP5h", "TP4h", "TP3h", "TP2h", "TP1h", "TN6h", "TN5h", "TN4h", "TN3h", "TN2h", "TN1h", "TC6h", "TC5h", "TC4h", "TC3h", "TC2h", "TC1h", "TX4h", "TX3h", "TX2h", "TX1h", "TP6dh", "TP5dh", "TP4dh", "TP3dh", "TP2dh", "TP1dh", "TN6dh", "TN5dh", "TN4dh", "TN3dh", "TN2dh", "TN1dh", "TP6ah", "TP5ah", "TP4ah", "TP3ah", "TP2ah", "TP1ah", "TN6ah", "TN5ah", "TN4ah", "TN3ah", "TN2ah", "TN1ah", "TC6vh", "TC5vh", "TC4vh", "TC3vh", "TC2vh", "TC1vh", "TX4vh", "TX3vh", "TX2vh", "TX1vh", "TC6eh", "TC5eh", "TC4eh", "TC3eh", "TC2eh", "TC1eh", "TX4eh", "TX3eh", "TX2eh", "TX1eh", "TP6r", "TP5r", "TP4r", "TP3r", "TP2r", "TP1r", "TN6r", "TN5r", "TN4r", "TN3r", "TN2r", "TN1r", "TC6r", "TC5r", "TC4r", "TC3r", "TC2r", "TC1r", "TX4r", "TX3r", "TX2r", "TX1r", "TP6dr", "TP5dr", "TP4dr", "TP3dr", "TP2dr", "TP1dr", "TN6dr", "TN5dr", "TN4dr", "TN3dr", "TN2dr", "TN1dr", "TP6ar", "TP5ar", "TP4ar", "TP3ar", "TP2ar", "TP1ar", "TN6ar", "TN5ar", "TN4ar", "TN3ar", "TN2ar", "TN1ar", "TC6vr", "TC5vr", "TC4vr", "TC3vr", "TC2vr", "TC1vr", "TX4vr", "TX3vr", "TX2vr", "TX1vr", "TC6er", "TC5er", "TC4er", "TC3er", "TC2er", "TC1er", "TX4er", "TX3er", "TX2er", "TX1er",
    "W ", "SW", "TW", "U"
]


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
            b1: "",
            b2: "",
        }
    }

    componentDidUpdate(prevProps: Readonly<props>, prevState: Readonly<state>, snapshot?: any): void {
        //console.log(this.props, this.state)
    }

    ApplyFix = () => {
        const splititp = this.props.itp.split("[ bonds ]")
        let itpSTART = splititp[0] + "[ bonds ]\n"

        const itp = ItpFile.readFromString(this.props.itp)

        for (const fix of this.props.fixing_error) {
            if (fix["change_bead_1"]) {
                let line_to_change = itp.getField('atoms')[fix["start"]]
                console.log("line_to_change", line_to_change)
                let new_line_in_list = line_to_change.split(" ").filter(splitElmt => splitElmt !== '')
                new_line_in_list[1] = fix["change_bead_1"]
                console.log("new line ", new_line_in_list.join("\t"))
                itpSTART.replace(line_to_change, new_line_in_list.join("\t"))

            }

            if (fix["change_bead_2"]) {
                const itp = ItpFile.readFromString(this.props.itp)
                console.log(itp.getField('atoms')[fix["end"]])
            }

            itpSTART = itpSTART + `${fix["start"]} ${fix["end"]} 1 ${fix["distance"]} ${fix["force"]}\n`
        }
        const itpFIX = itpSTART + splititp[1]

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

    handlechangebead1 = (a: string) => {
        let copy = this.props.fixing_error
        copy[this.state.numeroLink]["change_bead_1"] = a
        this.props.update_error(copy)
        console.log("change bead 1", this.state.numeroLink, a)
    }
    handlechangebead2 = (a: string) => {
        let copy = this.props.fixing_error
        copy[this.state.numeroLink]["change_bead_2"] = a
        this.props.update_error(copy)
        console.log("change bead 2", this.state.numeroLink, a)
    }

    handleforce = (f: string) => {
        let copy = this.props.fixing_error
        copy[this.state.numeroLink]["force"] = f
        this.props.update_error(copy)
        //console.log(this.props.fixing_error)
    }


    render() {


        this.props.is_fixed(this.state.numeroLink)
        return (
            <Dialog open={true}  >
                <DialogTitle>Fixing of bonds not handled by polyply</DialogTitle>
                <DialogContent>

                    <Marger size={'2'}></Marger>
                    <FormControl>
                        <Grid container component="main"  >

                            <Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }}>

                                <Typography variant='h6'> Residue {this.props.fixing_error[this.state.numeroLink]['startresname']}  #{this.props.fixing_error[this.state.numeroLink]['startchoice'][0]['idres']} </Typography>

                                <RadioGroup
                                    aria-labelledby="demo-radio-buttons-group-label"
                                    value={this.props.fixing_error[this.state.numeroLink]["start"]}
                                    name="radio-buttons-group"
                                    onChange={(e) => { this.handlechangeBead((e.target as HTMLInputElement).value, "start") }}
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
                            <Grid item xs={2}  >  </Grid>

                            <Grid item xs={5} style={{ textAlign: 'right', alignItems: 'right', justifyContent: 'center', }}>

                                <Typography variant='h6'> Residue {this.props.fixing_error[this.state.numeroLink]['endresname']}  #{this.props.fixing_error[this.state.numeroLink]['endchoice'][0]['idres']} </Typography>
                                <RadioGroup
                                    aria-labelledby="demo-radio-buttons-group-label"
                                    value={this.props.fixing_error[this.state.numeroLink]["end"]}
                                    name="radio-buttons-group"
                                    onChange={(e) => { this.handlechangeBead((e.target as HTMLInputElement).value, "end") }}
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

                            <Marger size="1rem" />

                            <Grid item xs={2} style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center', }} >
                                <Typography variant='body1'>
                                    Modify bead type:
                                </Typography>
                            </Grid>

                            <Grid item xs={1}>
                            </Grid>

                            <Grid item xs={2} style={{ textAlign: 'right', alignItems: 'center', justifyContent: 'center', }}>


                                <FormControl fullWidth>
                                    <InputLabel id="demo-simple-select-autowidth-label">Bead #1</InputLabel>
                                    <Select
                                        label="New bead"
                                        variant="standard"
                                        //values={beadslist.map(e => ({ id: e, name: e }))}
                                        onChange={(event: any) => { console.log(event); this.handlechangebead1(event.target.value) }}
                                        autoWidth
                                        value={this.props.fixing_error[this.state.numeroLink]["change_bead_1"] ? this.props.fixing_error[this.state.numeroLink]["change_bead_1"] : ""}
                                    >
                                        {beadslist.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                                    </Select>

                                </FormControl>
                            </Grid>

                            <Grid item xs={2}></Grid>



                            <Grid item xs={2} style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center', }}>
                                <Typography variant='body1'>
                                    Modify bead type:
                                </Typography>
                            </Grid>

                            <Grid item xs={1}>
                            </Grid>

                            <Grid item xs={2} style={{ textAlign: 'left', alignItems: 'right', justifyContent: 'center', }}>

                                <FormControl fullWidth >
                                    <InputLabel id="demo-simple-select-autowidth-label">Bead #2</InputLabel>
                                    <Select
                                        label="New bead"
                                        variant="standard"
                                        //values={beadslist.map(e => ({ id: e, name: e }))}
                                        onChange={(event: any) => { console.log(event); this.handlechangebead2(event.target.value) }}
                                        autoWidth
                                        value={this.props.fixing_error[this.state.numeroLink]["change_bead_2"] ? this.props.fixing_error[this.state.numeroLink]["change_bead_2"] : ""}
                                    >
                                        {beadslist.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Marger size="2rem" />


                            <Grid item xs={5} style={{ textAlign: 'right', alignItems: 'right', justifyContent: 'center', }}>
                                <TextField
                                    id="outlined-number"
                                    label="distance"
                                    type="number"
                                    inputProps={{ step: "0.1" }}
                                    defaultValue="0.336"
                                    onChange={v => { this.handleforce(v.target.value) }}
                                />
                            </Grid>

                            <Grid item xs={2} ></Grid>

                            <Grid item xs={5} style={{ textAlign: 'right', alignItems: 'right', justifyContent: 'center', }}>
                                <TextField

                                    id="outlined-number"
                                    label="force"
                                    type="number"
                                    inputProps={{ step: "100" }}
                                    defaultValue="1200"
                                    onChange={v => { this.handleforce(v.target.value) }}
                                />
                            </Grid>

                            <Marger size="1rem" />
                            {(this.props.fixing_error.filter((bordel) =>
                                ((bordel['startresname'] === this.props.fixing_error[this.state.numeroLink]['startresname']) && bordel['endresname'] === this.props.fixing_error[this.state.numeroLink]['endresname'])).length > 1) &&
                                <>
                                    <Grid item xs={2}></Grid>
                                    <Grid item xs={6} >
                                        <Typography>Would you apply this fix to every residue {this.props.fixing_error[this.state.numeroLink]['startresname']} and residue {this.props.fixing_error[this.state.numeroLink]['endresname']}</Typography>
                                    </Grid>

                                    <Grid item xs={2}>
                                        <Button
                                            variant="contained"
                                            onClick={() => {
                                                let copy = this.props.fixing_error

                                                let startbead = this.props.fixing_error[this.state.numeroLink]["startchoice"].filter((b: { idbead: any; }) => b.idbead === this.props.fixing_error[this.state.numeroLink]['start'])[0]["bead"]


                                                let endbead = this.props.fixing_error[this.state.numeroLink]["endchoice"].filter((b: { idbead: any; }) => b.idbead === this.props.fixing_error[this.state.numeroLink]['end'])[0]["bead"]


                                                for (let i in copy) {

                                                    if ((copy[parseInt(i)]['startresname'] === this.props.fixing_error[this.state.numeroLink]['startresname']) && (copy[parseInt(i)]['endresname'] === this.props.fixing_error[this.state.numeroLink]['endresname'])) {
                                                        {
                                                            //Need to find the position inside startchoice
                                                            //console.log(copy[parseInt(i)]["startchoice"].filter((b: { [x: string]: any; }) => b["bead"] === startbead)[0]["idbead"])

                                                            copy[parseInt(i)]["start"] = copy[parseInt(i)]["startchoice"].filter((b: { [x: string]: any; }) => b["bead"] === startbead)[0]["idbead"]


                                                            copy[parseInt(i)]["end"] = copy[parseInt(i)]["endchoice"].filter((b: { [x: string]: any; }) => b["bead"] === endbead)[0]["idbead"]

                                                            copy[parseInt(i)]["distance"] = this.props.fixing_error[this.state.numeroLink]["distance"]
                                                            copy[parseInt(i)]["force"] = this.props.fixing_error[this.state.numeroLink]["force"]
                                                            copy[parseInt(i)]["is_fixed"] = true
                                                            copy[parseInt(i)]["change_bead_1"] = this.props.fixing_error[this.state.numeroLink]["change_bead_1"]
                                                            copy[parseInt(i)]["change_bead_2"] = this.props.fixing_error[this.state.numeroLink]["change_bead_2"]

                                                            this.props.is_fixed(parseInt(i))
                                                        }
                                                    }
                                                     
                                                }
                                                this.props.update_error(copy)
                                            }}
                                        >Apply
                                        </Button>
                                    </Grid>
                                </>
                            }
                        </Grid>


                    </FormControl>


                </DialogContent>

                <DialogActions>
                    {this.state.numeroLink ? (<>
                        <div>
                            <Button onClick={() => { this.setState({ numeroLink: this.state.numeroLink - 1 }) }}>Previous Link</Button>
                        </div>
                    </>) : (<></>)}

                    <Button color='warning' onClick={() => { this.props.close() }}>Close</Button>

                    {((this.state.numeroLink + 1) !== this.props.fixing_error.length) &&
                        <Button onClick={() => { this.setState({ numeroLink: this.state.numeroLink + 1 }) }}>Next Link</Button>
                    }

                    {(this.props.fixing_error.map((e: any) => { return e.is_fixed }).includes(false)) ?
                        <>  </> :
                        <Button color='success' onClick={() => { this.ApplyFix() }}>SUBMIT</Button>
                    }

                </DialogActions>
            </Dialog >
        );
    }
}

