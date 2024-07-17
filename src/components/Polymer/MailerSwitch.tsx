import * as React from 'react';
import Alert from '@mui/material/Alert';
import CheckIcon from '@mui/icons-material/Check';
import MailOutline from '@mui/icons-material/MailOutline';
import Stack from '@mui/material/Stack';
import { Typography } from '@mui/material';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

export default function MailerSwitch() {
    return ( 
        <Alert
        iconMapping={{
            success: <MailOutline fontSize="inherit" />,
          }}
        severity="success"
        action={
        <Switch color="success"/>
         }
        >
            Send email upon completion.
        </Alert>
    )
}

/*
        <Alert variant="outlined" severity="info"
        iconMapping={{
            success: <MailOutline fontSize="inherit" />,
        }}
        >
        <FormControlLabel control={<Switch defaultChecked />} label="Send email upon completion" />
        </Alert>
        */