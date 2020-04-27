import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogContentText, TextField, DialogActions, Button } from '@material-ui/core';

export default function MoleculeSaverModal(props: { 
  defaultName: string,
  open: boolean, 
  onConfirm: (name: string) => void, 
  onClose: () => void, 
}) {
  const [name, setName] = React.useState(props.defaultName);

  React.useEffect(() => {
    setName(props.defaultName);
  }, [props.defaultName]);

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>
        Save this molecule
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          You're about to save your molecule.
          Please specify a save name.
        </DialogContentText>
       
        <form onSubmit={e => { e.preventDefault(); props.onConfirm(name); }}>
          <TextField
            value={name}
            onChange={e => setName(e.target.value)}
            variant="outlined"
            style={{ width: '100%' }}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose} color="secondary">
          Cancel
        </Button>

        <Button onClick={() => props.onConfirm(name)} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
