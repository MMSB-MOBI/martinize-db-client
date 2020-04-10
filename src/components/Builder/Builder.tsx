import React from 'react';
import { withStyles, Grid, Typography, Paper, TextField, Button, withTheme, Theme, CircularProgress, Slider, FormControl, FormGroup, FormControlLabel, Switch, Box, Divider, createMuiTheme, ThemeProvider, Link, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@material-ui/core';
import { Marger, errorToText, FaIcon, downloadBlob } from '../../helpers';
import { Link as RouterLink } from 'react-router-dom';

import { Stage, Component as NGLComponent } from '@mmsb/ngl';
import * as ngl from '@mmsb/ngl';

import { SimpleSelect } from '../../Shared';
import Settings from '../../Settings';
import ApiHelper from '../../ApiHelper';
import { toast } from '../Toaster';
import RepresentationElement from '@mmsb/ngl/declarations/component/representation-element';
import { RepresentationParameters } from '@mmsb/ngl/declarations/representation/representation';
import JSZip from 'jszip';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { blue } from '@material-ui/core/colors';
import { applyUserRadius } from '../../nglhelpers';
import StashedBuildHelper, { MartinizeFile } from '../../StashedBuildHelper';
import StashedBuild from './StashedBuild';

// @ts-ignore
window.NGL = ngl;

type ViableRepresentation = 'ball+stick' | 'ribbon' | 'surface' | 'hyperball' | 'line';

interface MBProps {
  classes: Record<string, string>;
  theme: Theme;
}

interface MBState {
  running: 'pdb' | 'pdb_read' | 'martinize_params' | 'martinize_generate' | 'martinize_error' | 'done';
  error?: any;
  saver_modal: string | false;

  all_atom_pdb?: File;
  all_atom_ngl?: NGLComponent;
  all_atom_representations: RepresentationElement[];

  coarse_grain_pdb?: Blob;
  coarse_grain_ngl?: NGLComponent;
  coarse_grain_representations: RepresentationElement[];

  builder_force_field: string;
  builder_mode: 'go' | 'classic' | 'elastic';
  builder_positions: 'none' | 'all' | 'backbone';
  builder_ef: string;
  builder_el: string;
  builder_eu: string;
  builder_ea: string;
  builder_ep: string;
  builder_em: string;

  all_atom_opacity: number;
  all_atom_visible: boolean;
  coarse_grain_opacity: number;
  coarse_grain_visible: boolean;
  representations: ViableRepresentation[];
  
  files?: {
    pdb: MartinizeFile;
    itps: MartinizeFile[];
    radius: { [name: string]: number };
    top: MartinizeFile;
  };
  generating_files: boolean;
  saved: boolean;
  want_reset: boolean;
  want_go_back: boolean;

  theme: Theme;
}

/**
 * TODO: iterate over atoms in NGL
 * 
 * Access each coarse grained atom
 * MoleculeBuilder.ngl_stage.compList[1].reprList[0].repr.structure
 *  .eachAtom(a => atom...)  or  .atomIterator()
 * 
 * Access Three.js scene
 * MoleculeBuilder.ngl_stage.viewer.scene
 */

class MartinizeBuilder extends React.Component<MBProps, MBState> {
  state = this.original_state;

  protected ngl_stage?: Stage;

  protected root = React.createRef<HTMLDivElement>();
  protected go_back_btn = React.createRef<any>();

  componentDidMount() {
    this.ngl_stage = new Stage("ngl-stage", { backgroundColor: this.props.theme.palette.background.default });
    // @ts-ignore
    window.MoleculeBuilder = this;
    document.getElementById('ngl-stage')!.addEventListener('wheel', (e) => {
      e.preventDefault();
    }, { passive: false });
  }

  protected get original_state() : MBState {
    return {
      running: 'pdb',
      builder_force_field: 'martini304',
      builder_mode: 'classic',
      builder_positions: 'backbone',
      builder_ef: '500',
      builder_el: '0.5',
      builder_eu: '0.9',
      builder_ea: '0',
      builder_ep: '0',
      builder_em: '0',
      coarse_grain_representations: [],
      all_atom_representations: [],
      coarse_grain_opacity: 1,
      coarse_grain_visible: true,
      all_atom_visible: true,
      all_atom_opacity: .3,
      generating_files: false,
      representations: ['ball+stick'],
      theme: createMuiTheme({
        palette: {
          type: 'light',
          background: {
            default: '#fafafa',
          },
        },
      }),
      saved: false,
      want_reset: false,
      want_go_back: false,
      error: undefined,
      saver_modal: false,
    };
  }

  /* LOAD, RESET AND SAVE STAGES */
  save(name: string) {
    const saver = new StashedBuildHelper();

    if (!this.state.files) {
      return;
    }

    this.setState({
      saved: true,
      saver_modal: false
    });

    toast("Your molecule has been saved.", "info");

    return saver.add({
      info: {
        created_at: new Date(),
        name,
        builder_force_field: this.state.builder_force_field,
        builder_mode: this.state.builder_mode,
        builder_positions: this.state.builder_positions,
        builder_ef: this.state.builder_ef,
        builder_el: this.state.builder_el,
        builder_ea: this.state.builder_ea,
        builder_eu: this.state.builder_eu,
        builder_ep: this.state.builder_ep,
        builder_em: this.state.builder_em,
      },
      all_atom: this.state.all_atom_pdb!,
      coarse_grained: this.state.files.pdb,
      itp_files: this.state.files.itps,
      top_file: this.state.files.top,
      radius: this.state.files.radius,
    });
  }

  async load(uuid: string) {
    const saver = new StashedBuildHelper();
    
    const save = await saver.get(uuid);

    if (!save) {
      return;
    }

    this.initAllAtomPdb(save.all_atom);

    const infos = { ...save.info };
    delete infos.created_at;
    delete infos.name;

    // @ts-ignore
    this.setState(infos);

    const cg_pdb = save.coarse_grained.content;

    // Init PDB scene
    this.initCoarseGrainPdb(cg_pdb, save.radius);
    this.setState({ 
      files: {
        top: save.top_file,
        itps: save.itp_files,
        pdb: save.coarse_grained,
        radius: save.radius,
      },
      saved: true,
    });
  }

  reset() {
    if (this.ngl_stage)
      this.ngl_stage.removeAllComponents();
    this.setState(this.original_state);
    this.changeTheme('light');
  }


  /* SET SETTINGS FOR REPRESENTATIONS */

  setCoarseGrainRepresentation(parameters: Partial<RepresentationParameters>) {
    for (const repr of this.state.coarse_grain_representations) {
      repr.setParameters(parameters);
    }
  }

  setAllAtomRepresentation(parameters: Partial<RepresentationParameters>) {
    for (const repr of this.state.all_atom_representations) {
      repr.setParameters(parameters);
    }
  }

  setRepresentation(parameters: Partial<RepresentationParameters>) {
    this.setCoarseGrainRepresentation(parameters);
    this.setAllAtomRepresentation(parameters);
  }

  changeTheme(hint: 'light' | 'dark') {
    const bgclr = hint === 'dark' ? '#303030' : '#fafafa';

    this.setState({
      theme: createMuiTheme({
        palette: {
          type: hint,
          background: {
            default: bgclr,
          },
          primary: hint === 'dark' ? { main: blue[600] } : undefined,
        },
      })
    });

    this.ngl_stage!.setParameters({ backgroundColor: bgclr });
  }

  initCoarseGrainPdb(pdb: Blob, radius: { [atom: string]: number }) {
    // Apply the NGL radius
    applyUserRadius(radius);

    this.ngl_stage!.loadFile(pdb, { ext: 'pdb', name: 'coarse_grain.pdb' })
      .then(component => {
        if (component) {
          const repr: RepresentationElement = component.addRepresentation("ball+stick", undefined);
          // repr.name => "ball+stick"

          component.autoView(500);

          this.setAllAtomRepresentation({ opacity: .3 });

          // Register the component
          this.setState({
            running: 'done',
            coarse_grain_pdb: pdb,
            coarse_grain_representations: [...this.state.coarse_grain_representations, repr],
            coarse_grain_ngl: component,
          });
        }
      })
      .catch((e: any) => {
        console.error(e);
        toast("Unable to load generated PDB. Please retry by re-loading the page.");
      });
  }

  initAllAtomPdb(file: File) {
    return this.ngl_stage!.loadFile(file)
      .then(component => {
        if (component) {
          const repr: RepresentationElement = component.addRepresentation("ball+stick", undefined);

          component.autoView();
  
          // Register the component
          this.setState({
            all_atom_ngl: component,
            all_atom_pdb: file,
            all_atom_representations: [...this.state.all_atom_representations, repr],
          });
        }
      });
  }


  /* EVENTS */

  handleMartinizeBegin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const form_data: any = {};
    
    const s = this.state;

    form_data.ff = s.builder_force_field;
    form_data.position = s.builder_positions;

    if (s.builder_mode === "elastic") {
      form_data.elastic = "true";
      form_data.ef = s.builder_ef;
      form_data.el = s.builder_el;
      form_data.eu = s.builder_eu;
      form_data.ea = s.builder_ea;
      form_data.ep = s.builder_ep;
      form_data.em = s.builder_em;
    }
    else if (s.builder_mode === "go") {
      form_data.use_go = "true";
      form_data.sc_fix = "true";
    }

    form_data.pdb = s.all_atom_pdb;

    this.setState({ 
      running: 'martinize_generate',
      error: undefined,
    });

    ApiHelper.request('molecule/martinize', {
      parameters: form_data,
      method: 'POST',
      body_mode: 'multipart',
      mode: 'text',
    }) 
      .then((res: string) => {
        const data = martinizeOutputParser(res);
        console.log(data);

        const cg_pdb = data.pdb.content;

        // Init PDB scene
        this.initCoarseGrainPdb(cg_pdb, data.radius);
        this.setState({ files: data });
      })
      .catch(e => {
        console.log(e);
        if (Array.isArray(e)) {
          const error = e[1];

          this.setState({
            running: 'martinize_error',
            error
          });
        }
        else {
          this.setState({
            running: 'martinize_error'
          });
        }
      }) 
  };

  allAtomPdbChange = (e: React.FormEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];

    if (file) {
      // Mount the PDB in NGL
      this.setState({
        running: 'pdb_read'
      });

      this.initAllAtomPdb(file)
        .then(() => {
          this.setState({
            running: 'martinize_params',
          });
        })
        .catch((e: any) => {
          console.error(e);
          this.setState({
            running: 'pdb',
            error: e
          });
        });
    }
    else {
      if (this.state.all_atom_ngl)
        this.ngl_stage!.removeComponent(this.state.all_atom_ngl);

      this.setState({
        all_atom_ngl: undefined,
        all_atom_pdb: undefined,
        running: 'pdb'
      });
    }
  };

  onAllAtomOpacityChange = (_: any, value: number | number[]) => {
    if (Array.isArray(value)) {
      value = value[0];
    }

    this.setState({
      all_atom_opacity: value / 100
    });

    this.setAllAtomRepresentation({ opacity: value / 100 });
  };

  onAllAtomVisibilityChange = (_: any, checked: boolean) => {
    for (const repr of this.state.all_atom_representations) {
      repr.setVisibility(checked);
    }
    
    this.setState({ all_atom_visible: checked });
  };

  onCoarseGrainedOpacityChange = (_: any, value: number | number[]) => {
    if (Array.isArray(value)) {
      value = value[0];
    }

    this.setState({
      coarse_grain_opacity: value / 100
    });

    this.setCoarseGrainRepresentation({ opacity: value / 100 });
  };

  onCoarseGrainedVisibilityChange = (_: any, checked: boolean) => {
    for (const repr of this.state.coarse_grain_representations) {
      repr.setVisibility(checked);
    }

    this.setState({ coarse_grain_visible: checked });
  };

  onMoleculeDownload = async () => {
    if (!this.state.files) {
      console.warn("Hey, files should be present in component when this method is called.");
      return;
    }

    this.setState({ generating_files: true });

    try {
      const zip = new JSZip();
      const files = this.state.files;
  
      zip.file(files.pdb.name, files.pdb.content);
      zip.file(files.top.name, files.top.content);

      for (const itp of files.itps) {
        zip.file(itp.name, itp.content);
      }
  
      const generated = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 7
        }
      });

      const original_name = this.state.all_atom_pdb!.name;
      const without_extension = original_name.slice(0, original_name.indexOf('.pdb')) + '-CG';

      downloadBlob(generated, without_extension + '.zip');
    } catch (e) {
      console.warn("Failed to build zip.", e);
    } finally {
      this.setState({ generating_files: false });
    }
  };  

  onRepresentationAdd = (type: ViableRepresentation) => {
    const cmp_aa = this.state.all_atom_ngl!;
    const cmp_coarse = this.state.coarse_grain_ngl!;

    this.setState({
      representations: [...this.state.representations, type],
      all_atom_representations: [
        ...this.state.all_atom_representations,
        cmp_aa.addRepresentation(type, {
          visible: this.state.all_atom_visible,
          opacity: this.state.all_atom_opacity,
        }),
      ],
      coarse_grain_representations: [
        ...this.state.coarse_grain_representations,
        cmp_coarse.addRepresentation(type, {
          visible: this.state.coarse_grain_visible,
          opacity: this.state.coarse_grain_opacity,
        }),
      ],
    });
  };

  onRepresentationRemove = (type: ViableRepresentation) => {
    const cmp_aa = this.state.all_atom_ngl!;
    const cmp_coarse = this.state.coarse_grain_ngl!;

    const current_all = this.state.all_atom_representations;
    for (const repr of current_all.filter(e => e.name === type)) {
      cmp_aa.removeRepresentation(repr);
    }

    const current_coarse = this.state.coarse_grain_representations;
    for (const repr of current_coarse.filter(e => e.name === type)) {
      cmp_coarse.removeRepresentation(repr);
    }

    this.setState({
      representations: this.state.representations.filter(e => e !== type),
      all_atom_representations: current_all.filter(e => e.name !== type),
      coarse_grain_representations: current_coarse.filter(e => e.name !== type),
    });
  };

  onRepresentationChange = (_: any, values: ViableRepresentation[]) => {
    const actual = this.state.representations;

    for (const value of values) {
      if (!actual.find(e => e === value)) {
        // new value !
        this.onRepresentationAdd(value);
      }
    }

    for (const val of actual) {
      if (!values.find(e => e === val)) {
        // value deleted !
        this.onRepresentationRemove(val);
      }
    }
  };

  onThemeChange = () => {
    const is_dark = this.state.theme.palette.type === 'dark';

    this.changeTheme(is_dark ? 'light' : 'dark');
  };

  onMoleculeStash = () => {
    // Save the current molecule
    this.setState({ saver_modal: this.state.all_atom_pdb!.name.split('.')[0] })
  };

  onWantReset = () => {
    this.setState({
      want_reset: true
    });
  };

  onWantResetCancel = () => {
    this.setState({ want_reset: false });
  };

  onWantGoBack = (e: React.MouseEvent) => {
    // Don't go to #!
    e.preventDefault();

    this.setState({
      want_go_back: true
    });
  };

  onWantGoBackCancel = () => {
    this.setState({ want_go_back: false });
  };

  onGoBack = () => {
    // Click on the hidden link
    this.go_back_btn.current.click();
  };


  /* RENDERING */

  allAtomLoading() {
    return (
      <div>
        <Marger size="2rem" />

        <Typography>
          Reading PDB file...
        </Typography>

        <Marger size=".5rem" />

        <Typography variant="body2" color="textSecondary">
          This should be fast.
        </Typography>
      </div>
    );
  }

  allAtomPdbLoader() {
    return (
      <div style={{ textAlign: 'center' }}>
        <Marger size="2rem" />

        {this.state.error && <Typography variant="body1" color="error">
          Your file seems invalid: {" "}
          {this.state.error}
        </Typography>}

        <Typography>
          Please load your all atom PDB here to start.
        </Typography>

        <Marger size="1rem" />

        <Typography variant="body2">
          Here, you can transform a all atom molecule, stored in a PDB file format, in a coarse-grained file.
          You will have access to a generated PDB, with required ITP and TOP files in order to use the it in GROMACS.
        </Typography>

        <Marger size="2rem" />

        <div style={{ textAlign: 'center' }}>
          <Button variant="outlined" color="primary" onClick={() => { (this.root.current!.querySelector('input[type="file"]') as HTMLInputElement).click(); }}>
            Load all atom PDB
          </Button>
          <input type="file" style={{ display: 'none' }} onChange={this.allAtomPdbChange} />
        </div>

        <Marger size="2rem" />

        <Divider />

        <Marger size="1rem" />

        <StashedBuild onSelect={uuid => this.load(uuid)} />
      </div>
    );
  }

  martinizeForm() {
    const force_fields = Settings.martinize_variables.force_fields.map(e => ({ id: e, name: e }));

    return (
      <div>
        <Marger size="1rem" />

        {this.state.running === 'martinize_error' && this.state.error && <React.Fragment>

          <Typography color="error">
            Unable to proceed your molecule: {" "}
            <strong>
              {ApiHelper.isApiError(this.state.error) ? errorToText(this.state.error) : "Unknown error."}
            </strong>
            
            <br />
            This error will be reported.
          </Typography>
          
        </React.Fragment>}

        <Marger size="1rem" />

        <Typography variant="h6" align="center">
          Select your coarse graining settings
        </Typography>

        <Marger size="1rem" />

        <Grid component="form" container onSubmit={this.handleMartinizeBegin}>
          <Grid item sm={12}>
            <SimpleSelect 
              formControlClass={this.props.classes.form}
              label="Force field"
              values={force_fields}
              id="builder_ff"
              value={this.state.builder_force_field}
              onChange={e => this.setState({ builder_force_field: e })}
            />
          </Grid>

          <Marger size="1rem" />

          <Grid item sm={12}>
            <SimpleSelect 
              formControlClass={this.props.classes.form}
              label="Position restrains"
              values={[{ id: 'none', name: 'None' }, { id: 'all', name: 'All' }, { id: 'backbone', name: 'Backbone' }]}
              id="builder_position_restrains"
              value={this.state.builder_positions}
              onChange={e => this.setState({ builder_positions: e as any })}
            />
          </Grid>

          <Marger size="1rem" />

          <Grid item sm={12}>
            <SimpleSelect 
              formControlClass={this.props.classes.form}
              label="Mode"
              values={[{ id: 'classic', name: 'Classic' }, { id: 'elastic', name: 'Elastic' }, { id: 'go', name: 'Virtual Go Sites' }]}
              id="builder_mode"
              value={this.state.builder_mode}
              onChange={e => this.setState({ builder_mode: e as any })}
            />
          </Grid>

          {this.state.builder_mode === 'elastic' && this.martinizeElasticForm()}

          <Marger size="2rem" />

          <Box width="100%" justifyContent="space-between" display="flex">
            <Button variant="outlined" color="secondary" type="button" onClick={() => this.reset()}>
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

  martinizeElasticForm() {
    return (
      <React.Fragment>
        <Grid item xs={12} sm={6} className={this.props.classes.formContainer}>
          <TextField 
            variant="outlined"
            className={this.props.classes.textField}
            label="Force constant"
            type="number"
            value={this.state.builder_ef}
            onChange={e => this.setState({ builder_ef: e.target.value })}
          />
        </Grid>

        <Grid item xs={12} sm={6} className={this.props.classes.formContainer}>
          <TextField 
            variant="outlined"
            className={this.props.classes.textField}
            label="Lower cutoff"
            type="number"
            value={this.state.builder_el}
            onChange={e => this.setState({ builder_el: e.target.value })}
          />
        </Grid>

        <Grid item xs={12} sm={6} className={this.props.classes.formContainer}>
          <TextField 
            variant="outlined"
            className={this.props.classes.textField}
            label="Upper cutoff"
            type="number"
            value={this.state.builder_eu}
            onChange={e => this.setState({ builder_eu: e.target.value })}
          />
        </Grid>

        <Grid item xs={12} sm={6} className={this.props.classes.formContainer}>
          <TextField 
            variant="outlined"
            className={this.props.classes.textField} 
            label="Decay factor a"
            type="number"
            value={this.state.builder_ea}
            onChange={e => this.setState({ builder_ea: e.target.value })}
          />
        </Grid>

        <Grid item xs={12} sm={6} className={this.props.classes.formContainer}>
          <TextField 
            variant="outlined"
            className={this.props.classes.textField}
            label="Decay power p"
            type="number"
            value={this.state.builder_ep}
            onChange={e => this.setState({ builder_ep: e.target.value })}
          />
        </Grid>

        <Grid item xs={12} sm={6} className={this.props.classes.formContainer}>
          <TextField 
            variant="outlined"
            className={this.props.classes.textField}
            label="Minimum force"
            type="number"
            value={this.state.builder_em}
            onChange={e => this.setState({ builder_em: e.target.value })}
          />
        </Grid>
      </React.Fragment>
    );
  }

  martinizeGenerating() {
    return (
      <div style={{ textAlign: 'center' }}>
        <Marger size="2rem" />

        <CircularProgress size={56} />
        <Marger size="1rem" />


        <Typography variant="h6">
          Generating coarse grained structure...
        </Typography>
        <Marger size="1rem" />

        <Typography color="textSecondary">
          This might take a while.
        </Typography>
      </div>
    );
  }

  /** Happening when molecule is ready, and the two coarse grain + all atom models are showed. */
  generated() {
    return (
      <React.Fragment>
        {this.wantResetModal()}

        <Marger size="1rem" />

        <Button 
          style={{ width: '100%' }} 
          color="primary" 
          onClick={this.onWantReset}
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
              control={<Switch checked={this.state.theme.palette.type === 'dark'} onChange={this.onThemeChange} value="dark" />}
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
          value={this.state.all_atom_opacity * 100}
          valueLabelDisplay="auto"
          step={10}
          marks
          min={10}
          max={100}
          onChange={this.onAllAtomOpacityChange}
          color="secondary"
        />

        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={<Switch checked={this.state.all_atom_visible} onChange={this.onAllAtomVisibilityChange} value="visible" />}
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
          value={this.state.coarse_grain_opacity * 100}
          valueLabelDisplay="auto"
          step={10}
          marks
          min={10}
          max={100}
          onChange={this.onCoarseGrainedOpacityChange}
          color="secondary"
        />

        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={<Switch checked={this.state.coarse_grain_visible} onChange={this.onCoarseGrainedVisibilityChange} value="visible" />}
              label="Visible"
            />
          </FormGroup>
        </FormControl>

        <Marger size="1rem" />

        <Typography variant="h6">
          Representations
        </Typography>

        <Marger size=".5rem" />

        <div>
          {/* 'ball+stick' | 'ribbon' | 'surface' | 'hyperball' | 'line' */}
          <ToggleButtonGroup
            value={this.state.representations}
            onChange={this.onRepresentationChange}
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
            disabled={this.state.saved}
            onClick={this.onMoleculeStash}
          >
            <FaIcon save /> <span style={{ marginLeft: '.6rem' }}>Save</span>
          </Button>

          <Marger size="1rem" />

          <Button 
            style={{ width: '100%' }} 
            color="primary" 
            disabled={this.state.generating_files}
            onClick={this.onMoleculeDownload}
          >
            <FaIcon download /> <span style={{ marginLeft: '.6rem' }}>Download</span>
          </Button>
        </Box>


      </React.Fragment>
    );
  }

  wantResetModal() {
    return (
      <Dialog open={this.state.want_reset} onClose={this.onWantResetCancel}>
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
          <Button color="primary" onClick={this.onWantResetCancel}>Cancel</Button>
          <Button color="secondary" onClick={() => this.reset()}>Restart builder</Button>
        </DialogActions>
      </Dialog>
    );
  }

  renderModalBackToDatabase() {
    return (
      <Dialog open={!!this.state.want_go_back} onClose={this.onWantGoBackCancel}>
        <DialogTitle>
          Get back to database ?
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            You will definitively lose unsaved changes made into Molecule Builder.
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button color="primary" onClick={this.onWantGoBackCancel}>Cancel</Button>
          <Button color="secondary" onClick={this.onGoBack}>Go back</Button>
        </DialogActions>
      </Dialog>
    )
  }

  render() {
    const classes = this.props.classes;
    const is_dark = this.state.theme.palette.type === 'dark';

    return (
      <ThemeProvider theme={this.state.theme}>
        {this.renderModalBackToDatabase()}

        <MoleculeSaverModal 
          open={!!this.state.saver_modal} 
          onClose={() => this.setState({ saver_modal: false })}
          onConfirm={name => this.save(name)}
          defaultName={this.state.saver_modal || ""}
        />

        <Grid 
          container 
          component="main" 
          className={classes.root} 
          ref={this.root} 
          style={{ backgroundColor: this.state.theme.palette.background.default }}
        >
          <Grid item sm={8} md={4} component={Paper} elevation={6} className={classes.side} style={{ backgroundColor: is_dark ? '#232323' : '' }} square>
            <div className={classes.paper}>
              <div className={classes.header}>
                <Typography component="h1" variant="h3" align="center" style={{ fontWeight: 700, fontSize: '2.5rem', marginBottom: '1rem' }}>
                  Build a molecule
                </Typography>

                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <Link 
                    href="#!" 
                    // When state is initial state (main loader), don't show the confirm modal
                    onClick={this.state.running !== 'pdb' ? this.onWantGoBack : this.onGoBack}  
                  >
                    <FaIcon arrow-left style={{ fontSize: '1rem' }} /> 
                    <span style={{ marginLeft: '.7rem', fontSize: '1.1rem' }}>
                      Back to MArtinize Database
                    </span>
                  </Link>

                  <RouterLink ref={this.go_back_btn} to="/" style={{ display: 'none' }} />
                </div>

                <Divider />
              </div>

              {/* Forms... */}
              {this.state.running === 'pdb' && this.allAtomPdbLoader()}

              {this.state.running === 'pdb_read' && this.allAtomLoading()}

              {(this.state.running === 'martinize_params' || this.state.running === 'martinize_error') && this.martinizeForm()}

              {this.state.running === 'martinize_generate' && this.martinizeGenerating()}

              {this.state.running === 'done' && this.generated()}
            </div>
          </Grid>

          <Grid item sm={4} md={8}>
            <div id="ngl-stage" style={{ height: 'calc(100% - 5px)' }} />
          </Grid>
        </Grid>
      </ThemeProvider>
    );
  }
}

export default withStyles(theme => ({
  root: {
    height: '100vh',
  },
  paper: {
    margin: theme.spacing(8, 4),
    marginTop: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  header: {
    marginTop: '2rem',
    width: '100%',
  },
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
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  side: {
    zIndex: 3,
    overflow: 'auto', 
    maxHeight: '100vh',
  },
}))(withTheme(MartinizeBuilder));

function MoleculeSaverModal(props: { 
  defaultName: string,
  open: boolean, 
  onConfirm: (name: string) => void, 
  onClose: () => void, 
}) {
  const [name, setName] = React.useState(props.defaultName);

  React.useEffect(() => {
    setName(props.defaultName);
  }, [props.defaultName]);

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>
        Save this molecule
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          You're about to save your molecule.
          Please specify a save name.
        </DialogContentText>
       
        <form onSubmit={e => { e.preventDefault(); props.onConfirm(name); }}>
          <TextField
            value={name}
            onChange={e => setName(e.target.value)}
            variant="outlined"
            style={{ width: '100%' }}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose} color="secondary">
          Cancel
        </Button>

        <Button onClick={() => props.onConfirm(name)} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function martinizeOutputParser(input: string) : { pdb: MartinizeFile, top: MartinizeFile, itps: MartinizeFile[], radius: { [name: string]: number } } {
  return JSON.parse(
    input, 
    function (key, value) {
      if (key === 'content' && typeof value === 'string') {
        // this refers to object in reviver that contains the {key} property 
        // We can create a File object (that extends Blob)
        if ('type' in this && 'name' in this) {
          return new File([value], this.name, { type: this.type });
        }

        // Convert to blob
        return new Blob([value]);
      } 

      return value;
    }
  );
}

// @ts-ignore
window.Buffer = Buffer;
