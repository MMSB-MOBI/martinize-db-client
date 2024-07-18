import * as React from 'react';
import { Box, Button, Grid, Input, TextField } from '@material-ui/core';
import SendIcon from '@mui/icons-material/Send';
import Stack from '@mui/material/Stack';
import { InputAdornment, Typography, IconButton } from '@mui/material';
import AddLinkIcon from '@mui/icons-material/AddLink';

export default function LinkCreator() {
    const [state, setState] = React.useState({ id1: "", id2:"" });
    const [isValid, setIsValid] = React.useState(false);
    return (
        <Box sx={{ width: '100%',  textAlign:"center" }}>
            <Typography
                variant="button" align="center"
                color="primary"               
            >
                Create a Link
            </Typography>
        <Stack 
            width={'100%'}
            mt={1}
            direction='row'
            spacing={1}
        >
    
            <TextField
                label="resid 1"
                type="number"
                InputProps={{ inputProps: { min: 0, max: 9999 } }}
                value={state.id1}
                onChange={ (e) => {
                    const id1NumStr = e.target.value;                    
                    if (state.id2 !== "0" && state.id2 !== "")
                        setIsValid(id1NumStr !== state.id2)
                    else
                        setIsValid(false)
                    setState( { ...state , id1: id1NumStr });
                } }
                variant="outlined"
            />
            <TextField
                label="resid 2"
                type="number"          
                value={state.id2}
                onChange={ (e) => {                   
                    const id2NumStr = e.target.value;
                    if (state.id1 !== "0" && state.id1 !== "")
                        setIsValid(state.id1 !== id2NumStr)
                    else
                        setIsValid(false)
                    setState( { ...state , id2: id2NumStr });

                    console.log(id2NumStr)
                }}
                variant="outlined" 
                InputProps={{inputProps: { min: 0, max: 9999 }       
            }}
            />
            <Button 
                style={ { 
                    color:  isValid ? 'black' : 'grey', backgroundColor: isValid ? "forestgreen" : "lightgrey", 
                    borderTopRightRadius: 28, borderBottomRightRadius: 28,
                    cursor: 'pointer'/* should niot be required ??*/
                    } }
                disabled={isValid}
            >
                <AddLinkIcon/>
            </Button>
        </Stack>
    </Box>
    )
}

/*

<Grid item xs={10} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >
<Typography variant="h6" >Create a new link: </Typography>
</Grid>
<Grid item xs={1}></Grid>

<Grid item xs={1}></Grid>
<Grid item xs={2} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >
<TextField
  label="resid 1"
  type="number"
  InputProps={{ inputProps: { min: 0, max: 100 } }}
  value={this.state.id1}
  onChange={v => this.setState({ id1: v.target.value })}
  variant="standard" />
</Grid>
<Grid item xs={1}></Grid>
<Grid item xs={2} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >
<TextField
  label="resid 2"
  type="number"
  InputProps={{ inputProps: { min: 0, max: 100 } }}
  value={this.state.id2}
  onChange={v => this.setState({ id2: v.target.value })}
  variant="standard" />
</Grid>
<Grid item xs={1}></Grid>
<Grid item xs={3} style={{ textAlign: 'right', alignItems: 'center', justifyContent: 'center', }} >
<Button
  id="addlink"
  variant="contained"
  onClick={() => { this.setState({ want_go_back: false }); this.CheckNewLink(this.state.id1, this.state.id2) }}>
  <Grid container component="main" style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'left', }}>

    <Grid item xs={10}>
      <Typography variant="body2" align="left">
        Create
      </Typography>
    </Grid>
    <Grid item xs={2}>
      <Badge overlap="rectangular" color="secondary" >
        <Icon className={"fas fa-" + "link"} />
      </Badge>
    </Grid>

  </Grid>
</Button>
</Grid>
<Grid item xs={2}></Grid>

*/