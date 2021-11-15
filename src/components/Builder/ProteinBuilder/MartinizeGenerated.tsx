import React from 'react';
import { Marger, FaIcon } from '../../../helpers';
import { Button, Typography, FormControl, FormGroup, FormControlLabel, Switch, Slider, Divider, Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Theme } from '@material-ui/core';
import { ToggleButtonGroup, ToggleButton, Alert } from '@material-ui/lab';
import { ViableRepresentation } from '../NglWrapper';
import Tooltip from '../../../Tooltip';
import { promises as FsPromise } from 'fs';

interface MartinizeGeneratedProps {
  onReset(): any;
  theme: Theme;
  onThemeChange(): any;
  virtualLinks: 'go' | 'elastic' | '' ;

  allAtomName: string;

  allAtomOpacity: number;
  onAllAtomOpacityChange(_: any, value: number | number[]): any;
  allAtomVisible: boolean;
  onAllAtomVisibilityChange(_: any, checked: boolean): any;

  coarseGrainedOpacity: number;
  onCoarseGrainedOpacityChange(_: any, value: number | number[]): any;
  coarseGrainedVisible: boolean;
  onCoarseGrainedVisibilityChange(_: any, checked: boolean): any;

  virtualLinksOpacity: number;
  onVirtualLinksOpacityChange(_: any, value: number | number[]): any;
  virtualLinksVisible: boolean;
  onVirtualLinksVisibilityChange(_: any, checked: boolean): any;

  representations: ViableRepresentation[];
  onRepresentationChange(_: any, values: ViableRepresentation[]): any;

  saved: string | false;
  edited: boolean;
  generatingFiles: boolean;
  onMoleculeDownload(): any;

  onGoEditorStart(): any;

  martinizeWarnings?: any;
}

interface MartinizeGeneratedStates {
  wantReset: boolean, 
  openWarning: boolean, 
  warnings: string
}

export default class MartinizeGenerated extends React.Component<MartinizeGeneratedProps, MartinizeGeneratedStates>{
  state: MartinizeGeneratedStates = {
    wantReset : false, 
    openWarning : false, 
    warnings: ""
  }

  componentDidMount() {
    this.props.martinizeWarnings.text().then((fileStr:string) => {
      this.setState({warnings: fileStr})
    })
    
    
  }

