import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, Link, Divider, DialogActions, Button, Typography } from '@material-ui/core';
import { Marger, downloadBlob, dateFormatter } from '../../../helpers';

export interface MartinizeErrorProps {
  error?: MZError;
}

export interface MZError { 
  type?: string, 
  raw_run?: ArrayBuffer, 
  error: string, 
  stack: string,
}

export default function MartinizeError(props: MartinizeErrorProps) {
  const error = props.error;
  const [open, setOpen] = React.useState(false);

  if (!error) {
    return <React.Fragment />;
  }

  const close_fn = () => setOpen(false);
  const open_fn = () => setOpen(true);
  const download_fn = () => {
    const blob = new Blob([error.raw_run!]);
    downloadBlob(blob, "run_" + dateFormatter("Y-m-d_H-i-s") + ".zip")
  };

  return (
    <React.Fragment>
      {/* Dialog */}
      <Dialog open={open} onClose={close_fn} maxWidth="md">
        <DialogTitle>
          Martinize run failed :(
        </DialogTitle>

        <DialogContent>
          <DialogContentText color="secondary">
            {error.error}
          </DialogContentText>

          {error.raw_run && <DialogContentText>
            To explore more details, like intermediate files and program command line outputs, you can{" "}
            <Link href="#!" onClick={download_fn}>
              download a dump of this run
            </Link>.
          </DialogContentText>}

          <Marger size=".5rem" />

          <Divider />

          <Marger size="1rem" />

          {error.stack && <DialogContentText component="pre" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            <strong>Stack trace</strong>  
            
            <br />
            <code>
              {error.stack}
            </code>
          </DialogContentText>}
        </DialogContent>

        <DialogActions>
          <Button color="primary" onClick={close_fn}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Inline text */}
      <Typography color="error" align="center">
        Unable to proceed your molecule: {" "}
        <strong>
          Run failed
        </strong>.
        
        <br />
        <Link color="primary" href="#!" onClick={open_fn}>
          Click here to see more details
        </Link>.
      </Typography>
      
    </React.Fragment>
  );
}
