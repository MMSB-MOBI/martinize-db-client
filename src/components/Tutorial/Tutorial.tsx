import React from 'react'
import { Grid, Paper, Box } from '@mui/material'
import { styled } from '@mui/material/styles';


export default function Tutorial() {
    return(
        <Grid container spacing={2}>
            <Grid item xs={12}> Tutorial </Grid>
            <Grid item xs={12}>Summary</Grid>
            <Grid item xs={12}> Molecule Builder </Grid>
            <Grid item xs={12}> 1. Single chain protein </Grid>
            <Grid item xs={12}> 2. Protein with elastic network </Grid>
            <Grid item xs={12}> History </Grid>
            <Grid item xs={12}> System Builder </Grid>
        </Grid>
    )
}