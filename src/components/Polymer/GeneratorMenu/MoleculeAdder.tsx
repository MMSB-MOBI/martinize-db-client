import * as React from 'react';
import { Box, Button, Grid, Input, TextField } from '@material-ui/core';
import SendIcon from '@mui/icons-material/Send';
import Stack from '@mui/material/Stack';
import { InputAdornment, Typography, MenuItem } from '@mui/material';
import { TooltipedSelect } from "../../../ShareTT";
import AddIcon from '@mui/icons-material/Add';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';

import AdsClickIcon from '@mui/icons-material/AdsClick';
import DesignServicesIcon from '@mui/icons-material/DesignServices';

import { styled, createTheme, ThemeProvider } from '@mui/material/styles';

import TimelineOppositeContent, {
    timelineOppositeContentClasses,
  } from '@mui/lab/TimelineOppositeContent';

import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';

import { lightGreen } from '@mui/material/colors';


type moleculeDatum = {id:string, name:string, url:string};
interface MAProps {
    molecules: Record<string, [string, string]>;    
    type:"injector" | "attacher";
    onAddClick:(molecule:string, count:number, target:string|undefined)=>void;
    targetLister?:()=>void;
    disabled?:boolean;
};
interface MAState {
    molCount:number;
    molecule?:moleculeDatum;
    molAsStr:string;
    showAdvanced:boolean
}


const customTheme = createTheme({
    palette: {
      primary: {
        main: lightGreen[500],
      },
    },
  });
  
  const StyledTimelineDot = styled(TimelineDot)`
    ${({ theme }) => `
    cursor: pointer;
    background-color: "lightgreen";
    transition: ${theme.transitions.create(['background-color', 'transform'], {
      duration: theme.transitions.duration.standard,
    })};
    &:hover {
      background-color: "lightgreen";
      transform: scale(1.3);
    }
    `}
  `;

  const StyledAddButton = styled(Button)`
  ${({ theme }) => `
  transition: ${theme.transitions.create(['background-color', 'transform'], {
    duration: theme.transitions.duration.standard,
  })};
  &:hover {
    transform: scale(1.1);
  }
  `}
`;


