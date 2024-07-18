import * as React from 'react';
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';
import UndoIcon from '@mui/icons-material/Undo';
interface PCProps {
    enabling : ()=>boolean;
    onUndo: ()=>void;
    onSubmit: ()=>void;
};

export default function PolyplyControls(props:PCProps) {
  return (
    <ButtonGroup      
      variant="contained"     
      aria-label="Disabled button group"
    >
      <Button color="warning"
       endIcon={ <UndoIcon/> }
       onClick={props.onUndo()}
      > Cancel </Button>
      <Button color="success"
        disabled= { props.enabling() }
        onClick={props.onSubmit()}
      >Submit</Button>
    </ButtonGroup>
  );
}