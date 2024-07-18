import * as React from 'react';
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';
import UndoIcon from '@mui/icons-material/Undo';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';

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
        > 
            Cancel <UndoIcon/> 
        </Button>
        <Button color="success"
            disabled= { props.enabling() }
            onClick={ ()=> props.onSubmit()}
        >
            Submit <PowerSettingsNewIcon/>
        </Button>
    </ButtonGroup>
  );
}