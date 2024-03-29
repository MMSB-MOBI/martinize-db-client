import React from 'react';
import * as ngl from '@mmsb/ngl';
import { withStyles, ThemeProvider, Theme, withTheme, Grid, Link, Typography, Paper, Divider, createMuiTheme, Dialog, DialogTitle, DialogContent, DialogContentText, Button, DialogActions, Box, CircularProgress, FormControl, FormGroup, FormControlLabel, Switch, Slider, Checkbox, FormLabel, Radio, RadioGroup } from '@material-ui/core';
import { Link as RouterLink } from 'react-router-dom';
import { FaIcon, setPageTitle, Marger, downloadBlob, getErrorMsgFromValidationError } from '../../helpers';
import { blue } from '@material-ui/core/colors';
import MoleculeChooser, { MoleculeWithFiles } from './MembraneBuilder/MoleculeChooser';
import LipidChooser, { ChoosenLipid } from './MembraneBuilder/LipidChooser';
import SettingsChooser, { SettingsInsane } from './MembraneBuilder/SettingsChooser';
import ApiHelper from '../../ApiHelper';
import NglWrapper, { NglRepresentation, NglComponent } from './NglWrapper';
import BallAndStickRepresentation from '@mmsb/ngl/declarations/representation/ballandstick-representation';
import { toast } from '../Toaster';
import JSZip from 'jszip';
import { AvailableForceFields, Molecule } from '../../types/entities';
import { Alert, AlertTitle } from '@material-ui/lab';
import { BetaWarning, SimpleSelect } from '../../Shared'; 
import EmbeddedError from '../Errors/Errors';
import Settings, { LoginStatus } from '../../Settings';
import {itpBeads} from './BeadsHelper'



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

  molecule?: Molecule | MoleculeWithFiles;
  lipids?: { lower?: ChoosenLipid[], upper?: ChoosenLipid[] };
  settings?: SettingsInsane;

  insane_error?: any;
  result?: InsaneResult;
  box_opacity: number;
  want_close_result: boolean;
  generating_files: boolean;
  with_water: boolean;
  box_visible: boolean;
  box_break: boolean;

  available_lipids: string[];
  no_lipid: boolean;

  ph_upp: number;
  ph_low: number;

  addMolecule: string;
  addLipids: boolean;
  ff: string;
}

function isMolecule(data: any) : data is Molecule {
  return 'last_update' in data;
}

class MembraneBuilder extends React.Component<MBuilderProps, MBuilderState> {
  state: MBuilderState;
  
  ngl!: NglWrapper;
  representation?: NglRepresentation<BallAndStickRepresentation>;
  beadsComponent?:NglComponent
  box?: [NglComponent, NglRepresentation<ngl.BufferRepresentation>];
  go_back_btn = React.createRef<any>();

  constructor(props: MBuilderProps) {
    super(props);

    this.state = this.original_state;
  }

