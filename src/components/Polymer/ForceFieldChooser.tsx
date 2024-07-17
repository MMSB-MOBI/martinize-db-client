import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';


interface FFCProps {
    onChange: (ff: string) => void;
    availableForcefield: string[];
};
interface FFCStates { };

export default function ForceFieldChooser(props: FFCProps) {
    const [ff] = React.useState('');

    const handleChange = (event: SelectChangeEvent) => {
        //setForceField(event.target.value as string);

        props.onChange(event.target.value as string);
    };

    return (
        <Box sx={{ minWidth: 120 }}>
            <FormControl fullWidth>
                <InputLabel id="ff-chooser-select-label">Choose a forcefield</InputLabel>
                <Select
                    labelId="ff-chooser-select-label"
                    id="ff-chooser"
                    value={ff}
                    label="Forcefield"
                    onChange={handleChange}
                >
                    { 
                    props.availableForcefield.map( (ff) => <MenuItem value={ff} key={ff}>{ff}</MenuItem> )
                    }
                </Select>
            </FormControl>
        </Box>
    );
}
