import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Dialog from '@mui/material/Dialog';


export default function submitbox(message: string) {
    console.log(message)
    console.log("Je suis nul en internet")
    let openstate = false
    if (message !== ""){
        openstate = true
    }
    return (
        <Dialog open={ openstate}>
            <DialogTitle  >
                <Typography>
                    {message}
                </Typography>
                <LinearProgress />
            </DialogTitle>
        </Dialog>
    );
};