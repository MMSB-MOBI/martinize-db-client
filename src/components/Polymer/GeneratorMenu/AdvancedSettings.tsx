import * as React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Button, Grid, Input } from '@material-ui/core';
import AutoFixHigh from "@mui/material/Icon/Icon";
import AddIcon from '@mui/icons-material/Add';


import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});


export default function AdvancedSettings() {
  return (
    <div>
      <Accordion 
      style={{backgroundColor:'whitesmoke'}}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel2-content"
          id="panel2-header"
          style={{backgroundColor:'white'}}
        >
          <Typography>Advanced Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
            <Grid container
            direction="row"
            spacing={1}            
            >
                <Grid item xs={6}>
                    <Typography variant="caption" >
                        Design your own itp link file:
                    </Typography>
                </Grid>
                <Grid item xs={6}>
                    <Button 
                    id="Create" variant="contained" 
                    endIcon={<AddIcon />} 
                    onClick={()=>{/*() => this.setState({ createLink: true })*/} }
                >
                        Create
                    </Button>
                </Grid>


            <Grid item xs={6}>
                <Typography variant="caption" >
                Import custom link file (.ff)
                </Typography>
            </Grid>

            <Grid item xs={6} style={{ textAlign: 'left', alignItems: 'center' }}>
              {/*  <Input
                    inputProps={{ accept: ".ff" }}
                    color="secondary"
                    onChange={(e: any) =>{ this.handleUpload(e.target.files)}}
                    type="file"
                />
                */}
                <Button
                    component="label"
                    role={undefined}
                    variant="contained"
                    tabIndex={-1}
                    endIcon={<CloudUploadIcon />}
                >
                Upload file
                <VisuallyHiddenInput 
                    type="file"
                    accept= ".ff"
                />
            </Button>
            </Grid>
            <Grid item
             xs={6} style={{ textAlign: 'left', alignItems: 'center' }}>
                <Typography variant="caption" >
                    Miscellaneous
                    (.json,.fasta;.ff)
                </Typography>
            </Grid>
            <Grid item
            xs={6} style={{ textAlign: 'left', alignItems: 'center' }}>
                 <Button
                    component="label"
                    role={undefined}
                    variant="contained"
                    tabIndex={-1}
                    endIcon={<CloudUploadIcon />}
                >
                    Upload file(s)
                    <VisuallyHiddenInput 
                    type="file"
                    accept=".ff,.itp,.json,.fasta"
                    />
                </Button>
            </Grid>
        </Grid>        
        </AccordionDetails>
      </Accordion>
    </div>
  );
}
