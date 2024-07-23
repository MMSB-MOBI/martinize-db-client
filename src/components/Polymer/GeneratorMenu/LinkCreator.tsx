import * as React from 'react';
import { Box, Button, FormControl, Select, InputLabel, MenuItem } from '@material-ui/core';
import SendIcon from '@mui/icons-material/Send';
import Stack from '@mui/material/Stack';
import { InputAdornment, Typography, IconButton } from '@mui/material';
import AddLinkIcon from '@mui/icons-material/AddLink';

export interface LKProps {
    values:()=>string[];
    disabled:boolean;
    onSelectItemEnter:(v:string, t:boolean)=>void;
    onSelectItemLeave:(v:string, t:boolean)=>void;
    onTgtSelect:(v:string)=>void;
    onSrcSelect:(v:string)=>void;
    onAction:(v1:string, v2:string)=>void;
}

export default function LinkCreator(props:LKProps) {
    const [state, setState] = React.useState({ id1: "", id2:"" });
    const [isValid, setIsValid] = React.useState(false);
    return (
        <Box sx={{ width: '100%',  textAlign:"center" }} padding={2}>
            <Typography
                variant="button" align="center"
                color={ props.disabled ? "lightgrey" : "primary" }
            >
                Create a new Link between existing monomers
            </Typography>
        <Stack 
            width={'100%'}
            mt={1}
            direction='row'
            spacing={1}
        >

            <FormControl fullWidth variant="outlined" >
                <InputLabel>Source</InputLabel>
                <Select
                    disabled={props.disabled}
                    style={{minWidth:'8em'}}
                    value={state.id1}
                    onChange={ (e) => {
                        console.log('id1 change');
                        console.dir(e);
                        setState({...state, id1:e.target.value as string})
                        setIsValid( state.id2 !== '')
                    }}
                    label="SourceResidue"
                >
                    { props.values().map((srcSelStr) => 
                        srcSelStr !== state.id2 ?
                        <MenuItem value={srcSelStr}
                            onMouseEnter={
                                (e)=> { 
                                    props.onSelectItemEnter(srcSelStr, true)
                                    console.log("I am In")}
                            }
                            onMouseLeave={
                                (e)=> { 
                                    props.onSelectItemLeave(srcSelStr, false)
                                    console.log("I am out")}
                            }
                            onClick={
                                ()=>props.onSrcSelect(srcSelStr)
                            }
                            >{srcSelStr}</MenuItem> : 
                        <MenuItem disabled value={srcSelStr}
                        
                        >{srcSelStr}</MenuItem>
                    ) }
                </Select>
            </FormControl>
            <FormControl fullWidth variant="outlined">
                <InputLabel>Target</InputLabel>
                <Select
                    disabled={props.disabled}
                    style={{minWidth:'8em'}}
                    value={state.id2}
                    onChange={ (e) => {
                        console.log('id2 change');
                        console.dir(e);
                        setState({...state, id2:e.target.value as string})
                        setIsValid( state.id1 !== '')
                    }}
                    label="Targetresidue"
                >
                    { props.values().map((tgtSelStr) => 
                        tgtSelStr !== state.id1 ?
                        <MenuItem value={tgtSelStr}
                            onMouseEnter={
                                (e)=> { 
                                    props.onSelectItemEnter(tgtSelStr, true)
                                    console.log("I am In")}
                            }
                            onMouseLeave={
                                (e)=> { 
                                    props.onSelectItemLeave(tgtSelStr, false)
                                    console.log("I am out")}
                            }
                            onClick={
                                ()=>props.onSrcSelect(tgtSelStr)
                            }
                            >{tgtSelStr}</MenuItem> : 
                        <MenuItem disabled value={tgtSelStr}
                        
                        >{tgtSelStr}</MenuItem>
                    ) }
                </Select>
            </FormControl>
            { isValid ? 
                <Button 
                    style={ { 
                        color:  'black' , backgroundColor: "forestgreen", 
                        borderTopRightRadius: 28, borderBottomRightRadius: 28,
                        } }
                    onClick={()=>{
                        props.onAction(state.id1, state.id2)
                    // split string return
                    }}
                  > <AddLinkIcon/> </Button> : 
                   <Button 
                    disabled
                    style={ { 
                        color:  'black' , backgroundColor: "lightgrey", 
                        borderTopRightRadius: 28, borderBottomRightRadius: 28,
                        } }                  
                  >  <AddLinkIcon/></Button>                
            }          
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