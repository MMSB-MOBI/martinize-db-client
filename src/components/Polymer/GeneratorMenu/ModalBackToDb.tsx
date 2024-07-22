import * as React from 'react';
import Button from "@mui/material/Button";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';

export interface MBDProps  {
    onClickCancel:()=>void;
    onClickGoBack:()=>void;
    onClose:()=>void;
    openStatus:boolean;
}
export default function ModalBackToDb(props:MBDProps) {
    return (
      <Dialog open={props.openStatus/*!!this.state.want_go_back*/} onClose={props.onClose /*this.onWantGoBackCancel*/}> 
        <DialogTitle>
          Go back to the Explore page.
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            Your current polymer will be lost.
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button color="primary" onClick={props.onClickCancel/*this.onWantGoBackCancel*/}>Cancel</Button>
          <Button color="secondary" onClick={props.onClickGoBack/*this.onGoBack*/}>Go back</Button>
        </DialogActions>
      </Dialog>
    )
  }