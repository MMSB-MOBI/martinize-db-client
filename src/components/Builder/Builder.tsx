import React from 'react';
import { withStyles, Grid, Typography, Paper, TextField, Button, withTheme, Theme, CircularProgress, Slider, FormControl, FormGroup, FormControlLabel, Switch, Box, Divider, createMuiTheme, ThemeProvider, Link, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@material-ui/core';
import { Marger, FaIcon, downloadBlob, setPageTitle, dateFormatter } from '../../helpers';
import { Link as RouterLink } from 'react-router-dom';

import { Stage } from '@mmsb/ngl';
import BallAndStickRepresentation from '@mmsb/ngl/declarations/representation/ballandstick-representation';
import * as ngl from '@mmsb/ngl';

import { SimpleSelect } from '../../Shared';
import Settings from '../../Settings';
import { toast } from '../Toaster';
import { RepresentationParameters } from '@mmsb/ngl/declarations/representation/representation';
import JSZip from 'jszip';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { blue } from '@material-ui/core/colors';
import { applyUserRadius } from '../../nglhelpers';
import StashedBuildHelper, { MartinizeFile, ElasticOrGoBounds, GoMoleculeDetails, GoBoundsDetails } from '../../StashedBuildHelper';
import StashedBuild from './StashedBuild';
import SocketIo from 'socket.io-client';
import { SERVER_ROOT, STEPS } from '../../constants';
import { v4 as uuid } from 'uuid';
import NglWrapper, { NglComponent, ViableRepresentation, NglRepresentation } from './NglWrapper';
import { ItpFile } from 'itp-parser';

// @ts-ignore
window.NGL = ngl;

interface MBProps {
  classes: Record<string, string>;
  theme: Theme;
}

interface MartinizeFiles {
  pdb: MartinizeFile;
  itps: MartinizeFile[];
  radius: { [name: string]: number };
  top: MartinizeFile;
  go_bonds?: ElasticOrGoBounds[];
  elastic_bonds?: ElasticOrGoBounds[];
  go_details?: GoMoleculeDetails;
}

interface AtomRadius { [atom: string]: number }

interface MBState {
  running: 'pdb' | 'pdb_read' | 'martinize_params' | 'martinize_generate' | 'martinize_error' | 'done';
  error?: any;
  martinize_error?: { type?: string, raw_run?: ArrayBuffer, error: string, open?: boolean, stack: string };
  saver_modal: string | false;
  martinize_step: string;

  all_atom_pdb?: File;
  all_atom_ngl?: NglComponent;

  coarse_grain_pdb?: Blob;
  coarse_grain_ngl?: NglComponent;

  virtual_links?: NglComponent;
  virtual_links_repr?: NglRepresentation<ngl.BufferRepresentation>;
  coordinates: [number, number, number][];

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
  virtual_link_opacity: number;
  virtual_link_visible: boolean;
  representations: ViableRepresentation[];
  
  files?: MartinizeFiles;
  generating_files: boolean;
  saved: boolean;
  want_reset: boolean;
  want_go_back: boolean;

  theme: Theme;
}

/**
 * The protein builder.
 */
class MartinizeBuilder extends React.Component<MBProps, MBState> {
  state = this.original_state;

  protected ngl_stage?: Stage;
  protected ngl!: NglWrapper;

  protected root = React.createRef<HTMLDivElement>();
  protected go_back_btn = React.createRef<any>();

  componentDidMount() {
    setPageTitle('Protein Builder');
    // @ts-ignore
    window.MoleculeBuilder = this;

    this.ngl = new NglWrapper("ngl-stage", { backgroundColor: this.props.theme.palette.background.default });
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
      martinize_error: undefined,
      coarse_grain_opacity: 1,
      coarse_grain_visible: true,
      all_atom_visible: true,
      all_atom_opacity: .3,
      virtual_link_opacity: .2,
      virtual_link_visible: true,
      generating_files: false,
      representations: ['ball+stick'],
      theme: this.createTheme('light'),
      saved: false,
      want_reset: false,
      want_go_back: false,
      error: undefined,
      saver_modal: false,
      martinize_step: '',
      virtual_links: undefined,
      virtual_links_repr: undefined,
      coordinates: [],
    };
  }

  protected get available_modes() {
    if (this.state.builder_force_field.includes('martini3')) {
      return [
        { id: 'classic', name: 'Classic' }, { id: 'elastic', name: 'Elastic' }, { id: 'go', name: 'Virtual Go Sites' }
      ];
    }

    return [
      { id: 'classic', name: 'Classic' }, { id: 'elastic', name: 'Elastic' }
    ];
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
      elastic_bonds: this.state.files.elastic_bonds,
      go_bonds: this.state.files.go_bonds,
      go_details: this.state.files.go_details,
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
    const mode = save.elastic_bonds ? 'elastic' : (save.go_bonds ? 'go' : undefined);

    // Init PDB scene
    this.initCoarseGrainPdb({
      pdb: cg_pdb,
      radius: save.radius,
      bonds: save.elastic_bonds ?? save.go_bonds,
      mode,
      go_details: save.go_details,
    });

    this.setState({ 
      files: {
        top: save.top_file,
        itps: save.itp_files,
        pdb: save.coarse_grained,
        radius: save.radius,
        go_bonds: save.go_bonds,
        elastic_bonds: save.elastic_bonds,
      },
      saved: true,
    });
  }

  reset() {
    if (this.ngl)
      this.ngl.reset();
    this.setState(this.original_state);
    this.changeTheme('light');
  }


  /* SET SETTINGS FOR REPRESENTATIONS */

  setCoarseGrainRepresentation(parameters: Partial<RepresentationParameters>) {
    for (const repr of this.state.coarse_grain_ngl!.representations) {
      repr.set(parameters);
    }
  }

  setVirtualLinksRepresentation(parameters: Partial<RepresentationParameters>) {
    if (this.state.virtual_links_repr)
      this.state.virtual_links_repr.set(parameters);
  }

  setAllAtomRepresentation(parameters: Partial<RepresentationParameters>) {
    for (const repr of this.state.all_atom_ngl!.representations) {
      repr.set(parameters);
    }
  }

  setRepresentation(parameters: Partial<RepresentationParameters>) {
    this.setCoarseGrainRepresentation(parameters);
    this.setAllAtomRepresentation(parameters);
  }

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

    this.setState({
      theme
    });

    this.ngl.set({ backgroundColor: theme.palette.background.default });
  }

  async initCoarseGrainPdb(options: { pdb: Blob, radius: AtomRadius, bonds?: ElasticOrGoBounds[], go_details?: GoMoleculeDetails, mode?: 'go' | 'elastic' }) {
    let component: NglComponent;

    // Apply the NGL radius
    applyUserRadius(options.radius);

    try {
      component = await this.ngl.load(options.pdb, { ext: 'pdb', name: 'coarse_grain.pdb' });
    } catch (e) {
      console.error(e);
      toast("Unable to load generated PDB. Please retry by re-loading the page.");
      return;
    }

    const repr = component.add<BallAndStickRepresentation>("ball+stick");
    // repr.name => "ball+stick"

    component.center(500);

    this.setAllAtomRepresentation({ opacity: .3 });

    if (options.bonds && options.mode) {
      const coordinates: [number, number, number][] = [];

      repr.atomIterator(ap => {
        coordinates.push([ap.x, ap.y, ap.z]);
      });

      const { component, representation } = drawBondsInStage(this.ngl, options.bonds, coordinates, options.mode);
      this.setState({ 
        virtual_links: component, 
        virtual_links_repr: representation,
        coordinates
      });
    }

    // Register the component
    this.setState({
      running: 'done',
      coarse_grain_pdb: options.pdb,
      coarse_grain_ngl: component,
    });
  }

  async initAllAtomPdb(file: File) {
    const component = await this.ngl.load(file);

    component.add<BallAndStickRepresentation>("ball+stick");
    component.center();

    // Register the component
    this.setState({
      all_atom_ngl: component,
      all_atom_pdb: file,
    });
  }

  /* ADD OR REMOVE GO BONDS */
  async addOrRemoveGoBond(atom_index_1: number, atom_index_2: number, mode: 'add' | 'remove') {
    const { files, coordinates, virtual_links: links_component } = this.state;

    if (!files || !files.go_bonds || !files.go_details || !links_component) {
      return;
    }

    // Find which molecule type is affected.
    // TODO!!
    // Now, it is just molecule_0
    const mol_name = Object.keys(files.go_details)[0];

    // Find the corresponding ITP
    const itp_index = files.itps.findIndex(e => e.name.startsWith(mol_name + '_go-table_VirtGoSites'));
    
    if (itp_index === -1) {
      console.log("ITP not found");
      return;
    }

    // Read the ITP
    const m_file = files.itps[itp_index];
    const itp_file = ItpFile.readFromString(await m_file.content.text());

    const target_fn = mode === 'add' ? addBond : removeBond;

    const { component, representation, points } = target_fn({
      source: atom_index_1,
      target: atom_index_2,
      itp_file,
      details: files.go_details[mol_name],
      stage: this.ngl,
      points: files.go_bonds,
      coords: coordinates,
      links_component,
    });

    files.go_bonds = points;
    representation.set({ opacity: this.state.virtual_link_opacity });
    representation.visible = this.state.virtual_link_visible;

    // Save the ITP file
    m_file.content = new File([itp_file.toString()], m_file.name, { type: m_file.type });

    this.setState({
      virtual_links: component,
      virtual_links_repr: representation,
    });
  }


  /* EVENTS */

  handleMartinizeBegin = async (e: React.FormEvent<HTMLFormElement>) => {
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

    // form_data.pdb = s.all_atom_pdb;

    this.setState({ 
      running: 'martinize_generate',
      error: undefined,
      martinize_error: undefined,
    });

    // Run via socket.io
    const socket = SocketIo.connect(SERVER_ROOT);
    const pdb_content = await s.all_atom_pdb!.arrayBuffer();
    const RUN_ID = uuid();

    const setMartinizeStep = (str: string) => {
      this.setState({ martinize_step: str });
    };

    const files: MartinizeFiles | undefined = await new Promise<MartinizeFiles>((resolve, reject) => {
      const files: Partial<MartinizeFiles> = {};

      // Begin the run
      socket.emit('martinize', Buffer.from(pdb_content), RUN_ID, form_data);

      // Martinize step
      socket.on('martinize step', ({ step, id, data }: { step: string, id: string, data: any[] }) => {
        if (id !== RUN_ID) {
          return;
        }

        switch (step) {
          case STEPS.STEP_MARTINIZE_INIT:
            setMartinizeStep("Martinize is initializing...");
            break;
          case STEPS.STEP_MARTINIZE_RUNNING:
            setMartinizeStep("Current step: " + data[0]);
            break;
          case STEPS.STEP_MARTINIZE_ENDED_FINE:
            setMartinizeStep("Martinize run ended fine");
            break;
          case STEPS.STEP_MARTINIZE_GET_CONTACTS:
            setMartinizeStep("Getting contact map for molecule");
            break;
          case STEPS.STEP_MARTINIZE_GO_SITES:
            setMartinizeStep("Creating virtual Go sites");
            break;
          case STEPS.STEP_MARTINIZE_GROMACS:
            setMartinizeStep("Compiling bonds inside PDB file");
            break;
        }
      }); 

      // File upload
      socket.on('martinize download', ({ id, name, type }: { id: string, name: string, type: string }, file: ArrayBuffer, ok_cb: Function) => {
        if (id !== RUN_ID) {
          return;
        }
        setMartinizeStep("Downloading results");

        switch (type) {
          case 'chemical/x-pdb': {
            // pdb file
            files.pdb = {
              name,
              content: new File([file], name, { type }),
              type,
            };
            break;
          }
          case 'chemical/x-topology': {
            // TOP file
            files.top = {
              name,
              content: new File([file], name, { type }),
              type,
            };
            break;
          }
          case 'chemical/x-include-topology': {
            // ITP file
            if (!files.itps) {
              files.itps = [];
            }

            files.itps.push({
              name,
              content: new File([file], name, { type }),
              type,
            });
            break;
          }
        }

        ok_cb();
      });

      // Run error
      socket.on('martinize error', ({ id, error, type, stack }: { id: string, error: string, type?: string, stack: string }, raw_run?: ArrayBuffer) => {
        if (id !== RUN_ID) {
          return;
        }
        
        reject({ id, error, type, raw_run, stack });
      });

      // Before end send
      socket.on('martinize before end', ({ id }: { id: string }) => {
        if (id !== RUN_ID) {
          return;
        }

        setMartinizeStep("Finishing...");
      });

      // When run ends
      socket.on('martinize end', (
        { id, go_bonds, elastic_bonds, radius, go_details, }: { 
          id: string, 
          go_bonds?: ElasticOrGoBounds[], 
          elastic_bonds?: ElasticOrGoBounds[], 
          go_details?: GoMoleculeDetails,
          radius: { [name: string]: number; }, 
        }) => {
          if (id !== RUN_ID) {
            return;
          }

          files.radius = radius;
          files.go_bonds = go_bonds;
          files.elastic_bonds = elastic_bonds;
          files.go_details = go_details;

          console.log(files);

          resolve(files as MartinizeFiles);
      });
    }).catch(error => {
      this.setState({
        running: 'martinize_error',
        martinize_step: '',
        martinize_error: error
      });

      return undefined;
    });

    socket.disconnect();

    if (!files) {
      return;
    }

    this.setState({ files, martinize_step: "" });

    const mode = files.elastic_bonds ? 'elastic' : (files.go_bonds ? 'go' : undefined);

    this.initCoarseGrainPdb({
      pdb: files.pdb.content,
      radius: files.radius,
      bonds: files.elastic_bonds ?? files.go_bonds,
      go_details: files.go_details,
      mode
    });

    // AJAX METHOD
    //
    // ApiHelper.request('molecule/martinize', {
    //   parameters: form_data,
    //   method: 'POST',
    //   body_mode: 'multipart',
    //   mode: 'text',
    // }) 
    //   .then((res: string) => {
    //     const data = martinizeOutputParser(res);
    //     console.log(data);

    //     const cg_pdb = data.pdb.content;

    //     // Init PDB scene
    //     this.initCoarseGrainPdb(cg_pdb, data.radius);
    //     this.setState({ files: data });
    //   })
    //   .catch(e => {
    //     console.log(e);
    //     if (Array.isArray(e)) {
    //       const error = e[1];

    //       this.setState({
    //         running: 'martinize_error',
    //         error
    //       });
    //     }
    //     else {
    //       this.setState({
    //         running: 'martinize_error'
    //       });
    //     }
    //   }) 
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
      this.ngl.reset();

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
    for (const repr of this.state.all_atom_ngl!.representations) {
      repr.visible = checked;
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
    for (const repr of this.state.coarse_grain_ngl!.representations) {
      repr.visible = checked;
    }

    this.setState({ coarse_grain_visible: checked });
  };

  onVirtualLinksOpacityChange = (_: any, value: number | number[]) => {
    if (Array.isArray(value)) {
      value = value[0];
    }

    this.setState({
      virtual_link_opacity: value / 100
    });

    this.setVirtualLinksRepresentation({ opacity: value / 100 });
  };

  onVirtualLinksVisibilityChange = (_: any, checked: boolean) => {
    const repr = this.state.virtual_links_repr;
    if (repr)
      repr.visible = checked;

    this.setState({ virtual_link_visible: checked });
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

    cmp_aa.add(type, {
      visible: this.state.all_atom_visible,
      opacity: this.state.all_atom_opacity,
    });

    cmp_coarse.add(type, {
      visible: this.state.coarse_grain_visible,
      opacity: this.state.coarse_grain_opacity,
    });

    this.setState({
      representations: [...this.state.representations, type],
    });
  };

  onRepresentationRemove = (type: ViableRepresentation) => {
    const cmp_aa = this.state.all_atom_ngl!;
    const cmp_coarse = this.state.coarse_grain_ngl!;

    cmp_aa.removeOfType(type);
    cmp_coarse.removeOfType(type);

    this.setState({
      representations: this.state.representations.filter(e => e !== type),
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

  onForceFieldChange = (ff: string) => {
    if (this.state.builder_mode === 'go' && !ff.includes('martini3')) {
      this.setState({ builder_mode: 'classic' });
    }
    this.setState({ builder_force_field: ff });
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

        <Typography variant="h6">
          Saved molecules
        </Typography>

        <Typography>
          You can use these molecules in the <Link 
            component={RouterLink} 
            to="/membrane_builder"
          >
            membrane builder
          </Link>.
        </Typography>

        <StashedBuild onSelect={uuid => this.load(uuid)} />
      </div>
    );
  }

  formatMartinizeError() {
    const error = this.state.martinize_error;

    if (!error) {
      return "";
    }
    const close_fn = () => this.setState({ martinize_error: { ...error, open: false } });
    const open_fn = () => this.setState({ martinize_error: { ...error, open: true } });
    const download_fn = () => {
      const blob = new Blob([error.raw_run!]);
      downloadBlob(blob, "run_" + dateFormatter("Y-m-d_H-i-s") + ".zip")
    };

    return (
      <React.Fragment>
        {/* Dialog */}
        <Dialog open={!!error.open} onClose={close_fn} maxWidth="md">
          <DialogTitle>
            Martinize run failed :(
          </DialogTitle>

          <DialogContent>
            <DialogContentText color="secondary">
              {error.error}
            </DialogContentText>

            {error.raw_run && <DialogContentText>
              To explore more details, like intermediate files and program command line outputs, you can{" "}
              <Link href="#!" onClick={download_fn}>
                download a dump of this run
              </Link>.
            </DialogContentText>}

            <Marger size=".5rem" />

            <Divider />

            <Marger size="1rem" />

            {error.stack && <DialogContentText component="pre" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              <strong>Stack trace</strong>  
              
              <br />
              <code>
                {error.stack}
              </code>
            </DialogContentText>}
          </DialogContent>

          <DialogActions>
            <Button color="primary" onClick={close_fn}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Inline text */}
        <Typography color="error" align="center">
          Unable to proceed your molecule: {" "}
          <strong>
            Run failed
          </strong>.
          
          <br />
          <Link color="primary" href="#!" onClick={open_fn}>
            Click here to see more details
          </Link>.
        </Typography>
        
      </React.Fragment>
    );
  }

  martinizeForm() {
    const force_fields = Settings.martinize_variables.force_fields.map(e => ({ id: e, name: e }));

    return (
      <div>
        <Marger size="1rem" />

        {this.state.running === 'martinize_error' && this.formatMartinizeError()}

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
              onChange={this.onForceFieldChange}
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
              values={this.available_modes}
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
        <Marger size=".5rem" />
        <Typography>
          {this.state.martinize_step}
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

        {/* Go / Elastic networks virtual bonds */}
        {this.state.virtual_links && <React.Fragment>
          <Typography variant="h6">
            Virtual {this.state.builder_mode === "go" ? "Go" : "elastic"} bonds
          </Typography>

          <Typography gutterBottom>
            Opacity
          </Typography>
          <Slider
            value={this.state.virtual_link_opacity * 100}
            valueLabelDisplay="auto"
            step={10}
            marks
            min={10}
            max={100}
            onChange={this.onVirtualLinksOpacityChange}
            color="secondary"
          />

          <FormControl component="fieldset">
            <FormGroup>
              <FormControlLabel
                control={<Switch checked={this.state.virtual_link_visible} onChange={this.onVirtualLinksVisibilityChange} value="visible" />}
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
                  Martinize a protein
                </Typography>

                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <Link 
                    href="#!" 
                    // When state is initial state (main loader), don't show the confirm modal
                    onClick={this.state.running !== 'pdb' ? this.onWantGoBack : this.onGoBack}  
                  >
                    <FaIcon arrow-left style={{ fontSize: '1rem' }} /> 
                    <span style={{ marginLeft: '.7rem', fontSize: '1.1rem' }}>
                      Back to MArtini Database
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

// Used for martinize output in ajax post call
function martinizeOutputParser(input: string) : { 
  pdb: MartinizeFile, 
  top: MartinizeFile, 
  itps: MartinizeFile[], 
  radius: { [name: string]: number }, 
  go_bonds?: ElasticOrGoBounds[], 
  elastic_bonds?: ElasticOrGoBounds[] 
} {
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

function drawBondsInStage(stage: NglWrapper, points: ElasticOrGoBounds[], coords: [number, number, number][], mode: 'go' | 'elastic') {
  const shape = new ngl.Shape("add-bonds");
  const upper_mode = mode.toLocaleUpperCase();
  
  for (const [atom1_index, atom2_index] of points) {
    // atom index starts at 1, atom array stats to 0
    const atom1 = coords[atom1_index - 1];
    const atom2 = coords[atom2_index - 1];
    
    if (!atom1 || !atom2) {
      console.warn("Not found atom", atom1_index, atom2_index, coords);
      continue;
    }
    
    const name = `[${upper_mode}] Bond w/ atoms ${atom1_index}-${atom2_index}`;
    shape.addCylinder(atom1, atom2, [0, 65, 0], 0.1, name);
  }

  const component = stage.add(shape);
  const representation = component.add<ngl.BufferRepresentation>('buffer', { opacity: .2 });

  return { component, representation };
}


interface AddOrRemoveBoundParams {
  source: number;
  target: number;
  itp_file: ItpFile;
  details: GoBoundsDetails;
  stage: NglWrapper;
  points: ElasticOrGoBounds[];
  coords: [number, number, number][];
  links_component: NglComponent;
}

/** 
 * Source&Target are GO index + 1 !! 
 * 
 * {ngl_click_event}.atom.index + 1
 */
function addBond({ source, target, itp_file, details, stage, points, coords, links_component }: AddOrRemoveBoundParams) {
  const go_i = source, go_j = target;
  const go_i_name = details.index_to_name[go_i], go_j_name = details.index_to_name[go_j];

  itp_file.headlines.push(`${go_i_name}    ${go_j_name}    1  0.7923518221  9.4140000000`);
 
  // Remove the old go bonds component
  stage.remove(links_component);
 
  // Add the relations i, j in the points
  points.push([details.index_to_real[source], details.index_to_real[target]]);
 
  // Redraw all the bounds (very quick)
  const { component: new_cmp, representation } = drawBondsInStage(stage, points, coords, 'go');
 
  // Save the new component
  return { component: new_cmp, representation, points };
}

/** 
 * Source&Target are REAL ATOM index 
 * 
 * {ngl_click_event}.type === "cylinder"
 * {ngl_click_event}.object.name.startsWith("[GO]")
 * const [source, target] = {ngl_click_event}.object.name.split('atoms ')[1].split('-').map(Number)
 */
function removeBond({ source, target, itp_file, details, stage, points, coords, links_component }: AddOrRemoveBoundParams) {
  const go_i = details.real_to_index[source], go_j = details.real_to_index[target];
  const go_i_name = details.index_to_name[go_i], go_j_name = details.index_to_name[go_j];

  const index = itp_file.headlines.findIndex(e => {
    const [name_1, name_2,] = e.split(/\s+/).filter(l => l); 

    return (name_1 === go_i_name && name_2 === go_j_name) || (name_2 === go_i_name && name_1 === go_j_name);
  });

  if (index !== -1) {
    // Remove line at index {index}
    itp_file.headlines.splice(index, 1);
  }
 
  // Remove the old go bonds component
  stage.remove(links_component);
 
  // Add the relations i, j in the points
  const new_points = points.filter(e => {
    if (e[0] === source && e[1] === target) return false;
    if (e[1] === source && e[0] === target) return false;
    
    return true;
  });
 
  // Redraw all the bounds (very quick)
  const { component: new_cmp, representation } = drawBondsInStage(stage, new_points, coords, 'go');
 
  // Save the new component
  return { component: new_cmp, representation, points: new_points };
}

// @ts-ignore
window.Buffer = Buffer;
