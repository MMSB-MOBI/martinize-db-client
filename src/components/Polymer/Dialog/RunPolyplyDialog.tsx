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

interface props {
    show: boolean,
    send: (arg1: string, arg2: string) => void;
}

interface state {
    density: string,
    name: string,
}

export default class RunPolyplyDialog extends React.Component<props, state> {

    constructor(props: props) {
        // Required step: always call the parent class' constructor
        super(props);

        // Set the state directly. Use props if necessary.
        this.state = {
            density: "1000",
            name: "polymol",
        }
    }


    handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    }


    show = () => {
        console.log("Dialog avec polyply !!!", this.props.show)
        if (this.props.show) {
            return <Dialog
                open={this.props.show}
            >
                <DialogTitle>Send to polyply !</DialogTitle>
                <DialogContent>
                    <FormControl sx={{ m: 1, width: '25ch' }} variant="outlined"  >
                        <TextField
                            id="outlined-number"
                            label="density"
                            type="number"
                            InputLabelProps={{
                                shrink: true,
                            }}
                            value={this.state.density}
                            onChange={(e) => this.setState({ density: e.target.value })}
                        />
                    </FormControl>

                    <FormControl sx={{ m: 1, width: '25ch' }} variant="outlined">
                        <OutlinedInput
                            id="outlined-adornment-weight"
                            value={this.state.name}
                            onChange={(e) => this.setState({ name: e.target.value })}
                            endAdornment={<InputAdornment position="end">name</InputAdornment>}
                            aria-describedby="outlined-weight-helper-text"

                        />

                    </FormControl>

                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { this.props.send(this.state.density, this.state.name) }}>Submit</Button>
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

