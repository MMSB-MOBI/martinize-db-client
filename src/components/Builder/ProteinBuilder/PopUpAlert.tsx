import React from 'react';
import { Alert } from '@material-ui/lab'
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@material-ui/core'
import { useAsync } from "react-async"

interface PopUpAlertProps {
    buttonText:string; 
    contentTitle: string; 
    contentFile:File; 
}

export default function PopUpAlert(props: PopUpAlertProps) {
    const [fileStr, setFileStr] = React.useState("")
    const [openDialog, setOpenDialog] = React.useState(false)

    const loadFile = () => {
        props.contentFile.text().then(contentStr => {
            console.log(contentStr.split("\n"))
            setFileStr(contentStr);
            setOpenDialog(true); 
        }).catch(err => {
            setFileStr("Warnings are unavailable, impossible to parse")
            setOpenDialog(true)
        })
        
    }

    return (
        <React.Fragment>
            <Alert severity="warning" action={
            <Button 
            size="medium"
            color="inherit" 
            onClick={() => loadFile()}
            >
            {props.buttonText}
            </Button>
        }>
        </Alert>
        <Dialog
            open={openDialog}
            fullWidth={true}
            maxWidth="lg"
            >
            <DialogTitle>{props.contentTitle}</DialogTitle>
            <DialogContent>
            {fileStr.split("\n").map((line:string) => <DialogContentText>{line}</DialogContentText>)}
            </DialogContent>
            <DialogActions>
            <Button onClick={() => setOpenDialog(false)} color="primary">
                Close
            </Button>
            </DialogActions>
        </Dialog>
    </React.Fragment>
    
    )

}