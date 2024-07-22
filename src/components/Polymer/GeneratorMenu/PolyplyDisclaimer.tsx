import * as React from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Button from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';
import AlertTitle from '@mui/material/AlertTitle';
export default function PolyplyDisclaimer() {
  const [open, setOpen] = React.useState(true);

  return (
    <Box sx={{ width: '100%' }}>
      <Collapse in={open}>
        <Alert
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                setOpen(false);
              }}
            >            
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{ mb: 2 }}
        >
            <AlertTitle>Welcome to the MAD:Polymer Editor, powered by the polyply software</AlertTitle>
            Here you will be able to:
            <ul>
                <li>Create/edit new polymers.</li>
                <li>Create /edit polymers from the polyply library</li>
                <li>Attach polymers to your martinized molecule (why not a protein)</li>
            </ul>
If your desired link between 2 molecules is missing from the Polyply library, the editor will assist you in the creation of the ad hoc link.
You may also start by providing:
<ul>
    <li>A previously saved polymer in .json format</li>
    <li>A protein sequence in.fasta format</li>
    <li>The topology of a new molecule in .itp</li>
</ul>
        </Alert>
      </Collapse>
    </Box>
  );

}