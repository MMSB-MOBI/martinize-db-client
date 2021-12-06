import React from 'react';
import { withStyles, Typography, Button, TextField, Box, FormControlLabel, Checkbox, Link, Divider, RadioGroup, FormLabel, Radio, AppBar, Tab, Tabs } from '@material-ui/core';
import { Marger, downloadBlob, dateFormatter } from '../../../helpers';
import { SimpleSelect } from '../../../Shared';
import { toast } from '../../Toaster';
import { TabContext, TabPanel } from '@material-ui/lab';
import Settings from '../../../Settings';

export interface SettingsInsane {
  box_type: string;
  box_size: number[];
  area_per_lipid: number;
  area_per_lipid_upper?: number;
  random_kick_size: number;
  bead_distance: number;
  center_protein: boolean;
  orient_protein: boolean;
  rotate_mode: string;
  rotate_angle?: number;
  grid_spacing_orientation: number;
  hydrophobic_ratio: number;
  fudge_factor: number;
  shift_protein: number;

  salt_concentration: number;
  charge: number;
  solvent_type: string;
}

interface SCProps {
  addLipids: string;
  addMolecule: string;
  classes: Record<string, string>;
  hasUpperLayer: boolean;
  forceField: string; 
  onSettingsChoose(settings: SettingsInsane): any;
  onPrevious(): any;
  error?: true | { error: string, trace?: string, zip: number[] };
}

interface SCState {
  box_type: string;
  box_size: string;
  area_per_lipid: string;
  area_per_lipid_upper: string;
  random_kick_size: string;
  bead_distance: string;
  center_protein: boolean;
  orient_protein: boolean;
  rotate_mode: string;
  rotate_angle: string;
  grid_spacing_orientation: string;
  hydrophobic_ratio: string;
  fudge_factor: string;
  shift_protein: string;

  salt_concentration: string;
  charge: string;
  solvent_type: string;
  advanced: string;
}

function lte0orNaN(value: string) {
  return !(Number(value) > 0);
}

function lt0orNaN(value: string) {
  const n = Number(value);
  return isNaN(n) || n < 0;
}

const BOX_TYPES = ['hexagonal', 'rectangular', 'square', 'cubic', 'optimal', 'keep'] as const;
const ROTATE_TYPES = ['none', 'random', 'princ', 'angle'] as const;

class SettingsChooser extends React.Component<SCProps, SCState> {
  state: SCState = {
    box_type: BOX_TYPES[0],
    box_size: '7,7,9',
    area_per_lipid: '0.6',
    area_per_lipid_upper: '0.6',
    random_kick_size: '0.1',
    bead_distance: '0.3',
    orient_protein: false,
    center_protein: true,
    rotate_angle: '0',
    rotate_mode: ROTATE_TYPES[0],
    grid_spacing_orientation: '1.0',
    hydrophobic_ratio: '4.0',
    fudge_factor: '0.1',
    shift_protein: '0',
    salt_concentration: '0.15',
    charge: '0',
    solvent_type: 'W',
    advanced: "yes",
  };

  refreshCheckbox(field: keyof SCState) {
    return (_: any, checked: boolean) => {
      // @ts-ignore
      this.setState({ 
        [field]: checked
      });
    };
  }

  next = () => {
    const { box_size, box_type, area_per_lipid, area_per_lipid_upper, random_kick_size } = this.state;
    const { bead_distance, orient_protein, center_protein, rotate_angle, rotate_mode } = this.state;
    const { grid_spacing_orientation, hydrophobic_ratio, fudge_factor, shift_protein } = this.state;
    const { salt_concentration, charge, solvent_type } = this.state;

    if (!this.polarizable_compatibility){
      toast("Water and protein/lipids polarization are incompatible", "error")
      return; 
    }

    if (!this.can_continue) {
      toast("Invalid parameters.", "error");
      return;
    }

    this.props.onSettingsChoose({
      box_size: box_size.split(',').map(Number),
      box_type,
      area_per_lipid: Number(area_per_lipid),
      area_per_lipid_upper: this.props.hasUpperLayer ? Number(area_per_lipid_upper) : undefined,
      random_kick_size: Number(random_kick_size),
      bead_distance: Number(bead_distance),
      orient_protein,
      center_protein,
      rotate_mode,
      rotate_angle: rotate_mode === 'angle' ? Number(rotate_angle) : undefined,
      grid_spacing_orientation: Number(grid_spacing_orientation),
      hydrophobic_ratio: Number(hydrophobic_ratio),
      fudge_factor: Number(fudge_factor),
      shift_protein: Number(shift_protein),
      salt_concentration: Number(salt_concentration),
      charge: Number(charge),
      solvent_type,
    });
  };

