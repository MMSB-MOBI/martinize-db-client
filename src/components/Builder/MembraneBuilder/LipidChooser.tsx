import React from 'react';
import { withStyles, Typography, Button, TextField, IconButton, CircularProgress, FormControlLabel, Checkbox, makeStyles } from '@material-ui/core';
import { toast } from '../../Toaster';
import { Marger, FaIcon } from '../../../helpers';
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
  AddLipids: boolean;
  classes: Record<string, string>;
  onLipidChoose(lipids: { lower?: ChoosenLipid[], upper?: ChoosenLipid[] }): any;
  onPrevious(): any;
  lipids: string[];
  noLipid: boolean;
  ph_upp: number;
  ph_low: number;
  phUppChange(_: any, value: number | number[]) : any;
  phLowChange(_: any, value: number | number[]) : any;
  phLipidsChange(_: any, value: number | number[]) : any;
  force_field: string; 
}

interface LCState {
  lower: LipidWithId[];
  upper: LipidWithId[];
  upper_separated: boolean;
}

class LipidChooser extends React.Component<LCProps, LCState> {
  state: LCState = {
    lower: [],
    upper: [],
    upper_separated: false,
  };

  componentDidUpdate(prev_props: LCProps) {
    // Lipids changed
    if (prev_props.lipids !== this.props.lipids && this.props.lipids.length) {
      // Remove lipids that does not exists
      const available = new Set(this.props.lipids);
      const lower = this.state.lower.filter(e => available.has(e.value));
      const upper = this.state.upper.filter(e => available.has(e.value));

      this.setState({ lower, upper });
    }
  }

  checkLipidIntegrity(lipids: LipidWithId[], layer_name: '' | 'Lower' | 'Upper') {
    const lipid_set = new Set<string>();

    for (const lipid of lipids) {
      if (lipid_set.has(lipid.value)) {
        if (layer_name) 
          toast(`${layer_name} leaflet: Lipid ${lipid.value} is set multiple times.`, "error");
        else 
          toast(`Lipid ${lipid.value} is set multiple times.`, "error");
        
        return false;
      }
      lipid_set.add(lipid.value);

      const n_count = Number(lipid.count);

      if (!n_count || n_count < 0 || lipid.count.indexOf('.') !== -1) {
        toast("One lipid has invalid ratio.", "error");
        return false;
      }
    } 

    return true;
  }

  next = () => {
    if(this.props.AddLipids){
      const { lower, upper_separated } = this.state;
      const upper = upper_separated ? this.state.upper : [];

      // Check if a lipid has invalid ratio or if one lipid is repeated
      if (!this.checkLipidIntegrity(lower, upper_separated ? 'Lower' : '') || !this.checkLipidIntegrity(upper, 'Upper')) {
        return;
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
    }
    else {
      this.props.onLipidChoose({
        lower: undefined, 
        upper: undefined,
      });
    }
    
  };

  onLipidAdd = () => {
    const lower = this.state.lower;

    this.setState({
      lower: [
        ...lower, 
        { id: Math.random(), value: this.props.lipids[0], count: '1' }
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
        { id: Math.random(), value: this.props.lipids[0], count: '1' }
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

  renderNoLipid() {
    return (
      <React.Fragment>
        <Marger size="2rem" />

        <Typography variant="h6">
          Selected molecule force field does not have any available lipid.
        </Typography>

        <Marger size="2rem" />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="outlined" color="secondary" onClick={this.props.onPrevious}>
            Back
          </Button>
        </div>
      </React.Fragment>
    );
  }

  render() {
    if (this.props.noLipid) {
      return this.renderNoLipid();
    }

    if (this.props.lipids.length === 0) {
      return this.renderLoadingLipids();
    }

    return (
      <React.Fragment>
        {this.props.AddLipids && <React.Fragment>
          <Marger size="1rem" />

          {this.state.upper_separated && <React.Fragment>
            <Typography align="center" variant="h6">
              Upper membrane leaflet lipids (force field {this.props.force_field})
            </Typography>
            
            <LipidSelectGroup 
              lipids={this.props.lipids}
              items={this.state.upper}
              onItemAdd={this.onUpperLipidAdd}
              onItemChange={this.onUpperLipidChange}
              onItemDelete={this.onUpperLipidDelete}
            />
            {/*<Typography gutterBottom>
              pH
            </Typography>
            <Slider
              value={this.props.ph_upp}
              valueLabelDisplay="auto"
              step={0.1}
              marks
              min={0.1}
              max={13.9}
              onChange={this.props.phUppChange}
              color="secondary"
            />*/}

            <Marger size="1rem" />
          </React.Fragment>}

          <Typography align="center" variant="h6">
            {!this.state.upper_separated ? `Lipids (force field ${this.props.force_field})` : `Lower membrane leaflet lipids (force field ${this.props.force_field})`}
          </Typography>

          <LipidSelectGroup 
            lipids={this.props.lipids}
            items={this.state.lower}
            onItemAdd={this.onLipidAdd}
            onItemChange={this.onLipidChange}
            onItemDelete={this.onLipidDelete}
          />

          {/*<Typography gutterBottom>
            pH
          </Typography>
          <Slider
            value={this.props.ph_low}
            valueLabelDisplay="auto"
            step={0.1}
            marks
            min={0.1}
            max={13.9}
            onChange={!this.state.upper_separated ? this.props.phLipidsChange : this.props.phLowChange}
            color="secondary"
          />*/}

          <Marger size="1rem" />

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

          </React.Fragment>}
          <Marger size="1rem" />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" color="secondary" onClick={this.props.onPrevious}>
              Back
            </Button>

            <Button variant="outlined" color="primary" //disabled={!this.can_continue} 
            onClick={this.next}>
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
        <div key={item.id}>
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

const useStylesLipid = makeStyles(theme => ({
  root: {
    display: 'grid',
    width: '100%',
    gridTemplateColumns: '1fr 1fr min-content',
    gap: '20px',
    margin: '1rem 0',
  },
}));

function LipidSelect(props: {
  id: number,
  lipids: string[],
  onChange(value: string, count: string): any;
  onDelete(): any;
  value: string;
  count: string;
}) {
  const classes = useStylesLipid();

  let error = false;
  let n_count = Number(props.count);
  if (!n_count || n_count < 0 || props.count.indexOf('.') !== -1) {
    error = true;
  }

  return (
    <div className={classes.root}>
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
        helperText="Positive integer"
      />

      <div>
        <IconButton onClick={props.onDelete}>
          <FaIcon trash />
        </IconButton>
      </div>
    </div>
  );
}
