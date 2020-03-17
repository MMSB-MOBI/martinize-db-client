import React from 'react';
import { withStyles, Grid, Typography, Paper, TextField, Button, withTheme, Theme, CircularProgress, Slider, FormControl, FormGroup, FormControlLabel, Switch, Box, Divider, createMuiTheme, ThemeProvider } from '@material-ui/core';
import { Marger, errorToText, FaIcon, downloadBlob } from '../../helpers';

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

// @ts-ignore
window.NGL = ngl;

interface MartinizeFile {
  name: string;
  content: string;
}

type ViableRepresentation = 'ball+stick' | 'ribbon' | 'surface' | 'spacefill' | 'line';

interface MBProps {
  classes: Record<string, string>;
  theme: Theme;
}

interface MBState {
  running: 'pdb' | 'pdb_read' | 'martinize_params' | 'martinize_generate' | 'martinize_error' | 'done';
  error?: any;

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

  theme: Theme;
}

class MartinizeBuilder extends React.Component<MBProps, MBState> {
  state: MBState = {
    running: 'pdb',
    builder_force_field: 'martini22',
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
  };
  protected ngl_stage?: Stage;

  protected root = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.ngl_stage = new Stage("ngl-stage", { backgroundColor: this.props.theme.palette.background.default });
    // @ts-ignore
    window.MoleculeBuilder = this;
    document.getElementById('ngl-stage')!.addEventListener('wheel', (e) => {
      e.preventDefault();
    }, { passive: false });
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
          primary: {
            main: blue[600]
          },
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
      body_mode: 'multipart'
    }) 
      .then((res: { pdb: MartinizeFile, top: MartinizeFile, itps: MartinizeFile[], radius: { [name: string]: number } }) => {
        const cg_pdb = new Blob([res.pdb.content]);

        // Init PDB scene
        this.initCoarseGrainPdb(cg_pdb, res.radius);
        this.setState({ files: res });
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

      this.ngl_stage!.loadFile(file)
        .then(component => {
          if (component) {
            const repr: RepresentationElement = component.addRepresentation("ball+stick", undefined);

            component.autoView();
    
            // Register the component
            this.setState({
              all_atom_ngl: component,
              all_atom_pdb: file,
              running: 'martinize_params',
              all_atom_representations: [...this.state.all_atom_representations, repr],
            });
          }
        })
        .catch((e: any) => {
          console.error(e);
          this.setState({
            running: 'pdb',
            error: e
          });
        }) 
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
      <div>
        <Marger size="2rem" />

        {this.state.error && <Typography variant="body1" color="error">
          Your file seems invalid: {" "}
          {this.state.error}
        </Typography>}

        <Typography>
          Please load your all atom PDB here to start.
        </Typography>

        <Marger size="2rem" />

        <div style={{ textAlign: 'center' }}>
          <Button variant="outlined" color="primary" onClick={() => { (this.root.current!.querySelector('input[type="file"]') as HTMLInputElement).click(); }}>
            Load all atom PDB
          </Button>
          <input type="file" style={{ display: 'none' }} onChange={this.allAtomPdbChange} />
        </div>
      </div>
    );
  }

  martinizeForm() {
    const force_fields = Settings.martinize_variables.force_fields.map(e => ({ id: e, name: e }));

    return (
      <div>
        <Marger size="2rem" />

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

          <Box width="100%" justifyContent="flex-end" display="flex">
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
        <Marger size="2rem" />

        <Typography variant="h6" color="primary" align="center">
          Your molecule has been successfully generated.
        </Typography>

        <Marger size="2rem" />

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
          {/* 'ball+stick' | 'ribbon' | 'surface' | 'spacefill' | 'line' */}
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
            <ToggleButton value="spacefill">
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

  render() {
    const classes = this.props.classes;
    const is_dark = this.state.theme.palette.type === 'dark';

    return (
      <ThemeProvider theme={this.state.theme}>
        <Grid 
          container 
          component="main" 
          className={classes.root} 
          ref={this.root} 
          style={{ backgroundColor: this.state.theme.palette.background.default }}
        >
          <Grid item sm={8} md={4} component={Paper} elevation={6} style={{ zIndex: 3, backgroundColor: is_dark ? '#232323' : '' }} square>
            <div className={classes.paper}>
              <Typography component="h1" variant="h5">
                Build a molecule
              </Typography>

              {/* Forms... */}
              {this.state.running === 'pdb' && this.allAtomPdbLoader()}

              {this.state.running === 'pdb_read' && this.allAtomLoading()}

              {(this.state.running === 'martinize_params' || this.state.running === 'martinize_error') && this.martinizeForm()}

              {this.state.running === 'martinize_generate' && this.martinizeGenerating()}

              {this.state.running === 'done' && this.generated()}
            </div>
          </Grid>

          <Grid item sm={4} md={8} className={classes.image}>
            <div id="ngl-stage" style={{ height: '99%' }} />
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
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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
}))(withTheme(MartinizeBuilder));
