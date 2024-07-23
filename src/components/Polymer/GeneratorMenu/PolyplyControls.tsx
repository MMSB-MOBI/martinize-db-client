import * as React from 'react';
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';
import UndoIcon from '@mui/icons-material/Undo';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import HandymanIcon from '@mui/icons-material/Handyman';

interface PCProps {
    onUndo: ()=>void;
    onSubmit: ()=>void;   
    onError:boolean;
    onRepairClick:()=>void;
};

export default function PolyplyControls(props:PCProps) {
  return (
    <ButtonGroup
        size='large'   
        variant="contained"     
        aria-label="Disabled button group"
    >
        <Button color="warning"              
            onClick={props.onUndo}
            style={{paddingLeft:'1em', paddingRight:'1em',  paddingTop:'1em'}}
        > 
            Cancel <UndoIcon/> 
        </Button>
        {
            props.onError ? 
            <Button 
                color="error" 
                onClick={ props.onRepairClick }
            >
                Fix a bond <HandymanIcon/>
            </Button>
            :
            <Button 
                disabled 
            >
                Fix a bond <HandymanIcon/>
            </Button>
            
        }


        <Button color="info"
            style={{paddingLeft:'2em', paddingRight:'2em', paddingTop:'1em', paddingBottom:'1em'}}
            onClick={ ()=>{
                console.log("POUF")
                props.onSubmit() }
            }
        >
            Next <SkipNextIcon/>                
        </Button>

    </ButtonGroup>
  );
}