  render() {
    return (
      <React.Fragment>

        {(this.state.warnings.length !== 0) &&

        <Alert severity="warning" action={
          <Button 
            size="medium"
            color="inherit" 
            onClick={() => this.setState({openWarning: true})}
          >
            Warnings were encountered
          </Button>
        }>
        </Alert>}

        <Dialog
          open={this.state.openWarning}
          fullWidth={true}
          maxWidth="lg"
          >
          <DialogTitle>Gromacs encountered warnings : </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {this.state.warnings}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => this.setState({openWarning: false})} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
  
        <Dialog open={this.state.wantReset} onClose={() => this.setState({wantReset: false})}>
          <DialogTitle>
            Restart molecule builder ?
          </DialogTitle>
  
  
          <DialogActions>
            <Button color="primary" onClick={() => this.setState({wantReset: false})}>Cancel</Button>
            <Button color="secondary" onClick={this.props.onReset}>Restart builder</Button>
          </DialogActions>
        </Dialog>
  
        <Marger size="1rem" />
  
        <Button 
          style={{ width: '100%' }} 
          color="primary" 
          onClick={() => this.setState({wantReset : true})}
        >
          <FaIcon redo-alt /> <span style={{ marginLeft: '.6rem' }}>Restart builder</span>
        </Button>
  
        <Marger size="1rem" />
  
        {/* Theme */}
        <Typography variant="h6">
          Theme
        </Typography>
        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={<Switch checked={this.props.theme.palette.type === 'dark'} onChange={this.props.onThemeChange} value="dark" />}
              label="Dark theme"
            />
          </FormGroup>
        </FormControl>
  
        <Marger size="2rem" />
  
        {/* All Atom Settings */}
        <Typography variant="h6">
          All atom
        </Typography>
  
        <Typography gutterBottom>
          Opacity
        </Typography>
        <Slider
          value={this.props.allAtomOpacity * 100}
          valueLabelDisplay="auto"
          step={10}
          marks
          min={10}
          max={100}
          onChange={this.props.onAllAtomOpacityChange}
          color="secondary"
        />
  
        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={<Switch checked={this.props.allAtomVisible} onChange={this.props.onAllAtomVisibilityChange} value="visible" />}
              label="Visible"
            />
          </FormGroup>
        </FormControl>
  
        <Marger size="1rem" />
  
        {/* Coarse Grained Settings */}
        <Typography variant="h6">
          Coarse grained
        </Typography>
  
        <Typography gutterBottom>
          Opacity
        </Typography>
        <Slider
          value={this.props.coarseGrainedOpacity * 100}
          valueLabelDisplay="auto"
          step={10}
          marks
          min={10}
          max={100}
          onChange={this.props.onCoarseGrainedOpacityChange}
          color="secondary"
        />
  
        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={<Switch checked={this.props.coarseGrainedVisible} onChange={this.props.onCoarseGrainedVisibilityChange} value="visible" />}
              label="Visible"
            />
          </FormGroup>
        </FormControl>
  
        <Marger size="1rem" />
  
        {/* Go / Elastic networks virtual bonds */}
        {this.props.virtualLinks && <React.Fragment>
          <Typography variant="h6">
            Virtual {this.props.virtualLinks === "go" ? "Go" : "Elastic"} bonds
          </Typography>
  
          <Marger size=".5rem" />
  
          {this.props.virtualLinks === "go" && <Box alignContent="center" justifyContent="center" width="100%">
            <Button 
              style={{ width: '100%' }} 
              color="primary" 
              onClick={this.props.onGoEditorStart}
            >
              <FaIcon pen /> <span style={{ marginLeft: '.6rem' }}>Edit</span>
            </Button>
          </Box>}
  
          {this.props.virtualLinks === "elastic" && <Box alignContent="center" justifyContent="center" width="100%">
            <Button 
              style={{ width: '100%' }} 
              color="primary" 
              onClick={this.props.onGoEditorStart}
            >
              <FaIcon pen /> <span style={{ marginLeft: '.6rem' }}>Edit</span>
            </Button>
          </Box>}
  
          <Marger size=".5rem" />
  
          <Typography gutterBottom>
            Opacity
          </Typography>
          <Slider
            value={this.props.virtualLinksOpacity * 100}
            valueLabelDisplay="auto"
            step={10}
            marks
            min={10}
            max={100}
            onChange={this.props.onVirtualLinksOpacityChange}
            color="secondary"
          />
  
          <FormControl component="fieldset">
            <FormGroup>
              <FormControlLabel
                control={<Switch checked={this.props.virtualLinksVisible} onChange={this.props.onVirtualLinksVisibilityChange} value="visible" />}
                label="Visible"
              />
            </FormGroup>
          </FormControl>
  
          <Marger size="1rem" />
        </React.Fragment>}
  
        <Typography variant="h6">
          Representations
        </Typography>
  
        <Marger size=".5rem" />
  
        <div>
          {/* 'ball+stick' | 'ribbon' | 'surface' | 'hyperball' | 'line' */}
          <ToggleButtonGroup
            value={this.props.representations}
            onChange={this.props.onRepresentationChange}
          >
            <ToggleButton value="ball+stick">
              <Tooltip title="Ball + stick">
                <span style={{ height: 24 }}>
                  <FaIcon atom />
                </span>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="ribbon">
              <Tooltip title="Ribbon">
                <span style={{ height: 24 }}>
                  <FaIcon ribbon />
                </span>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="surface">
              <Tooltip title="Surface">
                <span style={{ height: 24 }}>
                  <FaIcon bullseye />
                </span>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="hyperball">
              <Tooltip title="Hyperball">
                <span style={{ height: 24 }}>
                  <FaIcon expand-alt />
                </span>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="line">
              <Tooltip title="Line">
                <span style={{ height: 24 }}>
                  <FaIcon project-diagram />
                </span>
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
  
        <Marger size="1rem" />
  
        <Divider style={{ width: '100%' }} />
  
        <Marger size="1rem" />
  
        <Box alignContent="center" justifyContent="center" width="100%">
  
          <Marger size="1rem" />
  
          <Button 
            style={{ width: '100%' }} 
            color="primary" 
            disabled={this.props.generatingFiles}
            onClick={this.props.onMoleculeDownload}
          >
            <FaIcon download /> <span style={{ marginLeft: '.6rem' }}>Download</span>
          </Button>
        </Box>
  
      </React.Fragment>
    );
  }

}
