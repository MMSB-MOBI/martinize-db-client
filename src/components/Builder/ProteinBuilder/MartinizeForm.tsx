import React from 'react';
import { Marger } from '../../../helpers';
import MartinizeError, { MZError } from './MartinizeError';
import { Typography, Grid, Box, Button, makeStyles, TextField } from '@material-ui/core';
import { SimpleSelect } from '../../../Shared';
import Settings from '../../../Settings';

const useStyles = makeStyles(theme => ({
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  formContainer: {
    padding: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
  textField: {
    width: '100%',
  },
}));

type ElasticParam = 'builder_ef' | 'builder_el' | 'builder_eu' | 'builder_ea' | 'builder_ep' | 'builder_em';

export interface MartinizeFormProps {
  martinizeError?: MZError;
  onMartinizeBegin(e: React.FormEvent<HTMLFormElement>): any;
  builderForceField: string;
  onForceFieldChange(value: string): any;
  builderPosition: string;
  onBuilderPositionChange(value: string): any;
  builderMode: string;
  onBuilderModeChange(value: string): any;
  onReset(): any;
  builderEf: string;
  builderEl: string;
  builderEu: string;
  builderEa: string;
  builderEp: string;
  builderEm: string;
  onElasticChange(type: ElasticParam, value: string): any
}

export default function MartinizeForm(props: MartinizeFormProps) {
  const force_fields = Settings.martinize_variables.force_fields.map(e => ({ id: e, name: e }));
  const classes = useStyles();

  function getAvailableModes() {
    if (props.builderForceField.includes('martini3')) {
      return [
        { id: 'classic', name: 'Classic' }, { id: 'elastic', name: 'Elastic' }, { id: 'go', name: 'Virtual Go Sites' }
      ];
    }

    return [
      { id: 'classic', name: 'Classic' }, { id: 'elastic', name: 'Elastic' }
    ];
  }

  return (
    <div>
      <Marger size="1rem" />

      {props.martinizeError && <MartinizeError 
        error={props.martinizeError}
      />}

      <Marger size="1rem" />

      <Typography variant="h6" align="center">
        Select your coarse graining settings
      </Typography>

      <Marger size="1rem" />

      <Grid component="form" container onSubmit={props.onMartinizeBegin}>
        <Grid item sm={12}>
          <SimpleSelect 
            formControlClass={classes.form}
            label="Force field"
            values={force_fields}
            id="builder_ff"
            value={props.builderForceField}
            onChange={props.onForceFieldChange}
          />
        </Grid>

        <Marger size="1rem" />

        <Grid item sm={12}>
          <SimpleSelect 
            formControlClass={classes.form}
            label="Position restrains"
            values={[{ id: 'none', name: 'None' }, { id: 'all', name: 'All' }, { id: 'backbone', name: 'Backbone' }]}
            id="builder_position_restrains"
            value={props.builderPosition}
            onChange={props.onBuilderPositionChange}
          />
        </Grid>

        <Marger size="1rem" />

        <Grid item sm={12}>
          <SimpleSelect 
            formControlClass={classes.form}
            label="Mode"
            values={getAvailableModes()}
            id="builder_mode"
            value={props.builderMode}
            onChange={props.onBuilderModeChange}
          />
        </Grid>

        {props.builderMode === 'elastic' && <React.Fragment>
          <Grid item xs={12} sm={6} className={classes.formContainer}>
            <TextField 
              variant="outlined"
              className={classes.textField}
              label="Force constant"
              type="number"
              value={props.builderEf}
              onChange={e => props.onElasticChange('builder_ef', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} className={classes.formContainer}>
            <TextField 
              variant="outlined"
              className={classes.textField}
              label="Lower cutoff"
              type="number"
              value={props.builderEl}
              onChange={e => props.onElasticChange('builder_el', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} className={classes.formContainer}>
            <TextField 
              variant="outlined"
              className={classes.textField}
              label="Upper cutoff"
              type="number"
              value={props.builderEu}
              onChange={e => props.onElasticChange('builder_eu', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} className={classes.formContainer}>
            <TextField 
              variant="outlined"
              className={classes.textField} 
              label="Decay factor a"
              type="number"
              value={props.builderEa}
              onChange={e => props.onElasticChange('builder_ea', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} className={classes.formContainer}>
            <TextField
              variant="outlined"
              className={classes.textField}
              label="Decay power p"
              type="number"
              value={props.builderEp}
              onChange={e => props.onElasticChange('builder_ep', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} className={classes.formContainer}>
            <TextField 
              variant="outlined"
              className={classes.textField}
              label="Minimum force"
              type="number"
              value={props.builderEm}
              onChange={e => props.onElasticChange('builder_em', e.target.value)}
            />
          </Grid>
        </React.Fragment>}

        <Marger size="2rem" />

        <Box width="100%" justifyContent="space-between" display="flex">
          <Button variant="outlined" color="secondary" type="button" onClick={props.onReset}>
            Back
          </Button>

          <Button variant="outlined" color="primary" type="submit">
            Submit
          </Button>
        </Box>
      </Grid>
    </div>
  );
}