  get can_continue() {
    const { 
      area_per_lipid, 
      area_per_lipid_upper, 
      random_kick_size, 
      bead_distance, 
      grid_spacing_orientation, 
      hydrophobic_ratio, 
      fudge_factor, 
      shift_protein, 
    } = this.state;

    return !this.box_is_error &&
      !this.angle_is_error &&
      [
        area_per_lipid, 
        area_per_lipid_upper, 
        random_kick_size, 
        bead_distance, 
        grid_spacing_orientation, 
        hydrophobic_ratio
      ].every(e => !lte0orNaN(e)) &&
      !lt0orNaN(fudge_factor) &&
      !isNaN(Number(shift_protein));
  }

  get box_is_error() {
    const items = this.state.box_size.split(',').map(e => !e ? NaN : Number(e));

    // test: Number is not NaN, not < 0, not a floating point number, and dimension is 3, 6 or 9.
    return items.some(e => isNaN(e) || e < 0 || e.toString().indexOf('.') !== -1) || ![3, 6, 9].includes(items.length);
  }

  get angle_is_error() {
    const angle = Number(this.state.rotate_angle);
    return isNaN(angle) || angle < 0 || angle > 360;
  }

  get polarizable_compatibility(): boolean{
    const water_polarization = true ? this.state.solvent_type === "PW" : false
    if (water_polarization === Settings.martinize_variables.force_fields_info[this.props.forceField].polarizable) return true
    else return false
  }

  renderErrorText(text: string) {
    switch (text) {
      case 'insane_crash': return 'INSANE run failed';
      case 'gromacs_crash': return 'GROMACS failed to compile membrane topology';
      case 'top_file_crash': return 'System couldn\'t be properly created';
      default: return 'Unknown error';
    }
  }

  renderError() {
    const error = this.props.error;

    if (!error || error === true) {
      return (
        <Typography color="error">
          Run failed with an unknown error.
        </Typography>
      );
    }

    const download_fn = () => {
      const blob = new Blob([new Uint8Array(error.zip).buffer]);
      downloadBlob(blob, "insane_run_" + dateFormatter("Y-m-d_H-i-s") + ".zip")
    };

    return (
      <div>
        <Typography color="error" style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
          {this.renderErrorText(error.error)}.
        </Typography>
        <Typography style={{ marginBottom: '1rem' }}>
          <Link href="#!" onClick={download_fn}>
            Download a dump of this run
          </Link>
        </Typography>

        <Divider />
      </div>
    );
  }

