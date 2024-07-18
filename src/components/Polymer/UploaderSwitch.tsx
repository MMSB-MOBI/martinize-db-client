import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import Collapse from '@mui/material/Collapse';
import { ButtonGroup, Button, Grid } from '@material-ui/core';
import * as React from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

interface USProps {
    onClick: (doIupload: boolean) => void;
}

interface USStates {
    value: boolean;
}

export default function UploaderSwitch(props: USProps, states: USStates) {
    const [open, setOpen] = React.useState(true);
    const [state, setState] = React.useState({ value: false });
    return (
        <Box sx={{ width: '100%' }}>
            <Collapse 
                in={open}
                timeout={1000}
                onExited={() => {
                    console.log("Current value is " + state.value)
                    props.onClick(state.value);
                }
                }
            >
                <Alert icon={<QuestionMarkIcon fontSize="inherit" />}
                    severity="warning"
                    action={
                        <ButtonGroup variant="text" aria-label="Basic button group"
                            onClick={e => setOpen(false)}
                        >
                            <Button color="inherit" size="small" value="true"
                                onClick={e => {
                                    console.log("setting value to " + e.currentTarget.value)
                                    setState({ value: true });
                                }}
                            >
                                YES
                            </Button>
                            <Button color="inherit" size="small" value="false"
                                onClick={e => {
                                    console.log("setting value to " + e.currentTarget.value)
                                    setState({ value: false});
                                }}
                            >
                                NO
                            </Button>
                        </ButtonGroup>
                    }
                >
                    Shall I import a molecule ?
                </Alert>
            </Collapse>
        </Box>
    );
}