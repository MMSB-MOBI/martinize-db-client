import React from 'react';
import * as ngl from '@mmsb/ngl';
import { withStyles, ThemeProvider, Theme, withTheme, Grid, Link, Typography, Paper, Divider, createMuiTheme, Dialog, DialogTitle, DialogContent, DialogContentText, Button, DialogActions, Box, CircularProgress, FormControl, FormGroup, FormControlLabel, Switch, Slider, Checkbox } from '@material-ui/core';
import { Link as RouterLink } from 'react-router-dom';
import { FaIcon, setPageTitle, Marger, downloadBlob } from '../../helpers';
import { blue } from '@material-ui/core/colors';
import MoleculeChooser, { MoleculeWithFiles } from './MembraneBuilder/MoleculeChooser';
import LipidChooser, { ChoosenLipid } from './MembraneBuilder/LipidChooser';
import SettingsChooser, { SettingsInsane } from './MembraneBuilder/SettingsChooser';
import ApiHelper from '../../ApiHelper';
import NglWrapper, { NglRepresentation } from './NglWrapper';
import BallAndStickRepresentation from '@mmsb/ngl/declarations/representation/ballandstick-representation';
import { toast } from '../Toaster';
import JSZip from 'jszip';

// @ts-ignore
window.NGL = ngl;

interface InsaneResult {
  water: File;
  no_water: File;
  top: File;
  itps: File[];
}

interface ToBeFile {
  name: string;
  content: string;
  type: string;
}

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
  lipids?: { lower: ChoosenLipid[], upper?: ChoosenLipid[] };
  settings?: SettingsInsane;

  insane_error?: any;
  result?: InsaneResult;
  opacity: number;
  want_close_result: boolean;
  generating_files: boolean;
  with_water: boolean;
}

class MembraneBuilder extends React.Component<MBuilderProps, MBuilderState> {
  state: MBuilderState;
  
  ngl!: NglWrapper;
  representation?: NglRepresentation<BallAndStickRepresentation>;
  go_back_btn = React.createRef<any>();

  constructor(props: MBuilderProps) {
    super(props);

    this.state = this.original_state;
  }

  componentDidMount() {
    // Init ngl stage
    setPageTitle('Membrane Builder');
    // @ts-ignore
    window.MembraneBuilder = this;

    this.ngl = new NglWrapper("ngl-stage", { backgroundColor: this.props.theme.palette.background.default });
  }

  get original_state() : MBuilderState {
    return {
      theme: this.createTheme('light'),
      running: 'choose_molecule',
      modal_select_molecule: false,
      want_go_back: false,
      molecule: undefined,
      lipids: undefined,
      insane_error: undefined,
      result: undefined,
      opacity: 1,
      want_close_result: false,
      generating_files: false,
      with_water: false,
    };
  }

  /* INDEPENDANT CLASS METHODS */

  createTheme(hint: 'light' | 'dark') {
    const bgclr = hint === 'dark' ? '#303030' : '#fafafa';

    return createMuiTheme({
      palette: {
        type: hint,
        background: {
          default: bgclr,
        },
        primary: hint === 'dark' ? { main: blue[600] } : undefined,
      },
    });
  }

  changeTheme(hint: 'light' | 'dark') {
    const theme = this.createTheme(hint);

    this.setState({ theme });

    // Change color of ngl stage
    this.ngl.set({ backgroundColor: theme.palette.background.default });
  }

  protected parseToBeFile(file: ToBeFile) {
    return new File([file.content], file.name, { type: file.type });
  }

  parseInsaneResult(res: { water: ToBeFile, no_water: ToBeFile, top: ToBeFile, itps: ToBeFile[] }) {
    return {
      water: this.parseToBeFile(res.water),
      no_water: this.parseToBeFile(res.no_water),
      top: this.parseToBeFile(res.top),
      itps: res.itps.map(this.parseToBeFile),
    };
  }

  initNglWithResult(result: InsaneResult, mode: 'water' | 'no_water') {
    this.ngl.reset();

    this.ngl.load(result[mode])
      .then(component => {
        const repr = component.add<BallAndStickRepresentation>('ball+stick');
        this.representation = repr;
        component.center();
      });
  }

