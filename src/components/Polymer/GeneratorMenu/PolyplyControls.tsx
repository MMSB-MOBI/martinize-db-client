import * as React from 'react';
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';
import UndoIcon from '@mui/icons-material/Undo';
import SkipNextIcon from '@mui/icons-material/SkipNext';

interface PCProps {
    enabling : ()=>boolean;
    onUndo: ()=>void;
    onSubmit: ()=>void;
    onClick: () => void;
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
            style={{paddingLeft:'1em', paddingRight:'1em'}}
        > 
            Cancel <UndoIcon/> 
        </Button>
        <Button color="success"
            style={{paddingLeft:'2em', paddingRight:'2em', paddingTop:'1em', paddingBottom:'0.5em'}}
            disabled= { props.enabling() }
            onClick={ ()=> props.onSubmit()}
        >
            Next <SkipNextIcon/>
        </Button>
    </ButtonGroup>
  );
}