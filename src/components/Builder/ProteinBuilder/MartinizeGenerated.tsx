import React from 'react';
import { Marger, FaIcon } from '../../../helpers';
import { Button, Typography, FormControl, FormGroup, FormControlLabel, Switch, Slider, Divider, Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Theme } from '@material-ui/core';
import { ToggleButtonGroup, ToggleButton } from '@material-ui/lab';
import { ViableRepresentation } from '../NglWrapper';

interface MartinizeGeneratedProps {
  onReset(): any;
  theme: Theme;
  onThemeChange(): any;
  virtualLinks: 'go' | 'elastic' | '';

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

  saved: boolean;
  onMoleculeStash(): any;
  generatingFiles: boolean;
  onMoleculeDownload(): any;

  onGoEditorStart(): any;
}

export default function MartinizeGenerated(props: MartinizeGeneratedProps) {
  const [wantReset, setWantReset] = React.useState(false);

  return (
    <React.Fragment>
      <Dialog open={wantReset} onClose={() => setWantReset(false)}>
        <DialogTitle>
          Restart molecule builder ?
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            You will lose unsaved actions.
          </DialogContentText>
          <DialogContentText>
            If you want to use this molecule in Membrane Builder or get back to this page later,
            you must save the molecule firt, using the appropriate button.
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button color="primary" onClick={() => setWantReset(false)}>Cancel</Button>
          <Button color="secondary" onClick={props.onReset}>Restart builder</Button>
        </DialogActions>
      </Dialog>

      <Marger size="1rem" />

      <Button 
        style={{ width: '100%' }} 
        color="primary" 
        onClick={() => setWantReset(true)}
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
            control={<Switch checked={props.theme.palette.type === 'dark'} onChange={props.onThemeChange} value="dark" />}
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
        value={props.allAtomOpacity * 100}
        valueLabelDisplay="auto"
        step={10}
        marks
        min={10}
        max={100}
        onChange={props.onAllAtomOpacityChange}
        color="secondary"
      />

      <FormControl component="fieldset">
        <FormGroup>
          <FormControlLabel
            control={<Switch checked={props.allAtomVisible} onChange={props.onAllAtomVisibilityChange} value="visible" />}
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
        value={props.coarseGrainedOpacity * 100}
        valueLabelDisplay="auto"
        step={10}
        marks
        min={10}
        max={100}
        onChange={props.onCoarseGrainedOpacityChange}
        color="secondary"
      />

      <FormControl component="fieldset">
        <FormGroup>
          <FormControlLabel
            control={<Switch checked={props.coarseGrainedVisible} onChange={props.onCoarseGrainedVisibilityChange} value="visible" />}
            label="Visible"
          />
        </FormGroup>
      </FormControl>

      <Marger size="1rem" />

      {/* Go / Elastic networks virtual bonds */}
      {props.virtualLinks && <React.Fragment>
        <Typography variant="h6">
          Virtual {props.virtualLinks === "go" ? "Go" : "elastic"} bonds
        </Typography>

        <Marger size=".5rem" />

        {props.virtualLinks === "go" && <Box alignContent="center" justifyContent="center" width="100%">
          <Button 
            style={{ width: '100%' }} 
            color="primary" 
            onClick={props.onGoEditorStart}
          >
            <FaIcon pen /> <span style={{ marginLeft: '.6rem' }}>Edit</span>
          </Button>
        </Box>}

        <Marger size=".5rem" />

        <Typography gutterBottom>
          Opacity
        </Typography>
        <Slider
          value={props.virtualLinksOpacity * 100}
          valueLabelDisplay="auto"
          step={10}
          marks
          min={10}
          max={100}
          onChange={props.onVirtualLinksOpacityChange}
          color="secondary"
        />

        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={<Switch checked={props.virtualLinksVisible} onChange={props.onVirtualLinksVisibilityChange} value="visible" />}
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
          value={props.representations}
          onChange={props.onRepresentationChange}
        >
          <ToggleButton value="ball+stick">
            <FaIcon atom />
          </ToggleButton>
          <ToggleButton value="ribbon">
            <FaIcon ribbon />
          </ToggleButton>
          <ToggleButton value="surface">
            <FaIcon bullseye />
          </ToggleButton>
          <ToggleButton value="hyperball">
            <FaIcon expand-alt />
          </ToggleButton>
          <ToggleButton value="line">
            <FaIcon project-diagram />
          </ToggleButton>
        </ToggleButtonGroup>
      </div>

      <Marger size="1rem" />

      <Divider style={{ width: '100%' }} />

      <Marger size="1rem" />

      <Box alignContent="center" justifyContent="center" width="100%">
        <Button 
          style={{ width: '100%' }} 
          color="secondary" 
          disabled={props.saved}
          onClick={props.onMoleculeStash}
        >
          <FaIcon save /> <span style={{ marginLeft: '.6rem' }}>Save</span>
        </Button>

        <Marger size="1rem" />

        <Button 
          style={{ width: '100%' }} 
          color="primary" 
          disabled={props.generatingFiles}
          onClick={props.onMoleculeDownload}
        >
          <FaIcon download /> <span style={{ marginLeft: '.6rem' }}>Download</span>
        </Button>
      </Box>

    </React.Fragment>
  );
}