export default function MoleculeAdder(props:MAProps) {
    const [state, setState] =  React.useState({ molCount: 0, molecule: undefined, molAsStr:"", showAdvanced:false} as MAState); // {id:string, name:string, url:string}
    const [isValid, setValid] = React.useState(false);
    const [selTarget, setTarget] = React.useState('');
    const [attachSteps, setAttachSteps ] = React.useState([false, false, false])

    const generateSelector = () => {
        return (<Box sx={{ minWidth: 120 }}>
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">Target Residue</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={selTarget}
            label="targetResidue"
            onChange={ (v) => {
                console.log("Selector of " + v.target.value);
                setTarget(v.target.value);
                setAttachSteps([ true, attachSteps[1], attachSteps[2] ]);
                }
            }
          >
            {   //@ts-ignore
                props?.targetLister().map(m=><MenuItem value={m}>{m}</MenuItem>)
               // Object.keys(props.molecules).map(m=><MenuItem value={m}>{m}</MenuItem>)
            } 
          </Select>
        </FormControl>
      </Box>
        )
    }

    const generateDesigner = (type:"injector"|"attacher") => {
        return (
            <Stack
            mt={1}
            width={'100%'}               
            direction='row'
            spacing={1}>
            <TooltipedSelect  
                required
                inputL
                label="Molecule"
                variant="outlined"
              
                //@ts-ignore
                values={ props.molecules }
                id="ff"
                key="ff"
                value={state.molAsStr}
                onChange={v => { 
                    setState({ ...state, molAsStr: v } );
                    if(type === "attacher")
                        setAttachSteps([attachSteps[0], true, attachSteps[2]]);
                    else 
                        setValid(state.molCount > 0)                     
             }}                                    
            />
            <TextField
                label="Number"
                type="number"
                InputProps={{ inputProps: { min: 0, max: 9999 } }}
                value={state.molCount}
                onChange={(v) => {
                    const cnt = parseInt(v.target.value);
                    setState({ ...state, molCount: cnt });
                    setValid(state.molAsStr !== '' && cnt > 0 )               

                    if(type === "attacher")
                        setAttachSteps([attachSteps[0], attachSteps[1], parseInt(v.target.value) > 0]);

                }}
                variant="outlined"
            />
            { (type === "injector" && isValid) &&                   
                <StyledAddButton
                style={{borderTopRightRadius: 28, borderBottomRightRadius: 28,backgroundColor:'forestgreen'}}
                onClick={ ()=>{ props.onAddClick(state.molAsStr, state.molCount, undefined)} }
                >
                <AddIcon />
                </StyledAddButton>
            }
            { (type === "injector" && !isValid) &&                   
                <Button
                disabled={true}
                style={{ borderTopRightRadius: 28, borderBottomRightRadius: 28, backgroundColor:'lightgrey' }}                
                >
                    <AddIcon />
                </Button>
            }

        </Stack>
        )
    }


    if (props.type === "injector")
    return (
        <Box sx={{ width: '100%', textAlign: "center" }}>
            <Typography                
                variant="button" align="center" color='primary'
            >
                Add a new homomultimer                
            </Typography>
            {
                generateDesigner(props.type)
            }
            

        </Box>
    )

    return (
        <>
        <Box sx={{ width: '100%', textAlign: "center" }}>
            <Typography                
                variant="button" align="center" color="primary"
            >
                Attach many homomultimers to target residue
            </Typography> 
        </Box>
        
        <Timeline
            sx={{
                [`& .${timelineOppositeContentClasses.root}`]: {
                flex: 0.2,
                },
            }}
        >
            <TimelineItem>
                <TimelineOppositeContent color="textSecondary">
                    <Typography variant="h6" component="span">
                        Select
                    </Typography>
                    <Typography>Available residue type</Typography>
                </TimelineOppositeContent>
                <TimelineSeparator>
                    <TimelineConnector sx={{minHeight:25}}/>
                        <TimelineDot
                            color={ (attachSteps[0]) ? 'success' : 'grey' }
                        ><AdsClickIcon /></TimelineDot>
                    <TimelineConnector sx={{minHeight:50}}/>
                </TimelineSeparator>
                <TimelineContent mt={3}>
                    { generateSelector() }
                </TimelineContent>
            </TimelineItem>
            <TimelineItem>
                <TimelineOppositeContent color="textSecondary">
                    <Typography variant="h6" component="span" sx={{ marginTop:-10}}>
                        Design
                    </Typography>
                    <Typography>polymer to attach</Typography>
                </TimelineOppositeContent>
                <TimelineSeparator>
                    <TimelineDot 
                        color={ (attachSteps[1] && attachSteps[2]) ? 'success' : 'grey' }
                    >
                        <DesignServicesIcon />
                    </TimelineDot>
                </TimelineSeparator>
                <TimelineContent mt={-1}>
                    {generateDesigner("attacher")}        
                </TimelineContent>
            </TimelineItem>
            <TimelineItem>
                <TimelineOppositeContent color="textSecondary">
                    <Box sx={{minWidth:62}}/>
                </TimelineOppositeContent>
                <TimelineSeparator>
                    <TimelineConnector sx={{ minHeight:30, marginTop:-7}}/>
                    { (attachSteps[0] && (attachSteps[1], attachSteps[2])) ?  
                        <StyledTimelineDot 
                            color="success" sx={{ boxShadow: 5, cursor:"grab" }}
                        >
                            <AddIcon 
                            onClick={ ()=>{ props.onAddClick(state.molAsStr, state.molCount, selTarget) } }
                            />
                        </StyledTimelineDot>
                    :
                        <TimelineDot 
                            color="grey" sx={{ boxShadow: 0, cursor:"pointer" }}
                        >
                            <AddIcon/>
                        </TimelineDot>
                    }              
                </TimelineSeparator>
                <TimelineContent></TimelineContent>
            </TimelineItem> 
        </Timeline>
    </>
   )
}


/* Mine
{ !state.showAdvanced ? (
                <Button
                    onClick={()=> setState({...state, showAdvanced : ! state.showAdvanced })}
                    endIcon={<ArrowDropDownIcon />}
                >
                Advanced
                </Button>
            ) : ( 
                <>
                <Typography>
                Attach homomultimer to monomer(s) of the following type 
                </Typography>
                <TextField
                    style={{ width: "100%" }}
                    name="cls"
                    select
                    label="Items"
                    helperText="Please select Class"
                    margin="normal"
                    variant="outlined"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="start">something</InputAdornment>
                            )
                        }}
                    >
                    <MenuItem>Item 1</MenuItem>
                    <MenuItem>Item 2</MenuItem>
                    <MenuItem>Item 3</MenuItem>
                </TextField>
                <Button
                    style={{ marginLeft: "auto" }}
                    onClick={()=> setState({...state, showAdvanced : ! state.showAdvanced })}
                    endIcon={<HighlightOffIcon />}
                >
                    Hide
                </Button>
            </>
            )
            }

*/

    /*

<Grid item xs={10} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }}>
<Typography variant="h6" align="left">
  Add repeat units or chain of repeat units
</Typography>
</Grid>
<Grid item xs={1}></Grid>

<Grid item xs={1}></Grid>

<Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >

<TooltipedSelect

  //formControlClass={this.props.classes.ff_select}
  required
  label="Molecule**"
  variant="standard"
  // values={this.GetMolFField(this.props.dataForceFieldMolecule, forcefield).map(e => ({ id: e, name: e }))}
  // @ts-ignore
  /*values={ Object.entries(this.props.dataForceFieldMolecule[this.state.forcefield]).map( (e) =>{
        return { id: e[0], name: e[1][0], url:e[1][1] } }) 
  }*/
  //@ts-ignore
  /*values = {this.props.dataForceFieldMolecule[this.state.forcefield]}
  id="ff"
  key="ff"
  value={this.state.moleculeToAdd}
  onChange={v => this.setState({ moleculeToAdd: v })} />
</Grid>

*/