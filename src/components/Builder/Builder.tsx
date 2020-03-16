import React from 'react';
import { withStyles, Grid, Typography, Paper, TextField, Button, withTheme, Theme, CircularProgress } from '@material-ui/core';
import { Marger, errorToText } from '../../helpers';

import { Stage, Component as NGLComponent } from '@mmsb/ngl';
import * as ngl from '@mmsb/ngl';

import { SimpleSelect } from '../../Shared';
import Settings from '../../Settings';
import ApiHelper from '../../ApiHelper';
import { toast } from '../Toaster';

// @ts-ignore
window.NGL = ngl;

interface MBProps {
  classes: Record<string, string>;
  theme: Theme;
}

interface MBState {
  running: 'pdb' | 'pdb_read' | 'martinize_params' | 'martinize_generate' | 'martinize_error' | 'done';
  error?: any;

  all_atom_pdb?: File;
  all_atom_ngl?: NGLComponent;

  coase_grain_pdb?: Blob;
  coase_grain_ngl?: NGLComponent;

  builder_force_field: string;
  builder_mode: 'go' | 'classic' | 'elastic';
  builder_positions: 'none' | 'all' | 'backbone';
  builder_ef: string;
  builder_el: string;
  builder_eu: string;
  builder_ea: string;
  builder_ep: string;
  builder_em: string;
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

  componentWillUnmount() {

  }

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
      mode: 'text',
      method: 'POST',
      body_mode: 'multipart'
    }) 
      .then((pdb_generated: string) => {
        const cg_pdb = new Blob([pdb_generated]);

        // Init PDB scene
        this.initCoarseGrainPdb(cg_pdb);
      })
      .catch(e => {
        console.log(e);
        if (Array.isArray(e)) {
          const error = JSON.parse(e[1]);

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

  initCoarseGrainPdb(pdb: Blob) {
    this.ngl_stage!.loadFile(pdb, { ext: 'pdb', name: 'coarse_grain.pdb' })
      .then(component => {
        if (component) {
          component.addRepresentation("ball+stick", undefined);
          // component.addRepresentation("cartoon", undefined);
          component.autoView();

          this.state.all_atom_ngl?.eachRepresentation(rep => {
            rep.setParameters({ opacity: .3 });
          });

          // Register the component
          this.setState({
            running: 'done',
            coase_grain_pdb: pdb,
          });
        }
      })
      .catch(e => {
        console.error(e);
        toast("Unable to load generated PDB. Please retry by re-loading the page.");
      });
  }

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
            component.addRepresentation("ball+stick", undefined);
            // component.addRepresentation("cartoon", undefined);
            component.autoView();
    
            // Register the component
            this.setState({
              all_atom_ngl: component,
              all_atom_pdb: file,
              running: 'martinize_params'
            });
          }
        })
        .catch(e => {
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

        <Marger size=".5rem" />

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

          <Button variant="outlined" color="primary" type="submit">
            Submit
          </Button>
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

  generated() {
    return (
      <React.Fragment>
        <Marger size="2rem" />

        <Typography variant="h6" color="primary" align="center">
          Your molecule has been successfully generated.
        </Typography>
      </React.Fragment>
    );
  }

  render() {
    const classes = this.props.classes;

    return (
      <Grid container component="main" className={classes.root} ref={this.root}>
        <Grid item sm={8} md={4} component={Paper} elevation={6} style={{ zIndex: 3 }} square>
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
