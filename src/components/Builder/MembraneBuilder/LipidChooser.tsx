import React from 'react';
import { withStyles, Typography, Button, TextField, IconButton, CircularProgress, FormControlLabel, Checkbox } from '@material-ui/core';
import { toast } from '../../Toaster';
import { Marger, FaIcon } from '../../../helpers';
import ApiHelper from '../../../ApiHelper';
import { SimpleSelect } from '../../../Shared';

export interface ChoosenLipid {
  name: string;
  ratio: number;
}

interface LipidWithId {
  id: number;
  value: string;
  count: string;
}

interface LCProps {
  classes: Record<string, string>;
  onLipidChoose(lipids: { lower: ChoosenLipid[], upper?: ChoosenLipid[] }): any;
  onPrevious(): any;
}

interface LCState {
  lower: LipidWithId[];
  upper: LipidWithId[];
  upper_separated: boolean;
  available_lipids: string[];
}

class LipidChooser extends React.Component<LCProps, LCState> {
  state: LCState = {
    lower: [],
    upper: [],
    upper_separated: false,
    available_lipids: [],
  };

  async componentDidMount() {
    try {
      const lipids: string[] = await ApiHelper.request('settings/lipids');
      this.setState({ available_lipids: lipids });
    } catch (e) {
      toast("Unable to fetch available lipids.", "error");
    }
  }

  next = () => {
    const { lower, upper_separated } = this.state;
    const upper = upper_separated ? this.state.upper : [];

    // Check if a lipid has invalid ratio
    for (const lipid of [...lower, ...upper]) {
      const n_count = Number(lipid.count);

      if (!n_count || n_count < 0 || lipid.count.indexOf('.') !== -1) {
        toast("One lipid has invalid ratio.", "error");
        return;
      }
    }

    if (lower.length) {
      this.props.onLipidChoose({
        lower: lower.map(e => ({ name: e.value, ratio: Number(e.count) })), 
        upper: upper.length ? upper.map(e => ({ name: e.value, ratio: Number(e.count) })) : undefined,
      });
    }
    else {
      toast("At least one lipid is required.", "error");
    }
  };

  onLipidAdd = () => {
    const lower = this.state.lower;

    this.setState({
      lower: [
        ...lower, 
        { id: Math.random(), value: this.state.available_lipids[0], count: '1' }
      ]
    });
  };

  onLipidDelete = (id: number) => {
    this.setState({
      lower: this.state.lower.filter(e => e.id !== id),
    });
  };

  onLipidChange = (id: number, value: string, count: string) => {
    let lower = this.state.lower;
    const concerned = lower.findIndex(e => e.id === id);

    if (concerned !== -1) {
      lower = [...lower];
      lower[concerned] = { id, value, count };
    }

    this.setState({
      lower
    });
  };

  onUpperLipidAdd = () => {
    const upper = this.state.upper;

    this.setState({
      upper: [
        ...upper, 
        { id: Math.random(), value: this.state.available_lipids[0], count: '1' }
      ]
    });
  };

  onUpperLipidDelete = (id: number) => {
    this.setState({
      upper: this.state.upper.filter(e => e.id !== id),
    });
  };

  onUpperLipidChange = (id: number, value: string, count: string) => {
    let upper = this.state.upper;
    const concerned = upper.findIndex(e => e.id === id);

    if (concerned !== -1) {
      upper = [...upper];
      upper[concerned] = { id, value, count };
    }

    this.setState({
      upper
    });
  };

  onSeparateChange = (checked: boolean) => {
    if (checked && this.state.upper.length === 0) {
      this.setState({
        upper: this.state.lower.map(e => ({ ...e, id: Math.random() }))
      });
    }

    this.setState({ 
      upper_separated: checked
    });
  };

  get can_continue() {
    if (this.state.upper_separated)
      return this.state.lower.length > 0 && this.state.upper.length > 0;
    return this.state.lower.length > 0;
  }

  renderLoadingLipids() {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
        <CircularProgress size={64} />
      </div>
    );
  }

  render() {
    if (this.state.available_lipids.length === 0) {
      return this.renderLoadingLipids();
    }

    return (
      <React.Fragment>
        <Marger size="1rem" />

        <Typography align="center" variant="h6">
          {!this.state.upper_separated ? "Lipids" : "Lower membrane leaflet"}
        </Typography>

        <LipidSelectGroup 
          lipids={this.state.available_lipids}
          items={this.state.lower}
          onItemAdd={this.onLipidAdd}
          onItemChange={this.onLipidChange}
          onItemDelete={this.onLipidDelete}
        />

        <Marger size="1rem" />

        {this.state.upper_separated && <React.Fragment>
          <Typography align="center" variant="h6">
            Upper membrane leaflet
          </Typography>
          
          <LipidSelectGroup 
            lipids={this.state.available_lipids}
            items={this.state.upper}
            onItemAdd={this.onUpperLipidAdd}
            onItemChange={this.onUpperLipidChange}
            onItemDelete={this.onUpperLipidDelete}
          />

          <Marger size="1rem" />
        </React.Fragment>}

        <div>
          <FormControlLabel
            control={
              <Checkbox 
                checked={this.state.upper_separated} 
                onChange={evt => this.onSeparateChange(evt.target.checked)} 
                color="secondary"
              />
            }
            label="Separate lower and upper leaflet"
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="outlined" color="secondary" onClick={this.props.onPrevious}>
            Back
          </Button>

          <Button variant="outlined" color="primary" disabled={!this.can_continue} onClick={this.next}>
            Next
          </Button>
        </div>
      </React.Fragment>
    );
  }
}

export default withStyles(theme => ({

}))(LipidChooser);


function LipidSelectGroup(props: {
  lipids: string[],
  onItemAdd(): any,
  onItemDelete(id: number): any,
  onItemChange(id: number, value: string, count: string): any;
  items: { id: number, value: string, count: string }[],
}) {
  return (
    <React.Fragment>
      {props.items.map(item => (
        <div>
          <LipidSelect 
            id={item.id}
            value={item.value}
            count={item.count}
            onChange={(value, count) => props.onItemChange(item.id, value, count)}
            onDelete={() => props.onItemDelete(item.id)}
            lipids={props.lipids}
          />
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Button color="primary" onClick={props.onItemAdd}>
          <FaIcon plus /> 
          <span style={{ marginLeft: '.7rem' }}>
            Add lipid
          </span>
        </Button>
      </div>
    </React.Fragment>
  );
}

function LipidSelect(props: {
  id: number,
  lipids: string[],
  onChange(value: string, count: string): any;
  onDelete(): any;
  value: string;
  count: string;
}) {
  let error = "";
  let n_count = Number(props.count);
  if (!n_count || n_count < 0 || props.count.indexOf('.') !== -1) {
    error = "Invalid number";
  }

  return (
    <React.Fragment>
      <SimpleSelect 
        label="Lipid"
        variant="standard"
        id={String(props.id)}
        values={props.lipids.map(e => ({ id: e, name: e }))}
        value={props.value}
        onChange={val => props.onChange(val, props.count)}
        noMinWidth
      />

      <TextField 
        value={props.count}
        onChange={evt => props.onChange(props.value, evt.target.value)}
        type="number"
        label="Presence ratio"
        error={!!error}
        helperText={error ? error : undefined}
      />

      <IconButton onClick={props.onDelete}>
        <FaIcon trash />
      </IconButton>
    </React.Fragment>
  );
}
