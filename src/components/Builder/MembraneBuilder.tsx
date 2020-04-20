import React from 'react';
import * as ngl from '@mmsb/ngl';
import { withStyles, ThemeProvider, Theme, withTheme, Grid, Link, Typography, Paper, Divider, createMuiTheme, Dialog, DialogTitle, DialogContent, DialogContentText, Button, DialogActions } from '@material-ui/core';
import { Link as RouterLink } from 'react-router-dom';
import { FaIcon, setPageTitle } from '../../helpers';
import { blue } from '@material-ui/core/colors';
import MoleculeChooser, { MoleculeWithFiles } from './MembraneBuilder/MoleculeChooser';
import LipidChooser from './MembraneBuilder/LipidChooser';

// @ts-ignore
window.NGL = ngl;

interface MBuilderProps {
  classes: Record<string, string>;
  theme: Theme;
}

interface MBuilderState {
  theme: Theme;
  running: 'choose_molecule' | 'choose_lipids' | 'choose_settings' | 'insane_wait' | 'visualization';
  modal_select_molecule: boolean;
  want_go_back: boolean;

  molecule?: string | MoleculeWithFiles;
}

class MembraneBuilder extends React.Component<MBuilderProps, MBuilderState> {
  state: MBuilderState;
  
  ngl_stage!: ngl.Stage;
  go_back_btn = React.createRef<any>();

  constructor(props: MBuilderProps) {
    super(props);

    this.state = this.original_state;
  }

  componentDidMount() {
    // Init ngl stage
    setPageTitle('Membrane Builder');

    this.ngl_stage = new ngl.Stage("ngl-stage", { backgroundColor: this.props.theme.palette.background.default });
    // @ts-ignore
    window.MembraneBuilder = this;
    document.getElementById('ngl-stage')!.addEventListener('wheel', (e) => {
      e.preventDefault();
    }, { passive: false });
  }

  get original_state() {
    return {
      theme: createMuiTheme({
        palette: {
          type: 'light',
          background: {
            default: '#fafafa',
          },
        },
      }),
      running: 'choose_molecule',
      modal_select_molecule: false,
      want_go_back: false,
      molecule: undefined,
    } as MBuilderState;
  }

  /* INDEPENDANT CLASS METHODS */

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

    // Change color of ngl stage
    this.ngl_stage.setParameters({ backgroundColor: bgclr });
  }

  /* EVENTS */

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

  /* RENDER FUNCTIONS */

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

  renderChooseMolecule() {
    return (
      <MoleculeChooser
        onMoleculeChoose={molecule => {
          this.setState({
            molecule,
            running: 'choose_lipids',
          });
        }}
      />
    );
  }
  
  renderChooseLipids() {
    return (
      <LipidChooser 
        onLipidChoose={() => {

        }}
        onPrevious={() => {
          this.setState({ running: 'choose_molecule', molecule: undefined, })
        }}
      />
    );
  }

  renderChooseSettings() {
    return (
      <div />
    );
  }

  renderWaitForInsane() {
    return (
      <div />
    );
  }

  renderGenerated() {
    return (
      <div />
    );
  }
  
  render() {
    const classes = this.props.classes;
    const is_dark = this.state.theme.palette.type === 'dark';

    return (
      <ThemeProvider theme={this.state.theme}>
        {this.renderModalBackToDatabase()}

        <Grid
          container 
          component="main" 
          className={classes.root} 
          style={{ backgroundColor: this.state.theme.palette.background.default }}
        >
          <Grid item sm={8} md={4} component={Paper} elevation={6} className={classes.side} style={{ backgroundColor: is_dark ? '#232323' : '' }} square>
            <div className={classes.paper}>
              <div className={classes.header}>
                <Typography component="h1" variant="h3" align="center" style={{ fontWeight: 700, fontSize: '2.5rem', marginBottom: '1rem' }}>
                  Membrane builder
                </Typography>

                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <Link 
                    href="#!" 
                    // When state is initial state (main loader), don't show the confirm modal
                    onClick={this.state.running !== 'choose_molecule' ? this.onWantGoBack : this.onGoBack}  
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
              {this.state.running === 'choose_molecule' && this.renderChooseMolecule()}

              {this.state.running === 'choose_lipids' && this.renderChooseLipids()}

              {this.state.running === 'choose_settings' && this.renderChooseSettings()}

              {this.state.running === 'insane_wait' && this.renderWaitForInsane()}

              {this.state.running === 'visualization' && this.renderGenerated()}
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
}))(withTheme(MembraneBuilder));
