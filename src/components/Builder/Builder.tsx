import React from 'react';
import { withStyles, Grid, Typography, Paper, Button, withTheme, Theme, CircularProgress, Divider, createMuiTheme, ThemeProvider, Link, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@material-ui/core';
import { Marger, FaIcon, downloadBlob, setPageTitle } from '../../helpers';
import { Link as RouterLink } from 'react-router-dom';

import { Stage } from '@mmsb/ngl';
import BallAndStickRepresentation from '@mmsb/ngl/declarations/representation/ballandstick-representation';
import * as ngl from '@mmsb/ngl';

import { toast } from '../Toaster';
import { RepresentationParameters } from '@mmsb/ngl/declarations/representation/representation';
import JSZip from 'jszip';
import { blue } from '@material-ui/core/colors';
import { applyUserRadius } from '../../nglhelpers';
import StashedBuildHelper, { MartinizeFile, ElasticOrGoBounds, GoMoleculeDetails } from '../../StashedBuildHelper';
import SocketIo from 'socket.io-client';
import { SERVER_ROOT, STEPS } from '../../constants';
import { v4 as uuid } from 'uuid';
import NglWrapper, { NglComponent, ViableRepresentation, NglRepresentation } from './NglWrapper';
import { ItpFile } from 'itp-parser';
import LoadPdb from './ProteinBuilder/LoadPdb';
import { MZError } from './ProteinBuilder/MartinizeError';
import MartinizeForm from './ProteinBuilder/MartinizeForm';
import MartinizeGenerated from './ProteinBuilder/MartinizeGenerated';
import MoleculeSaverModal from './ProteinBuilder/MoleculeSaverModal';
import { addBond, removeBond, drawBondsInStage } from './ProteinBuilder/AddOrRemoveBonds';

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
  martinize_error?: MZError;
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
    // TODO multiple molecule support! It could be guessed with .count property of each molecule
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

  onFileSelect = (file: File) => {
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
              {this.state.running === 'pdb' && <LoadPdb 
                onStashedSelect={uuid => this.load(uuid)}
                onFileSelect={this.onFileSelect}
                error={this.state.error}
              />}

              {this.state.running === 'pdb_read' && this.allAtomLoading()}

              {(this.state.running === 'martinize_params' || this.state.running === 'martinize_error') && <MartinizeForm 
                martinizeError={this.state.martinize_error}
                onBuilderModeChange={value => this.setState({ builder_mode: value as any })}
                onBuilderPositionChange={value => this.setState({ builder_positions: value as any })}
                onForceFieldChange={value => this.setState({ builder_force_field: value })}
                onMartinizeBegin={this.handleMartinizeBegin}
                onReset={() => this.reset()}
                onElasticChange={(type, value) => {
                  // @ts-ignore
                  this.setState({ [type]: value })
                }}
                builderForceField={this.state.builder_force_field}
                builderMode={this.state.builder_mode}
                builderPosition={this.state.builder_positions}
                builderEa={this.state.builder_ea}
                builderEf={this.state.builder_ef}
                builderEl={this.state.builder_el}
                builderEm={this.state.builder_em}
                builderEp={this.state.builder_ep}
                builderEu={this.state.builder_eu}
              />}

              {this.state.running === 'martinize_generate' && this.martinizeGenerating()}

              {this.state.running === 'done' && <MartinizeGenerated 
                onReset={() => this.reset()}
                theme={this.state.theme}
                onThemeChange={this.onThemeChange}
                virtualLinks={this.state.builder_mode === 'classic' ? '' : this.state.builder_mode}
                allAtomOpacity={this.state.all_atom_opacity}
                allAtomVisible={this.state.all_atom_visible}
                onAllAtomOpacityChange={this.onAllAtomOpacityChange}
                onAllAtomVisibilityChange={this.onAllAtomVisibilityChange}
                onMoleculeDownload={this.onMoleculeDownload}
                onMoleculeStash={this.onMoleculeStash}
                onRepresentationChange={this.onRepresentationChange}
                representations={this.state.representations}
                coarseGrainedOpacity={this.state.coarse_grain_opacity}
                coarseGrainedVisible={this.state.coarse_grain_visible}
                onCoarseGrainedOpacityChange={this.onCoarseGrainedOpacityChange}
                onCoarseGrainedVisibilityChange={this.onCoarseGrainedVisibilityChange}
                virtualLinksOpacity={this.state.virtual_link_opacity}
                virtualLinksVisible={this.state.virtual_link_visible}
                onVirtualLinksOpacityChange={this.onVirtualLinksOpacityChange}
                onVirtualLinksVisibilityChange={this.onVirtualLinksVisibilityChange}
                saved={this.state.saved}
                generatingFiles={this.state.generating_files}
              />}
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
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  side: {
    zIndex: 3,
    overflow: 'auto', 
    maxHeight: '100vh',
  },
}))(withTheme(MartinizeBuilder));

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

// @ts-ignore
window.Buffer = Buffer;