  async componentDidMount() {
    // Init ngl stage
    setPageTitle('System Builder');
    if (Settings.logged === LoginStatus.None) {
      return;
    }

    // @ts-ignore
    window.MembraneBuilder = this;

    this.ngl = new NglWrapper("ngl-stage", { backgroundColor: this.props.theme.palette.background.default });

    try {
      const lipids: string[] = await ApiHelper.request('settings/lipids');
      this.setState({ available_lipids: lipids });
    } catch (e) {
      toast("Unable to fetch available lipids.", "error");
    }
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
      box_opacity: .3,
      want_close_result: false,
      generating_files: false,
      with_water: false,
      available_lipids: [],
      no_lipid: false,
      box_visible: true,
      box_break: false,
      ph_upp: 7,
      ph_low: 7,
      addMolecule: "true",
      addLipids: true,
      ff: 'martini3001',
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

  async initNglWithResult(result: InsaneResult, mode: 'water' | 'no_water', builder_mode?: string) {
    this.ngl.reset();
    const polarizableFF = Settings.martinize_variables.force_fields_info[this.state.ff].polarizable
    const beads = await itpBeads(result.top, result.itps, polarizableFF, builder_mode)
    this.ngl.load(result[mode], {coarse_grained:true})
      .then(component => {
        this.beadsComponent = component
        const repr = component.add<BallAndStickRepresentation>('ball+stick', {}, {radius : false, color: true, beads, ff: this.state.ff as AvailableForceFields, radiusFactor: 0.2});
        this.beadsComponent.martiniSchemes.getProteinRadiusScheme(this.state.ff as AvailableForceFields, beads) //init radius scheme for toggling later
        this.representation = repr;
        component.center();

        // Init box
        const shape = repr.createShapeFromBox();
        if (shape) {
          if (!this.state.box_break && repr.hasAtomOuterTheBox()) {
            toast("Built membrane exceed box boundaries. Please check your box settings.", "warning");
            this.setState({ box_break: true });
          }

          const component = this.ngl.add(shape);
          const representation = component.add<ngl.BufferRepresentation>('buffer', { opacity: .3 });

          this.box = [component, representation];
          
        }
      });
  }

  setOpacity(opacity: number) {
    opacity = opacity > 1 ? opacity / 100 : opacity;

    if (this.box)
      this.box[1].set({ opacity });
  }

  setVisible(hint: boolean) {
    if (this.box)
      this.box[1].visible = hint;
  }

  toggleMartiniRadius(apply:boolean) {
     if(apply){
       const params = {radiusType : "data", radiusData : this.beadsComponent?.martiniSchemes.applyRadiusFactor(this.state.ff as AvailableForceFields, 0.2)}
       this.representation?.set(params)
     }
     else { //ngl default radius params
        const params = {radiusType : "size"}
        this.representation?.set(params)
     }
  }

  async downloadLipids(force_field: string) {
    this.setState({ available_lipids: [], no_lipid: false });

    try {
      const lipids: string[] = await ApiHelper.request('settings/lipids', { parameters: { force_field } });
      this.setState({ 
        available_lipids: lipids, 
        no_lipid: lipids.length === 0, 
      });
    } catch (e) {
      toast("Unable to fetch available lipids.", "error");
    }
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
    const { settings, lipids, molecule, ph_upp, ph_low } = this.state;
    const parameters: any = {};

    if ((!molecule && this.state.addMolecule === "true") || !settings || (!lipids && this.state.addLipids)) {
      return;
    }

    parameters.lipids_added = this.state.addLipids;
    parameters.molecule_added = this.state.addMolecule;

    if (this.state.addLipids){
      //@ts-ignore
      if (lipids.upper) {
        //@ts-ignore
        parameters.upper_leaflet = lipids.upper.map(e => `${e.name}:${e.ratio}`).join(',');
      }
      //@ts-ignore
      parameters.lipids = lipids.lower.map(e => `${e.name}:${e.ratio}`).join(',');
    }

    if (this.state.addMolecule === "true"){
      if (isMolecule(molecule)) {
        parameters.from_id = molecule.id;
      }
      else { //it's multer params, I think
        //@ts-ignore
        parameters.pdb = molecule.pdb;
        //@ts-ignore
        parameters.top = molecule.top;
        //@ts-ignore
        parameters.itp = molecule.itps;
        //@ts-ignore
        parameters.force_field = molecule.force_field;
      }
    }
    else {
      parameters.force_field = this.state.ff;
    }

    parameters.box = settings.box_size.join(',');
    parameters.pbc = settings.box_type;

    // Area params
    parameters.area_per_lipid = settings.area_per_lipid;
    if (settings.area_per_lipid_upper)
      parameters.area_per_lipid_upper = settings.area_per_lipid_upper;

    // Add every number parameter
    parameters.bead_distance = settings.bead_distance;
    parameters.fudge = settings.fudge_factor;
    parameters.grid_spacing = settings.grid_spacing_orientation;
    parameters.hydrophobic_ratio = settings.hydrophobic_ratio;
    parameters.random_kick_size = settings.random_kick_size;
    parameters.shift_protein = settings.shift_protein;

    // Rotate params
    parameters.rotate = settings.rotate_mode;
    if (settings.rotate_angle)
      parameters.rotate_angle = settings.rotate_angle;

    // Boolean params
    if(this.state.addMolecule === "true" && this.state.addLipids) {
      if (settings.center_protein)
        parameters.center = "true";
      if (settings.orient_protein)
        parameters.orient = "true";
    }

    // Water, salt and solvent related params
    parameters.salt_concentration = settings.salt_concentration;
    parameters.charge = settings.charge;
    parameters.solvent_type = settings.solvent_type;

    try {
      const res = await ApiHelper.request('molecule/membrane_builder', {
        parameters, body_mode: 'multipart', method: 'POST',
      });

      const result = this.parseInsaneResult(res);

      this.initNglWithResult(result, 'no_water', molecule?.builder_mode);

      this.setState({ 
        running: 'visualization', 
        result, 
      });
    } catch (e) {
      if (Array.isArray(e) && e[0].status === 400) {
        const error = e[1] as { error: string, trace?: string, zip: number[], errorCode?: string, e?:any, msg?:string };
        
        let msg = ""
        if(e.length > 1 && error.errorCode && error.errorCode === "PARAMS_VALIDATION_ERROR"){
          msg = getErrorMsgFromValidationError(e[1].e)
          error.error = error.errorCode
        }
        
        toast('Run failed.', 'error');

        this.setState({ insane_error: { error: error.error, zip: error.zip, trace: error.trace, msg : msg }, running: 'choose_settings' });
      }
      else {
        this.setState({ insane_error: true, running: 'choose_settings' });
      }
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
      box_opacity: value / 100
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
      box_opacity: .3,
      with_water: false,
      box_break: false,
      box_visible: true,
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

      downloadBlob(blob, "system_CG.zip");
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

  onBoxVisibleChange = (_: any, checked: boolean) => {
    this.setVisible(checked);

    this.setState({ box_visible: checked });
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
            You will lose the generated membrane.
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
            You will definitively lose unsaved changes made into System Builder.
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
      <React.Fragment>
        <Marger size="1rem"/>
        <FormLabel className={this.props.classes.formLabel} component="legend">Do you want to add a molecule ?</FormLabel>
        <RadioGroup className={this.props.classes.radioGroup} row name="scfix" value={this.state.addLipids ? this.state.addMolecule : "false"} onChange={e => this.setState({addMolecule: e.target.value})}>
          <FormControlLabel value="false" control={<Radio />} disabled={!this.state.addLipids} label="no" />
          <FormControlLabel value="true" control={<Radio />} disabled={!this.state.addLipids} label="yes" />
        </RadioGroup>
        {this.state.addMolecule === "false" && <SimpleSelect 
            label="Used force field"
            variant="standard"
            values={Settings.martinize_variables.force_fields.filter(ff => Settings.martinize_variables.force_fields_info[ff].type === "supported").map(e  => ({ id: e, name: e }))}
            id="ff"
            value={this.state.ff}
            onChange={e => this.setState({ff: e})}
            formControlClass={this.props.classes.ff_select}
            required
          />}
        <MoleculeChooser
          Force_field={this.state.ff !== ''}
          AddMolecule={this.state.addMolecule}
          onMoleculeChoose={molecule => {
            this.setState({
              molecule,
              running: 'choose_lipids',
              available_lipids: []
            });
            if( molecule !== undefined){
              this.downloadLipids(molecule.force_field)
              this.setState({ff:molecule.force_field})
            }
            else{
              this.downloadLipids(this.state.ff);
            }
          }}
        />
      </React.Fragment>
    );
  }
  
  renderChooseLipids() {
    return (
      <React.Fragment>
        <Marger size="1rem"/>
        
        {this.state.addMolecule === "true" && <div><FormLabel className={this.props.classes.formLabel} component="legend">Do you want to add lipids ?</FormLabel>
        <RadioGroup className={this.props.classes.radioGroup} row name="scfix" value={this.state.addMolecule === "true" ? this.state.addLipids.toString() : "true"} onChange={e => {this.setState({addLipids: e.target.value === "true" ? true : false})}}>
          <FormControlLabel value="false" control={<Radio />} label="no" />
          <FormControlLabel value="true" control={<Radio />} label="yes" />
        </RadioGroup></div>
        }
        
        <LipidChooser 
          AddLipids={this.state.addLipids}
          onLipidChoose={lipids => {
            // Next page: settings
            this.setState({ running: 'choose_settings', lipids });
          }}
          onPrevious={() => {
            this.setState({ 
              running: 'choose_molecule', 
              addLipids : true, 
              addMolecule : "true",
            });
          }}
          lipids={this.state.available_lipids}
          noLipid={this.state.no_lipid}
          ph_upp={this.state.ph_upp}
          ph_low={this.state.ph_low}
          phUppChange={(_: any, value: number | number[])=> {
            if (Array.isArray(value)) {
              value = value[0];
            }
            this.setState({ph_upp: value});
          }}
          phLowChange={(_: any, value: number | number[])=> {
            if (Array.isArray(value)) {
              value = value[0];
            }
            this.setState({ph_low: value});
          }}
          phLipidsChange={(_: any, value: number | number[])=> {
            if (Array.isArray(value)) {
              value = value[0];
            }
            this.setState({ph_upp: value});
            this.setState({ph_low: value});
          }}
          force_field={this.state.ff}
        />
      </React.Fragment>
    );
  }

  renderChooseSettings() {
    return (
      <SettingsChooser 
        addLipids={this.state.addLipids}
        addMolecule={this.state.addMolecule}
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
        hasUpperLayer={!!this.state.lipids?.upper}
        error={this.state.insane_error}
        forceField={this.state.ff}
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
            Making the system...
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

        {/* Box settings */}
        <Typography variant="h6">
          Box
        </Typography>

        {this.state.box_break && <React.Fragment>
          <Marger size=".5rem" />
          <Alert severity="warning">
            <AlertTitle>Box too small</AlertTitle>
            Some atoms are positionned <strong>outside the box</strong>.
          </Alert>
          <Marger size=".5rem" />
        </React.Fragment>}

        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={<Checkbox value="visible" checked={this.state.box_visible} onChange={this.onBoxVisibleChange} />}
              label="Visible box"
            />
          </FormGroup>
        </FormControl>

        <Marger size=".5rem" />

        <Typography variant="body1" align="center">
          Opacity
        </Typography>

        <Slider
          value={this.state.box_opacity * 100}
          valueLabelDisplay="auto"
          step={10}
          marks
          min={10}
          max={100}
          onChange={this.onOpacityChange}
          color="secondary"
        />

        <Marger size="1rem" />

        <FormControlLabel
            control={<Switch 
              onChange={e => {
                this.toggleMartiniRadius(e.target.checked)}} 
            />}
            label="Apply Martini beads radius (0.2 factor)"
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
            <FaIcon arrow-left /> <span style={{ marginLeft: '.6rem' }}>Build settings</span>
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

    if (Settings.logged === LoginStatus.None) {
      return <EmbeddedError title="Forbidden" text="You can't access the System Builder page without account." />
    }

    return (
      <ThemeProvider theme={this.state.theme}>
        {this.renderModalBackToDatabase()}
        {/*<BetaWarning/>*/}
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
                  System builder
                </Typography>

                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <Link 
                    href="#!" 
                    // When state is initial state (main loader), don't show the confirm modal
                    onClick={this.state.running !== 'choose_molecule' ? this.onWantGoBack : this.onGoBack}  
                  >
                    <FaIcon home style={{ fontSize: '1rem' }} /> 
                    <span style={{ marginLeft: '.7rem', fontSize: '1.1rem' }}>
                      MAD Home
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
  ff_select: {
    width: '100%'
  },
  formLabel: {
    width: "100%",
    textAlign: "center",
    color: "black",
    fontSize: "20px",
    fontWeight: "bold",
  },
  radioGroup: {
    marginLeft: "auto",
    marginRight: "auto",
    width: "10em",
  }
}))(withTheme(MembraneBuilder));
