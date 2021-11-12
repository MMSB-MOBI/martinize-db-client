import React from 'react';
import { Marger } from '../../../helpers';
import { Typography, Button, Divider } from '@material-ui/core';

export interface LoadPdbProps {
  onFileSelect(file: File): any;
  error?: any;
}

export default function LoadPdb(props: LoadPdbProps) {
  const input_ref = React.useRef<HTMLInputElement>(null);

  function loadFile(evt: React.ChangeEvent<HTMLInputElement>) {
    if (evt.target.files?.[0]) {
      props.onFileSelect(evt.target.files[0]);
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <Marger size="2rem" />

      {props.error && <Typography variant="body1" color="error">
        Your file seems invalid: {" "}
        {props.error}
      </Typography>}

      <Typography>
        Please load your all atom PDB here to start.
      </Typography>

      <Marger size="1rem" />

      <Typography variant="body2">
        Here, you can transform a all atom molecule, stored in a PDB file format, in a coarse-grained file.
        You will have access to a generated PDB, with required ITP and TOP files in order to use the it in GROMACS.
      </Typography>

      <Marger size="2rem" />

      <div style={{ textAlign: 'center' }}>
        <Button variant="outlined" color="primary" onClick={() => { input_ref.current!.click(); }}>
          Load all atom PDB
        </Button>
        <input ref={input_ref} type="file" style={{ display: 'none' }} onChange={loadFile} />
      </div>

      <Marger size="2rem" />

      <Divider />

    </div>
  );
}
