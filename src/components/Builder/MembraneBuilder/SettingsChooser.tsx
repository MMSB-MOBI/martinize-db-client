import React from 'react';
import { withStyles, Typography, Button, TextField } from '@material-ui/core';
import { Marger } from '../../../helpers';
import { SimpleSelect } from '../../../Shared';
import { toast } from '../../Toaster';

export interface SettingsInsane {
  box_type: string;
  box_size: number[];
}

interface SCProps {
  classes: Record<string, string>;
  onSettingsChoose(settings: SettingsInsane): any;
  onPrevious(): any;
}

interface SCState {
  box_type: string;
  box_size: string;
}

const BOX_TYPES = ['hexagonal', 'rectangular', 'square', 'cubic', 'optimal', 'keep'] as const;

class SettingsChooser extends React.Component<SCProps, SCState> {
  state: SCState = {
    box_type: BOX_TYPES[0],
    box_size: '7,7,9',
  };

  next = () => {
    const { box_size, box_type } = this.state;

    if (this.box_is_error) {
      toast("Box size is invalid.", "error");
      return;
    }

    this.props.onSettingsChoose({
      box_size: box_size.split(',').map(Number),
      box_type,
    });
  };

  get can_continue() {
    return !this.box_is_error;
  }

  get box_is_error() {
    const items = this.state.box_size.split(',').map(e => !e ? NaN : Number(e));

    // test: Number is not NaN, not <= 0, not a floating point number, and dimension is 3, 6 or 9.
    return items.some(e => isNaN(e) || e <= 0 || e.toString().indexOf('.') !== -1) || ![3, 6, 9].includes(items.length);
  }

  render() {
    return (
      <React.Fragment>
        <Marger size="1rem" />

        <Typography align="center" variant="h6">
          INSANE settings
        </Typography>

        <Marger size=".5rem" />
        
        <div>
          <SimpleSelect
            label="Box type"
            variant="standard"
            id="box_select"
            values={BOX_TYPES.map(e => ({ id: e, name: e }))}
            value={this.state.box_type}
            onChange={val => this.setState({ box_type: val })}
            noMinWidth
            formControlClass={this.props.classes.ff_select}
          />
        </div>

        <Marger size="1.5rem" />

        <div>
          <TextField 
            value={this.state.box_size}
            onChange={evt => this.setState({ box_size: evt.target.value })}
            error={this.box_is_error}
            helperText="3, 6 or 9 positive integers separated by commas"
            label="Box size"
            style={{ width: '100%' }}
          />
        </div>

        <Marger size="2rem" />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="outlined" color="secondary" onClick={this.props.onPrevious}>
            Back
          </Button>

          <Button variant="outlined" color="primary" disabled={!this.can_continue} onClick={this.next}>
            Create membrane
          </Button>
        </div>
      </React.Fragment>
    );
  }
}

export default withStyles(theme => ({
  ff_select: {
    width: '100%'
  },
}))(SettingsChooser);
