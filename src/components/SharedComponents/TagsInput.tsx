import React from 'react'
import { TextField, Chip, makeStyles } from "@mui/material"
import { useEffect } from "react"

interface TagsInputProps {
    label : string
    onUpdateTags: (tags: string[]) => void,
}

interface TagsInputStates {
    chips : string[]
    written_value : string; 
}


export class TagsInput extends React.Component<TagsInputProps, TagsInputStates> {
    
    state : TagsInputStates = {
        chips : [],
        written_value : ''
    }

    addChip = (key : React.KeyboardEvent) => {
        if (key.code === "Enter"){
            console.log("enter")
            console.log(this.state.written_value)
            if (!(this.state.chips.includes(this.state.written_value))){
                this.setState({chips : [...this.state.chips, this.state.written_value]})
                this.props.onUpdateTags([...this.state.chips, this.state.written_value])
            }
            this.setState({written_value : ''})

        }
    }

    deleteChip = (chip : string) => {
        this.setState({chips : this.state.chips.filter(chipElmt => chipElmt !== chip)})
    }

    render() {
        
        return(
        <TextField 
            sx={{
                "& .MuiInputBase-input": {
                    '&::placeholder' : {
                        fontSize : '12px'
                    }
                },
                '& .MuiTextField-root' : {
                    flexWrap : 'wrap'
                }
            }}
            label={this.props.label} 
            placeholder = {"Write your alias(es) and press enter to validate each"}
            value={this.state.written_value}
            InputProps = {{ startAdornment : 
                this.state.chips.map(chip => (<Chip 
                    label = {chip}
                    onDelete={() => this.deleteChip(chip)}/>))
            }}
            onKeyDown={(key) => this.addChip(key)}
            onChange={(v) => this.setState({written_value : v.target.value})}>
                
        </TextField>)
    }
}