  render() {
    const error = this.props.error;

    return (
      <React.Fragment>
        <Marger size="1rem" />

        {error && <Box textAlign="center" style={{ marginBottom: '1rem' }}>
          {this.renderError()}
        </Box>}

        <Typography align="center" variant="h5">
          INSANE settings
        </Typography>

        <Marger size="1rem" />

        <TabContext value={this.state.advanced}>
          <AppBar position="static" color="default">
            <Tabs
              value={this.state.advanced}
              onChange={(event: React.ChangeEvent<{}>, newValue: string) => {
                this.setState({advanced: newValue});
              }}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              aria-label="full width tabs example"
            >
              <Tab label="Common settings" value="yes" />
              <Tab label="Advanced settings" value="no" />
            </Tabs>
          </AppBar>
          <Marger size=".5rem" />
            <TabPanel value="yes">
              <Typography align="center" variant="h6">
                Periodic boundary conditions
              </Typography>
              
              <div>
                <SimpleSelect
                  label="Box type"
                  variant="standard"
                  id="box_select"
                  values={BOX_TYPES.map(e => ({ id: e, name: e }))}
                  value={this.state.box_type}
                  onChange={val => this.setState({ box_type: val })}
                  noMinWidth
                  formControlClass={this.props.classes.form}
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
                  className={this.props.classes.form}
                />
              </div>

              <Marger size="1.5rem" />

              {this.props.addLipids === "true" && <React.Fragment>
                <Typography align="center" variant="h6">
                  Lipid options
                </Typography>

                <Marger size="1rem" />

                {/* Area per lipid */}
                <Box display="grid" gridTemplateColumns={this.props.hasUpperLayer ? '1fr 1fr' : '1fr'} gridGap="4%">
                  {this.props.hasUpperLayer && <Box width="100%">
                    <TextField 
                      value={this.state.area_per_lipid_upper}
                      onChange={e => this.setState({ area_per_lipid_upper: e.target.value })}
                      label="Area per lipid (upper layer, nm²)"
                      helperText="Must be greater than 0"
                      type="number"
                      className={this.props.classes.form}
                      error={lte0orNaN(this.state.area_per_lipid_upper)}
                    />
                  </Box>}

                  <Box width="100%">
                    <TextField 
                      value={this.state.area_per_lipid}
                      onChange={e => this.setState({ area_per_lipid: e.target.value })}
                      label={`Area per lipid (${this.props.hasUpperLayer ? "lower layer, " : ""}nm²)`}
                      helperText="Must be greater than 0"
                      type="number"
                      className={this.props.classes.form}
                      error={lte0orNaN(this.state.area_per_lipid)}
                    />
                  </Box>
                </Box>

                <Marger size="1rem" />

              </React.Fragment>}

              {this.props.addMolecule === "true" && <React.Fragment>
                <Typography align="center" variant="h6">
                  Protein options
                </Typography>

                {/* Center and orientation */}
                <Box width="100%" display="flex" justifyContent="center">
                  <FormControlLabel
                    control={<Checkbox 
                      value="center" 
                      checked={this.state.center_protein} 
                      onChange={this.refreshCheckbox('center_protein')} 
                    />}
                    label={this.props.addLipids === "true" ? "Center protein in membrane" : "Center protein in box"}
                  />
                </Box>

                {this.props.addLipids === "true" && <Box width="100%" display="flex" justifyContent="center">
                  <FormControlLabel
                    control={<Checkbox 
                      value="orient" 
                      checked={this.state.orient_protein} 
                      onChange={this.refreshCheckbox('orient_protein')} 
                    />}
                    label="Orient protein in membrane"
                  />
                </Box>}

                <Marger size="1rem" />

                {/* Rotation of protein */}
                <Box display="grid" gridTemplateColumns="1fr" gridGap="10px">
                  <SimpleSelect
                    label="Rotate protein"
                    variant="standard"
                    id="rotate_prot_select"
                    values={ROTATE_TYPES.map(e => ({ id: e, name: e }))}
                    value={this.state.rotate_mode}
                    onChange={val => this.setState({ rotate_mode: val })}
                    noMinWidth
                    formControlClass={this.props.classes.form}
                  />

                  {this.state.rotate_mode === 'angle' && <Box width="100%"> 
                    <TextField 
                      value={this.state.rotate_angle}
                      onChange={e => this.setState({ rotate_angle: e.target.value })}
                      label={`Rotation angle (deg)`}
                      helperText="Must be between 0 and 360"
                      type="number"
                      className={this.props.classes.form}
                      error={this.angle_is_error}
                    />
                  </Box>}
                </Box>

              </React.Fragment>}

              <Marger size="1.5rem" />

              <React.Fragment>
                <Typography align="center" variant="h6">
                  Water, salt and solvent options
                </Typography>

                <Marger size="1rem" />

                {/*  */}
                <Box display="grid" gridTemplateColumns="1fr" gridGap="4%">
                  <Box width="100%">
                  <TextField 
                      value={this.state.salt_concentration}
                      onChange={e => this.setState({ salt_concentration: e.target.value })}
                      label="Salt concentration"
                      helperText=""
                      type="number"
                      className={this.props.classes.form}
                      error={lte0orNaN(this.state.area_per_lipid_upper)}
                    />
                  </Box>

                  <Box width="100%">
                    <TextField 
                      value={this.state.charge}
                      onChange={e => this.setState({ charge: e.target.value })}
                      label="System total charge"
                      helperText=""
                      type="number"
                      className={this.props.classes.form}
                    />
                  </Box>

                  <Box width="100%">
                  <FormLabel component="legend">Solvent type</FormLabel>
                  <RadioGroup row name="Solvent type" value={this.state.solvent_type} onChange={e => this.setState({solvent_type: e.target.value})}>
                    <FormControlLabel value="W" control={<Radio />} label="Water"/>
                    <FormControlLabel value="PW" control={<Radio />} label="Polarized Water"/>
                  </RadioGroup>
                  </Box>
                </Box>

                <Marger size="1.5rem" />
              </React.Fragment>

            </TabPanel>
            <TabPanel value="no">
              {this.props.addLipids === "true" && <React.Fragment>
                <Typography align="center" variant="h6">
                  Lipid options
                </Typography>

                <Marger size="1rem" />

                {/* Random kick size or bead distance */}
                <Box display="flex" flexDirection="row" justifyContent="space-between">
                  <Box width="48%">
                    <TextField 
                      value={this.state.random_kick_size}
                      onChange={e => this.setState({ random_kick_size: e.target.value })}
                      label="Random kick size"
                      helperText="Must be greater than 0"
                      type="number"
                      className={this.props.classes.form}
                      error={lte0orNaN(this.state.random_kick_size)}
                    />
                  </Box>

                  <Box width="48%">
                    <TextField 
                      value={this.state.bead_distance}
                      onChange={e => this.setState({ bead_distance: e.target.value })}
                      label="Bead distance (nm)"
                      helperText="Must be greater than 0"
                      type="number"
                      className={this.props.classes.form}
                      error={lte0orNaN(this.state.bead_distance)}
                    />
                  </Box>
                </Box>

                <Marger size="1.5rem" />
              </React.Fragment>}

              {this.props.addMolecule === "true" && <React.Fragment>
                <Typography align="center" variant="h6">
                  Protein options
                </Typography>

                <Marger size=".5rem" />

                {/* Grid spacing & hydrophobic ratio */}
                <Box display="grid" gridTemplateColumns="1fr 1fr" gridGap="4%">
                  <Box width="100%">
                    <TextField 
                      value={this.state.grid_spacing_orientation}
                      onChange={e => this.setState({ grid_spacing_orientation: e.target.value })}
                      label="Grid spacing"
                      helperText="Must be greater than 0"
                      type="number"
                      className={this.props.classes.form}
                      error={lte0orNaN(this.state.grid_spacing_orientation)}
                    />
                  </Box>

                  <Box width="100%">
                    <TextField 
                      value={this.state.hydrophobic_ratio}
                      onChange={e => this.setState({ hydrophobic_ratio: e.target.value })}
                      label="Hydrophobic ratio"
                      helperText="Must be greater than 0"
                      type="number"
                      className={this.props.classes.form}
                      error={lte0orNaN(this.state.hydrophobic_ratio)}
                    />
                  </Box>
                </Box>

                <Marger size="1rem" />

                {/* Fudge factor & shift protein */}
                <Box display="grid" gridTemplateColumns="1fr 1fr" gridGap="4%">
                  <Box width="100%">
                    <TextField 
                      value={this.state.fudge_factor}
                      onChange={e => this.setState({ fudge_factor: e.target.value })}
                      label="Fudge factor for L-P overlap"
                      helperText="Must be equal or greater than 0"
                      type="number"
                      className={this.props.classes.form}
                      error={lt0orNaN(this.state.fudge_factor)}
                    />
                  </Box>

                  <Box width="100%">
                    <TextField 
                      value={this.state.shift_protein}
                      onChange={e => this.setState({ shift_protein: e.target.value })}
                      label="Shift protein"
                      helperText="Must be a number"
                      type="number"
                      className={this.props.classes.form}
                      error={isNaN(Number(this.state.shift_protein))}
                    />
                  </Box>
                </Box>
              </React.Fragment>}

              <Marger size="1.5rem" />
              
            </TabPanel>
        </TabContext>

        

        <Marger size="2rem" />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="outlined" color="secondary" onClick={this.props.onPrevious}>
            Back
          </Button>

          <Button variant="outlined" color="primary" disabled={!this.can_continue} onClick={this.next}>
            Create system
          </Button>
        </div>
      </React.Fragment>
    );
  }
}

export default withStyles(theme => ({
  form: {
    width: '100%'
  },
}))(SettingsChooser);
