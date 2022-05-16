import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';


interface propsalert {
    message: string,
    close: () => void;
}

export default class Warning extends React.Component<propsalert> {
    show = () => {
        let show: boolean
        this.props.message ? show = true : show = false;
        if (this.props.message) {
            return <Dialog
                open={show}
                keepMounted
                onClose={() => { this.props.close() }}
                aria-describedby="alert-dialog-slide-description" >
                <DialogTitle>{"Warning ! "}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-slide-description">
                        {this.props.message}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { this.props.close() }}>Ok Sir, I will fix my mistake !</Button>
                </DialogActions>
            </Dialog>
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