  setOpacity(opacity: number) {
    opacity = opacity > 1 ? opacity / 100 : opacity;

    if (this.representation)
      this.representation.set({ opacity });
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

  startInsane = async () => {
    const { settings, lipids, molecule } = this.state;
    const parameters: any = {};

    if (!molecule || !settings || !lipids) {
      return;
    }

    if (lipids.upper) {
      parameters.upper_leaflet = lipids.upper.map(e => `${e.name}:${e.ratio}`).join(',');
    }
    parameters.lipids = lipids.lower.map(e => `${e.name}:${e.ratio}`).join(',');
    
    if (typeof molecule === 'string') {
      parameters.from_id = molecule;
    }
    else {
      parameters.pdb = molecule.pdb;
      parameters.top = molecule.top;
      parameters.itp = molecule.itps;
      parameters.force_field = molecule.force_field;
    }

    if (settings.box_size) {
      parameters.box = settings.box_size.join(',');
    }
    if (settings.box_type) {
      parameters.pbc = settings.box_type;
    }
    
    try {
      const res = await ApiHelper.request('molecule/membrane_builder', {
        parameters, body_mode: 'multipart', method: 'POST',
      });

      const result = this.parseInsaneResult(res);

      this.initNglWithResult(result, 'no_water');

      this.setState({ 
        running: 'visualization', 
        result, 
      });
    } catch (e) {
      this.setState({ insane_error: e, running: 'choose_settings' });
    }
  };

  onThemeChange = () => {
    const is_dark = this.state.theme.palette.type === 'dark';

    this.changeTheme(is_dark ? 'light' : 'dark');
  };

  onOpacityChange = (_: any, value: number | number[]) => {
    if (Array.isArray(value)) {
      value = value[0];
    }

    this.setState({
      opacity: value / 100
    });

    this.setOpacity(value);
  };

  onWantCloseResultCancel = () => {
    this.setState({ want_close_result: false });
  };

  onWantCloseResultOpen = () => {
    this.setState({ want_close_result: true });
  };

  onWantCloseResult = () => {
    this.ngl.reset();
    this.setState({ 
      want_close_result: false, 
      result: undefined, 
      running: 'choose_settings', 
      opacity: 1,
      with_water: false,
    });
  };

  onMembraneDownload = async () => {
    this.setState({ generating_files: true });

    if (!this.state.result) {
      return;
    }

    try {
      const zip = new JSZip();

      const { water, top, itps } = this.state.result;

      zip.file(water.name, water);
      zip.file(top.name, top);
      
      for (const itp of itps) {
        zip.file(itp.name, itp);
      }

      const blob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      downloadBlob(blob, "membrane.zip");
    } catch (e) {
      toast("Unable to generate files.");
    } finally {
      this.setState({ generating_files: false });
    }
  };

  onWaterChange = (_: any, checked: boolean) => {
    if (checked) {
      this.initNglWithResult(this.state.result!, 'water');
    }
    else {
      this.initNglWithResult(this.state.result!, 'no_water');
    }

    this.setState({ with_water: checked });
  };

  /* RENDER FUNCTIONS */

  renderInsaneBackModal() {
    return (
      <Dialog open={this.state.want_close_result} onClose={this.onWantCloseResultCancel}>
        <DialogTitle>
          Go back to build settings ?
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            You will loose the generated membrane.
          </DialogContentText>
          <DialogContentText>
            You can still rebuild the same membrane again with sent files.
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button color="primary" onClick={this.onWantCloseResultCancel}>Cancel</Button>
          <Button color="secondary" onClick={this.onWantCloseResult}>Back to settings</Button>
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
            You will definitively lose unsaved changes made into Membrane Builder.
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
        onLipidChoose={lipids => {
          // Next page: settings
          this.setState({ running: 'choose_settings', lipids });
        }}
        onPrevious={() => {
          this.setState({ 
            running: 'choose_molecule', 
          });
        }}
      />
    );
  }

  renderChooseSettings() {
    return (
      <SettingsChooser 
        onSettingsChoose={settings => {
          this.setState({
            running: 'insane_wait', settings,
          }, this.startInsane);
        }}
        onPrevious={() => {
          this.setState({ 
            running: 'choose_lipids',
          });
        }}
      />
    );
  }

  renderWaitForInsane() {
    return (
      <Box display="flex" alignItems="center" flexDirection="column">
        <Marger size="2rem" />
        
        <CircularProgress size={56} />

        <Marger size="2rem" />

        <Typography>
          <strong>
            Making the membrane...
          </strong>
        </Typography>

        <Marger size=".5rem" />

        <Typography color="textSecondary" variant="body2">
          This may take a while.
        </Typography>
      </Box>
    );
  }

  renderGenerated() {
    return (
      <Box display="flex" alignItems="center" flexDirection="column">
        {this.renderInsaneBackModal()}

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

        {/* Water */}
        <Typography variant="h6">
          Water
        </Typography>
        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={<Checkbox value="water" checked={this.state.with_water} onChange={this.onWaterChange} />}
              label="Show water"
            />
          </FormGroup>
        </FormControl>

        <Marger size="2rem" />

        {/* Opacity settings */}
        <Typography variant="h6">
          Opacity
        </Typography>

        <Slider
          value={this.state.opacity * 100}
          valueLabelDisplay="auto"
          step={10}
          marks
          min={10}
          max={100}
          onChange={this.onOpacityChange}
          color="secondary"
        />

        <Marger size="1rem" />

        <Divider style={{ width: '100%' }} />

        <Marger size="1rem" />

        <Box alignContent="center" justifyContent="center" width="100%">
          <Button 
            style={{ width: '100%' }} 
            color="secondary" 
            onClick={this.onWantCloseResultOpen}
          >
            <FaIcon arrow-left /> <span style={{ marginLeft: '.6rem' }}>Back</span>
          </Button>

          <Marger size="1rem" />

          <Button 
            style={{ width: '100%' }} 
            color="primary" 
            onClick={this.onMembraneDownload}
            disabled={this.state.generating_files}
          >
            <FaIcon download /> <span style={{ marginLeft: '.6rem' }}>Download</span>
          </Button>
        </Box>

      </Box>
    );
  }
  
  render() {
    const classes = this.props.classes;
    const is_dark = this.state.theme.palette.type === 'dark';

    const displays = {
      lipids: this.state.running === 'choose_lipids',
      settings: this.state.running === 'choose_settings',
    };

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

              {/* Programmatic renders */}
              {this.state.running === 'choose_molecule' && this.renderChooseMolecule()}
              {this.state.running === 'insane_wait' && this.renderWaitForInsane()}
              {this.state.running === 'visualization' && this.renderGenerated()}

              {/* Systematic renders */}
              <div style={{ display: displays.lipids ? undefined : 'none' }}>
                {this.renderChooseLipids()}
              </div>

              <div style={{ display: displays.settings ? undefined : 'none' }}>
                {this.renderChooseSettings()}
              </div>
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
