import React from 'react';
import { withStyles, Grid, Typography, Paper, Button, withTheme, Theme, CircularProgress, Divider, createTheme, ThemeProvider, Link, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@material-ui/core';
import { Marger, FaIcon, downloadBlob, setPageTitle, notifyError } from '../../helpers';
import { Link as RouterLink, RouteComponentProps } from 'react-router-dom';

import { Stage } from '@mmsb/ngl';
import BallAndStickRepresentation from '@mmsb/ngl/declarations/representation/ballandstick-representation';
import * as ngl from '@mmsb/ngl';

import { toast } from '../Toaster';
import { RepresentationParameters } from '@mmsb/ngl/declarations/representation/representation';
import JSZip from 'jszip';
import { blue } from '@material-ui/core/colors';
import { applyUserRadius } from '../../nglhelpers';
import SocketIo from 'socket.io-client';
import { SERVER_ROOT, STEPS } from '../../constants';
import { v4 as uuid } from 'uuid';
import NglWrapper, { NglComponent, ViableRepresentation } from './NglWrapper';
import LoadPdb from './ProteinBuilder/LoadPdb';
import { MZError } from './ProteinBuilder/MartinizeError';
import MartinizeForm from './ProteinBuilder/MartinizeForm';
import MartinizeGenerated from './ProteinBuilder/MartinizeGenerated';
import GoEditor from './ProteinBuilder/GoEditor';
import GoBondsHelper from './GoBondsHelper';
import { BondsRepresentation } from './BondsRepresentation';
import { BetaWarning } from '../../Shared'; 
import BaseBondsHelper from './BaseBondsHelper';
import { getIdxSortedByChain } from './BaseBondsHelper';
import ElasticBondHelper from './ElasticBondHelper';
import Settings, { LoginStatus } from '../../Settings';
import EmbeddedError from '../Errors/Errors';
import { errorToText, loadMartinizeFiles } from '../../helpers'; 

import ApiHelper from '../../ApiHelper'
import ElasticBondsHelper from './ElasticBondHelper';
import { MartinizeFile, MartinizeMode, ReadedJobFiles, ElasticOrGoBounds, ReadedJobDoc, AvailableForceFields } from '../../types/entities'; 
import { Alert } from '@material-ui/lab'
import { itpBeads } from './BeadsHelper';

// @ts-ignore
window.NGL = ngl; window.BaseBondsHelper = BaseBondsHelper;

interface MBProps extends RouteComponentProps {
  classes: Record<string, string>;
  theme: Theme;
  location : any; 
}

export interface MartinizeFiles {
  pdb: MartinizeFile;
  itps: MartinizeFile[]; // One array of itps for each molecule of the system
  radius: { [name: string]: number };
  top: MartinizeFile;
  go?: BaseBondsHelper;
  elastic_bonds?: BondsRepresentation;
  warnings?: File; 
}

interface AtomRadius { 
  [atom: string]: number;
}

type BuilderType = "martinize" | "insane"

export interface MBState {
  running: 'pdb' | 'pdb_read' | 'martinize_params' | 'martinize_generate' | 'martinize_error' | 'done' | 'go_editor' | 'load_error';
  error?: any;
  martinize_error?: MZError;
  martinize_step: string;

  all_atom_pdb?: File;
  all_atom_ngl?: NglComponent;

  coarse_grain_pdb?: Blob;
  coarse_grain_ngl?: NglComponent;

  builder_force_field: AvailableForceFields;
  builder_mode: MartinizeMode; 
  builder_positions: 'none' | 'all' | 'backbone';
  builder_ef: string;
  builder_el: string;
  builder_eu: string;
  builder_ea: string;
  builder_ep: string;
  builder_em: string;
  cTer: string;
  nTer: string;
  sc_fix: string;
  cystein_bridge: string;

  advanced: string;
  commandline: string;


  all_atom_opacity: number;
  all_atom_visible: boolean;
  coarse_grain_opacity: number;
  coarse_grain_visible: boolean;
  virtual_link_opacity: number;
  virtual_link_visible: boolean;
  representations: ViableRepresentation[];
  
  files?: MartinizeFiles;
  generating_files: boolean;
  saved: string | false;
  edited: boolean;
  want_reset: boolean;
  want_go_back: boolean;

  theme: Theme;

  version?: string;

  load_error_message?:string; 
  send_mail: boolean; 
  open_legend : boolean; 

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

  protected beads: string[] = []; 

  protected saved_viz_params?: {
    aa_enabled: boolean;
    cg_op: number;
    cg_enabled: boolean;
    vl_op: number;
    vl_enabled: boolean;
    representations: ViableRepresentation[];
    go: BaseBondsHelper;
  };

  protected jobId: string = ""; 

  componentDidMount() {
    setPageTitle('Protein Builder');

    if (Settings.logged === LoginStatus.None) {
      return;
    }


    // @ts-ignore
    window.MoleculeBuilder = this;

    this.ngl = new NglWrapper("ngl-stage", { backgroundColor: this.props.theme.palette.background.default });
    this.changeCommandline('');
    this.getMartinizeVersion();

    if ('id' in this.props.match.params){
      //Reload an history job
      const params = this.props.match.params as any
      const jobId = params.id
      this.loadFromHistory(jobId)

    }
   
  }

  async loadFromHistory(jobId: string){
    try {
      this.jobId = jobId; 
      const job : ReadedJobDoc = await ApiHelper.request(`history/get?jobId=${jobId}`)
      this.reloadJobSettingsIntoState(job)
      const [allAtomFile, martinizeFiles, warnFile] = await Promise.all([this.loadAllAtomFile(job.files), loadMartinizeFiles(job), this.loadWarnings(job.files)])
      this.reloadJob(allAtomFile, martinizeFiles, warnFile)
    }catch(e) {
      this.setState({load_error_message : errorToText(e as any), running: 'load_error'})
    }
    

  }

  reloadJobSettingsIntoState(job: ReadedJobDoc){
    this.setState({
      builder_force_field: job.settings.ff,
      builder_mode : job.settings.builder_mode,
      builder_positions : job.settings.position, 
      builder_ef : job.settings.ef ?? this.original_state.builder_ef,
      builder_el: job.settings.el ??  this.original_state.builder_el,
      builder_eu: job.settings.eu ??  this.original_state.builder_eu,
      builder_ea: job.settings.ea ??  this.original_state.builder_ea,
      builder_ep: job.settings.ep ??  this.original_state.builder_ep,
      builder_em: job.settings.em ??  this.original_state.builder_em,
      nTer: job.settings.nter,
      cTer : job.settings.cter,
      sc_fix : job.settings.sc_fix.toString(),
      cystein_bridge : job.settings.cystein_bridge
    }) 
  }

  async loadAllAtomFile(files: ReadedJobFiles) : Promise<File> {
    return new File([files.all_atom.content], files.all_atom.name, { type: files.all_atom.type })
  }

  async loadWarnings(files: ReadedJobFiles) : Promise<File> {
    return new File([files.warnings.content], files.warnings.name, { type: files.warnings.type })
  }

  async loadBonds(martinizeFiles: MartinizeFiles, mode : "go" | "elastic"){
    
    const bonds = mode === "go" ? await GoBondsHelper.readFromItps(this.ngl,  martinizeFiles.itps.flat().map((e:MartinizeFile) => e.content)) : mode === "elastic" ? await ElasticBondsHelper.readFromItps(this.ngl, martinizeFiles.itps.map((e:MartinizeFile) => ({content: e.content, mol_idx: e.mol_idx}))) : undefined
    const elastic_bonds = bonds?.representation
    return {...martinizeFiles, elastic_bonds, go: bonds}
  }

  protected get original_state() : MBState {
    return {
      running: 'pdb',
      builder_force_field: 'martini3001',
      builder_mode: 'classic',
      builder_positions: 'backbone',
      builder_ef: '500',
      builder_el: '0.5',
      builder_eu: '0.9',
      builder_ea: '0',
      builder_ep: '0',
      builder_em: '0',
      cTer: 'COOH-ter',
      nTer: 'NH2-ter',
      sc_fix: 'false',
      cystein_bridge: 'none',
      advanced: 'false',
      commandline: '',
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
      edited: false,
      want_reset: false,
      want_go_back: false,
      error: undefined,
      martinize_step: '',
      send_mail: false,
      open_legend : false
    };
  }



  /* LOAD, RESET AND SAVE STAGES */
  /*async save(name: string, overwrite_uuid?: string) {
    const saver = new StashedBuildHelper();

    if (!this.state.files) {
      return;
    }

    toast("Your molecule has been saved.", "info");

    const uuid = await saver.add({
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
        cTer: this.state.cTer,
        nTer: this.state.nTer,
        sc_fix: this.state.sc_fix,
        cystein_bridge: this.state.cystein_bridge,
        advanced: this.state.advanced,
        commandline: this.state.commandline,
        stdout: this.state.stdout
      },
      all_atom: this.state.all_atom_pdb!,
      coarse_grained: this.state.files.pdb,
      itp_files: this.state.files.itps,
      top_file: this.state.files.top,
      radius: this.state.files.radius,
      elastic_bonds: this.state.files.elastic_bonds?.bonds,
      go: this.state.files.go?.toJSON(),
    }, overwrite_uuid);

    this.setState({
      saved: uuid,
      edited: false,
    });
  }*/


  async reloadJob(allAtomFile : File, martinizeFiles : MartinizeFiles, warnFile : File){
    try {
      const builder_mode = this.state.builder_mode
      const completeFiles = builder_mode === "go" || builder_mode === "elastic" ? await this.loadBonds(martinizeFiles, builder_mode) : martinizeFiles
      completeFiles.warnings = warnFile; 
      this.initAllAtomPdb(allAtomFile); 
      this.initCoarseGrainPdb({
        files : completeFiles,
        mode : builder_mode === "classic" ? undefined : builder_mode
      });
      this.setState({files: completeFiles})
    }catch(e) { 
      notifyError(e as any) }
    

  }

  reset() {
    if (this.ngl)
      this.ngl.reset();
    this.setState(this.original_state);
    this.changeCommandline('');
    this.changeTheme('light');
  }
  

  /* SET SETTINGS FOR REPRESENTATIONS */

  setCoarseGrainRepresentation(parameters: Partial<RepresentationParameters>) {
    for (const repr of this.state.coarse_grain_ngl!.representations) {
      repr.set(parameters);
    }
  }

  setAllAtomRepresentation(parameters: Partial<RepresentationParameters>) {
    for (const repr of this.state.all_atom_ngl!.representations) {
      repr.set(parameters);
    }
  }

  createTheme(hint: 'light' | 'dark') {
    const bgclr = hint === 'dark' ? '#303030' : '#fafafa';

    return createTheme({
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

  async initCoarseGrainPdb(options: { files: MartinizeFiles, mode?: 'go' | 'elastic' }) {
    let component: NglComponent;

    this.beads = await itpBeads(options.files.itps.map(itp => itp.content))
    // Apply the NGL radius
    applyUserRadius(options.files.radius);

    try {
      component = await this.ngl.load(options.files.pdb.content, {coarse_grained:true});
    } catch (e) {
      console.error(e);
      toast("Unable to load generated PDB. Please retry by re-loading the page.");
      return;
    }

    const repr = component.add<BallAndStickRepresentation>("ball+stick", {}, {radius: true, color: true, beads: this.beads, ff: this.state.builder_force_field});

    component.center(500);

    this.setAllAtomRepresentation({ opacity: .3 });

    if (options.mode) {
      const coordinates: [number, number, number][][] = [];

      repr.atomIterator(ap => {
        if(ap.chainIndex in coordinates) coordinates[ap.chainIndex].push([ap.x, ap.y, ap.z])
        else coordinates[ap.chainIndex] = [[ap.x, ap.y, ap.z]];
      });

      // Init the bond helper 
      if ((options.mode === 'go' || options.mode === "elastic") && options.files.go) {
        options.files.go.representation.registerCoords(coordinates);
        options.files.go.render();
      }
      /*
      else if (options.mode === 'elastic' && options.files.elastic_bonds) {
        options.files.elastic_bonds.registerCoords(coordinates);
        options.files.elastic_bonds.render();
      }
      */
    }

    // Register the component
    this.setState({
      running: 'done',
      coarse_grain_pdb: options.files.pdb.content,
      coarse_grain_ngl: component,
    });
  }

  async initAllAtomPdb(file: File) {
    const component = await this.ngl.load(file, {coarse_grained:false});

    component.add<BallAndStickRepresentation>("ball+stick");
    component.center();

    // Register the component
    this.setState({
      all_atom_ngl: component,
      all_atom_pdb: file,
    });
  }

  /* ADD OR REMOVE GO BONDS */
  async addOrRemoveGoBond(options: {
    mode: 'add' | 'remove',
    /** For adding or removing a single bond. */
    target?: [number, number],
    /** For removing all nodes from atom */
    target_single?: number,
    /** For adding or removing all bonds between the set. */
    target_ensembl?: [Set<number>, Set<number> | undefined],
    /** Enable history push. */
    enable_history?: boolean,
    chain: number,
    }) {

    
    if (!this.state.files || !this.state.files.go)
      return;

    const { target, target_single, target_ensembl, chain } = options;

    if (target === undefined && target_single === undefined && target_ensembl === undefined) {
      throw new Error("No target");
    }

    const files = this.state.files;

    let go = files.go!;

    if (options.enable_history !== false) {
      go.historyPush();
    }

    if (options.mode === "add") {
      if(target !== undefined){
        //Add a single bond
        const atom1 = go.nglIndexToRealIndex(target[0])
        const atom2 = go.nglIndexToRealIndex(target[1])
        if (atom1.chain !== atom2.chain){
          toast("You can't add bonds between 2 different chains", "error")
          return
        }
        const chain = atom1.chain; 
        go.add(chain, go.createRealLine(atom1.index, atom2.index, chain));
        go.addCustomBonds(chain, atom1.index, atom2.index)
      }
      else if (target_ensembl !== undefined && target_ensembl[1] !== undefined) {
        // Add line between each element of set
        for (const atom1 of target_ensembl[0]) {
          const index1 = go.nglIndexToRealIndex(atom1)
          
          for (const atom2 of target_ensembl[1]) {
            const index2 = go.nglIndexToRealIndex(atom2)
            if(index1.chain === index2.chain){
              go.add(index1.chain, go.createRealLine(index1.index, index2.index, index1.chain));
              go.addCustomBonds(chain, index1.index, index2.index);
            }
          }
        }
      }
      else if (target_ensembl !== undefined && target_ensembl[1] === undefined) {
        // Add line between each element of set
        // Link all atoms of the set together
        const real_indexes = [...target_ensembl[0]].map(e => go.nglIndexToRealIndex(e))
        const real_indexes_by_chain = getIdxSortedByChain(real_indexes)
        
        for (const [chain, index_set] of Object.entries(real_indexes_by_chain)){  
          const chainIdx = parseInt(chain)
          if(isNaN(chainIdx)) throw new Error("Chain index is NaN")
          for (const index of index_set) {
            for (const counterpart of index_set) {
              if (index !== counterpart && !go.has(index, counterpart, chainIdx)) {
                go.add(chainIdx, go.createRealLine(index, counterpart, chainIdx));
                go.addCustomBonds(chainIdx, index, counterpart);
              }
            }
          }
        }

        
      }

    } 
    else { //REMOVE
      if (target !== undefined) {
        // Source&Target are REAL ATOM index 
        // Remove a single bond
        const [name1, name2] = target //.map(e => go.realIndexToGoName(e));

        go.remove(chain, name1, name2);

        go.rmCustomBonds(chain, name1, name2);
      }
      else if (target_single !== undefined) {
        // INDEX are GO Index + 1
        // Remove every bond from this atom

        const {chain, index} = go.nglIndexToRealIndex(target_single)

        go.remove(chain, index);

        go.rmCustomBonds(chain, index);
      }
      else if (target_ensembl !== undefined && target_ensembl[1] === undefined) {
        // INDEXES are GO Indexes + 1
        // Unlink all atoms of the set together

        const index_set = [...target_ensembl[0]].map(e => go.nglIndexToRealIndex(e))

        const sortedByChain = getIdxSortedByChain(index_set)

        for (const [chain, index_set] of Object.entries(sortedByChain)){
          const chainIdx = parseInt(chain)
          if(isNaN(chainIdx)) throw new Error("Chain index is NaN")
          for (const index of index_set) {
            // Get the bonds linked to atoms in name set
            const bonds = go.findBondsOf(index, chainIdx).filter((n: any) => index_set.has(n));
            // Remove every targeted bond
            for (const bond of bonds) {
              go.remove(chainIdx, index, bond);
  
              go.rmCustomBonds(chainIdx, index, bond);
            }
          }
        }
      }
      else if (target_ensembl !== undefined && target_ensembl[1] !== undefined) {
        // INDEXES are GO Indexes + 1
        // Convert every index to go name in a set
        const counterpart = [...target_ensembl[1]].map(e => go.nglIndexToRealIndex(e))
        
        const counterpart_by_chain = getIdxSortedByChain(counterpart)

        for (const atom of target_ensembl[0]) {
          const {chain, index} = go.nglIndexToRealIndex(atom)
          const counterpart_same_chain = counterpart_by_chain[chain]
          // Get the bonds linked to counterpart items
          const bonds = go.findBondsOf(index, chain).filter((n: any) => counterpart_same_chain.has(n));

          // Remove every targeted bond
          for (const bond of bonds) {
            go.remove(chain, index, bond);

            go.rmCustomBonds(chain, index, bond);
          }
        }
      }
    }
    go.render(this.state.virtual_link_opacity);
  
    this.setState({
      edited: true,
    });
  }

  redrawGoBonds = (highlight?: [number, number] | number, opacity?: number, h_chain?:number) => {    
    let realHighlightIdx = highlight; 
    if (typeof highlight === 'number') {
      // transform go index to real index
      // It's an atom, transform ngl index to real index
      const nglAtom = this.state.files!.go!.nglIndexToRealIndex(highlight)
      realHighlightIdx = nglAtom.index; 
     
    }

    let h1 = 0, h2 = 0;

    if (Array.isArray(realHighlightIdx)) {
      [h1, h2] = realHighlightIdx;
    }
    else if (typeof realHighlightIdx === 'number') {
      // Highlight every link from highlight go atom
      h1 = realHighlightIdx;
    }

    // TODO improve
    const predicate = realHighlightIdx !== undefined ? ((atom1: number, atom2: number, chain:number) => {
      if (realHighlightIdx && Array.isArray(realHighlightIdx)) {
        return ((atom1 === h1 && atom2 === h2) || (atom2 === h1 && atom1 === h2) && h_chain === chain);
      }
      // Highlight is a number
      else if (h1) {
        return ((atom1 === h1 || atom2 === h1) && h_chain === chain);
      }

      return false;
    }) : undefined;

    this.state.files!.go!.render(
      opacity ?? this.state.virtual_link_opacity,
      predicate
    );
  };

  setSchemeIdColorForCg = (id?: string) => {
    for (const repr of this.state.coarse_grain_ngl!.representations) {
      repr.set({
        colorScheme: 'element',
        color: id,
      });
    }
  };

  restoreSettingsAfterGo(revert_go_changes: boolean) {
    // Restore all settings
    if (this.saved_viz_params) {
      const { aa_enabled, vl_enabled, vl_op, cg_op, cg_enabled, representations } = this.saved_viz_params;

      this.onRepresentationChange(undefined, representations);
      const go = this.state.files!.go!;

      go.representation.set({ opacity: vl_op });
      this.setCoarseGrainRepresentation({ opacity: cg_op });
      
      for (const repr of this.state.coarse_grain_ngl!.representations) {
        repr.visible = cg_enabled;
      }
      for (const repr of this.state.all_atom_ngl!.representations) {
        repr.visible = aa_enabled;
      }
      go.representation.visible = vl_enabled;

      this.setState({ virtual_link_opacity: vl_op });

      if (revert_go_changes) {
        this.state.files!.go = this.saved_viz_params.go;
        this.state.files!.go.render(vl_op);
      }
    }

    this.setState({ running: 'done' });
  }

  /* EVENTS */

  handleMartinizeBegin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const form_data: any = {};
    const s = this.state;

    //Check if we have merge option in commandline, it's forbidden for elastic network or go model for now

    if(s.commandline.includes("-merge") && (s.builder_mode === "elastic" || s.builder_mode === "go")){
      toast("Martinize option -merge is forbidden with elastic network and go model for now.", "error")
      return
    }

    form_data.ff = s.builder_force_field;
    form_data.position = s.builder_positions;
    form_data.cter = s.cTer;
    form_data.nter = s.nTer;
    form_data.sc_fix = s.sc_fix;
    form_data.cystein_bridge = s.cystein_bridge;

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
    form_data.advanced = s.advanced;
    form_data.commandline = s.commandline;
    form_data.builder_mode = s.builder_mode

    // form_data.pdb = s.all_atom_pdb;

    this.setState({ 
      running: 'martinize_generate',
      error: undefined,
      martinize_error: undefined,
    });

    // Run via socket.io
    const socket = SocketIo.connect(SERVER_ROOT);

    const pdb_content = await new Promise((resolve, reject) => {
      const fr = new FileReader();

      fr.onload = () => {
        resolve(fr.result as ArrayBuffer);
      };

      fr.onerror = reject;

      fr.readAsArrayBuffer(s.all_atom_pdb!);
    }) as ArrayBuffer;
    const RUN_ID = uuid();

    const setMartinizeStep = (str: string) => {
      this.setState({ martinize_step: str });
    };

    const files: MartinizeFiles | undefined = await new Promise<MartinizeFiles>((resolve, reject) => {
      const files: Partial<MartinizeFiles> = {};

      // Begin the run
      socket.emit('martinize', Buffer.from(pdb_content), RUN_ID, form_data, Settings.user?.id, this.state.send_mail, s.all_atom_pdb?.name);
      this.setState({ martinize_step: 'Sending your files to server' });

      // Martinize step
      socket.on('martinize step', ({ step, id }: { step: string, id: string }) => {
        if (id !== RUN_ID) {
          return;
        }

        switch (step) {
          case STEPS.STEP_MARTINIZE_INIT:
            setMartinizeStep("Running Vermouth-Martinize");
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
      socket.on('martinize download', ({ id, name, type, mol_idx }: { id: string, name: string, type: string, mol_idx:number }, file: ArrayBuffer, ok_cb: Function) => {
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
              mol_idx
            });
            break;
          }
          case 'martinize-warnings' : {
            files.warnings = new File([file], name, {type})
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
        { id, elastic_bonds, radius, savedToHistory, jobId }: { 
          id: string, 
          elastic_bonds?: ElasticOrGoBounds[], 
          radius: { [name: string]: number; }, 
          savedToHistory : boolean,
          jobId: string,
        }) => {
          if (id !== RUN_ID) {
            return;
          }
          
          this.jobId = jobId; 
          files.radius = radius;

          /*
          if (elastic_bonds) {
            files.elastic_bonds = new BondsRepresentation(this.ngl);
            files.elastic_bonds.bonds = elastic_bonds;
          }
          */
          if(savedToHistory) toast("Your job has been saved to history", "success")
          else toast("Your job can't be saved to history. An error occured with the server.", "warning")
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

    if (s.builder_mode === "go") {
      // Init go sites
      files.go = await GoBondsHelper.readFromItps(this.ngl, files.itps.map(e => e.content));
    } else if (s.builder_mode === "elastic") {
      files.go = await ElasticBondHelper.readFromItps(this.ngl, files.itps.map(e => ({mol_idx: e.mol_idx, content : e.content})));
    }

    this.setState({ files, martinize_step: "" });

    const mode = s.builder_mode === 'elastic' ? 'elastic' : (s.builder_mode === "go" ? 'go' : undefined);
    //const mode = files.elastic_bonds ? 'elastic' : (s.builder_mode === "go" ? 'go' : undefined);

    this.initCoarseGrainPdb({
      files,
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

    if (this.state.files?.go) {
      this.state.files.go.representation.set({ opacity: value / 100 });
    }
    /*
    else if (this.state.files?.elastic_bonds) {
      this.state.files?.elastic_bonds.set({ opacity: value / 100 })
    }
    */
  };

  onVirtualLinksVisibilityChange = (_: any, checked: boolean) => {
    const files = this.state.files;

    if (!files)
      return;

    if (files.go) {
      files.go.representation.visible = checked;
    }
    /*
    else if (files.elastic_bonds) {
      files.elastic_bonds.visible = checked;
    }
    */

    this.setState({ virtual_link_visible: checked });
  };

  onHistoryDownload = async () => {
    if (!this.state.files!.go) {
      return false;
    }

    try {
      const name = this.state.all_atom_pdb!.name.slice(0, this.state.all_atom_pdb!.name.indexOf('.pdb')) + '_modification_history.txt';
      let content = [];
      content.push(this.state.files!.go.customBondsGet().join('\n'));
      let history_file = new File(content, name);
      downloadBlob(history_file, name);
    } catch (error) {
      console.warn("Failed to download history", error);
    }
  }

  onMoleculeDownload = async () => {
    if (!this.state.files) {
      console.warn("Hey, files should be present in component when this method is called.");
      return;
    }

    this.setState({ generating_files: true });

    try {
      await this.downloadMolecule(); 
    }catch(e){
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
    }, {radius: true, color: true, beads: this.beads, ff: this.state.builder_force_field});

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

  onForceFieldChange = (ff: AvailableForceFields) => {
    if (this.state.builder_mode === 'go' && !ff.includes('martini3')) {
      this.setState({ builder_mode: 'classic' });
    }
    this.setState({ builder_force_field: ff });
  };

  onBondCreate = (chain: number, go_atom_1: number, go_atom_2: number) => {
    return this.addOrRemoveGoBond({
      mode: 'add',
      target: [go_atom_1 + 1, go_atom_2 + 1],
      chain
    });
  };

  onBondRemove = (chain: number, real_atom_1: number, real_atom_2: number) => {
    return this.addOrRemoveGoBond({
      mode: 'remove',
      target: [real_atom_1, real_atom_2],
      chain 
    });
  };

  onAllBondRemove = (chain: number, from_go_atom: number) => {
    return this.addOrRemoveGoBond({
      mode: 'remove',
      target_single: from_go_atom + 1,
      chain
    });
  };

  onBondCreateFromSet = (chain: number, set1: Set<number>, set2?: Set<number>) => {
    this.addOrRemoveGoBond({
      mode: 'add',
      target_ensembl: [set1, set2],
      chain
    });
  };

  onBondRemoveFromSet = (chain: number, set1: Set<number>, set2?: Set<number>) => {
    this.addOrRemoveGoBond({
      mode: 'remove',
      target_ensembl: [set1, set2],
      chain
    });
  };

  onGoEditorValidate = async () => {
    this.restoreSettingsAfterGo(false);

    if (!this.state.files){
      console.error("files are not registered in state, should not happen")
      return; 
    }

    if (!this.jobId){
      console.error("job id is not registered, should not happen")
      return; 
    }

    try {
      await this.applyBondsToFiles(); 
    } catch(e) {
      toast("Can't apply new bonds to itp files", "error")
      console.error(e); 
    }

    ApiHelper.request('history/update', { method: 'POST', 
    parameters:  {jobId : this.jobId, files:this.state.files.itps.map(itp => itp.content), molIdxs: this.state.files.itps.map(itp => itp.mol_idx)}, body_mode : 'multipart'}).then(() => {
      toast(`Job ${this.jobId} has been updated in history`, "success")
    }).catch(e => {
      toast(`Job ${this.jobId} can't be updated in history, an error occured`, "error")
      console.error(e); 
    })
  };

  onGoEditorCancel = async () => {
    this.restoreSettingsAfterGo(false);
    try {
      await this.applyBondsToFiles(); 
    } catch(e) {
      toast("Can't apply new bonds to itp files", "error")
      console.error(e); 
    }
  };

  onGoEditorStart = () => {
    // Save original params
    this.saved_viz_params = {
      aa_enabled: this.state.all_atom_visible,
      cg_enabled: this.state.coarse_grain_visible,
      vl_enabled: this.state.virtual_link_visible,
      cg_op: this.state.coarse_grain_opacity,
      vl_op: this.state.virtual_link_opacity,
      representations: this.state.representations,
      // @ts-ignore
      go: this.state.files!.go!.clone(),
    };

    // Apply custom params
    this.onRepresentationChange(undefined, ['ball+stick']);

    for (const repr of this.state.coarse_grain_ngl!.representations) {
      repr.visible = true;
    }
    for (const repr of this.state.all_atom_ngl!.representations) {
      repr.visible = false;
    }

    const vrepr = this.state.files!.go!.representation;
    vrepr.visible = true;
    vrepr.set({ opacity: 1 });

    this.setCoarseGrainRepresentation({ opacity: .7 });

    // Load the go editor
    this.setState({ running: 'go_editor', virtual_link_opacity: 1 });
  };

  onGoHistoryBack = (opacity?: number) => {
    const go = this.state.files?.go;

    if (!go)
      return;

    go.historyBack();
    go.render(opacity ?? this.state.virtual_link_opacity);
    this.setState({ edited: true });
  };

  onGoHistoryRevert = (opacity?: number) => {
    const go = this.state.files?.go;

    if (!go)
      return;

    go.historyRevert();
    go.render(opacity ?? this.state.virtual_link_opacity);
    this.setState({ edited: true });
  };

  applyBondsToFiles = async () => {
    if (!this.state.files){
      console.warn("Files should be loaded into component to apply bonds")
      return
    }
    const files = this.state.files
    const itps = [...files.itps]
    if (files.go){
    
      const to_replace = await files.go.toOriginalFiles(); 

      for (const mol_file of to_replace!) {
        const index = itps.findIndex(e => e.name === mol_file.file.name);
        const m_file: MartinizeFile = {
          name: mol_file.file.name,
          content: mol_file.file,
          type: 'chemical/x-include-topology',
          mol_idx : mol_file.mol_idx

        };

        if (index !== -1) {
          itps[index] = m_file;
        }
        else {
          itps.push(m_file);
        }

        this.setState({files: {
          top : this.state.files.top,
          pdb : this.state.files.pdb,
          radius : this.state.files.radius, 
          elastic_bonds : this.state.files.elastic_bonds,
          itps, 
          go : this.state.files.go
          }
        })

      }

    }
  }

  downloadMolecule = async () => {
    if (!this.state.files){
      console.warn("files should be loaded into component to download them.")
      return; 
    }

    const zip = new JSZip(); 
    const files = this.state.files
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

    const original_name = this.state.all_atom_pdb!.name
    const name = original_name.slice(0, original_name.indexOf('.pdb')) + '-CG'

    downloadBlob(generated, name + '.zip');
  }

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

  getMartinizeVersion() {
    const socket = SocketIo.connect(SERVER_ROOT);
    socket.on('martinizeVersion', (data: any) => {
      this.setState({version: data}, ()=>{});
    })  
  }

  changeCommandline(value: string) {
    if (this.state.advanced === 'true') {
      this.setState({commandline: value}, () => {})
    } else {
      const s = this.state
      const socket = SocketIo.connect(SERVER_ROOT);
      const form_data: any = {};

      form_data.ff = s.builder_force_field;
      form_data.position = s.builder_positions;
      form_data.cter = s.cTer;
      form_data.nter = s.nTer;
      form_data.sc_fix = s.sc_fix;
      form_data.cystein_bridge = s.cystein_bridge;
      form_data.advanced = s.advanced;

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
      
      // WTF ?? 
      socket.emit('previewMartinize', form_data); 
      socket.on('martinizePreviewContent', (data: any) => {
        this.setState({commandline: data}, () => {})
      })
    }
  }

  render() {
    const classes = this.props.classes;
    const is_dark = this.state.theme.palette.type === 'dark';

    if (Settings.logged === LoginStatus.None) {
      return <EmbeddedError title="Forbidden" text="You can't access the Molecule Builder page without account. New accounts for using beta versions of Molecule Builder will be available starting September 1st 2021." />
    }

    return (
      <ThemeProvider theme={this.state.theme}>
        {this.renderModalBackToDatabase()}
        <BetaWarning/>
        
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
                <Typography component="h1" variant="h3" align="center" style={{ fontWeight: 700, fontSize: '2.5rem', marginBottom: '0rem' }}>
                  Martinize a molecule
                </Typography>
                <Typography variant="subtitle1" align="center" style={{fontSize: '0.7rem', fontStyle: 'italic', marginBottom: '1rem'}}>
                  {this.state.version}
                </Typography>

                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <Link 
                    href="#!" 
                    // When state is initial state (main loader), don't show the confirm modal
                    onClick={this.state.running !== 'pdb' ? this.onWantGoBack : this.onGoBack}  
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

              {/* Forms... */}
              {this.state.running === 'pdb' && <LoadPdb 
                onFileSelect={this.onFileSelect}
                error={this.state.error}
              />}

              {this.state.running === 'pdb_read' && this.allAtomLoading()}

              {(this.state.running === 'martinize_params' || this.state.running === 'martinize_error') && <MartinizeForm 
                martinizeError={this.state.martinize_error}
                onBuilderModeChange={value => this.setState({ builder_mode: value as any }, () => {this.changeCommandline(value)})}
                onBuilderPositionChange={value => this.setState({ builder_positions: value as any }, () => {this.changeCommandline(value)})}
                onForceFieldChange={(value : AvailableForceFields) => this.setState({ builder_force_field: value }, () => {this.changeCommandline(value)})}
                onMartinizeBegin={this.handleMartinizeBegin}
                onReset={() => this.reset()}
                onElasticChange={(type, value) => {
                  // @ts-ignore
                  this.setState({ [type]: value }, () => {this.changeCommandline(value)})
                }}
                onAdvancedChange={value => {this.changeCommandline(value)}}
                builderForceField={this.state.builder_force_field}
                builderMode={this.state.builder_mode}
                builderPosition={this.state.builder_positions}
                builderEa={this.state.builder_ea}
                builderEf={this.state.builder_ef}
                builderEl={this.state.builder_el}
                builderEm={this.state.builder_em}
                builderEp={this.state.builder_ep}
                builderEu={this.state.builder_eu}
                cTer={this.state.cTer}
                nTer={this.state.nTer}
                sc_fix={this.state.sc_fix}
                cystein_bridge={this.state.cystein_bridge}
                advanced={this.state.advanced}
                commandline={this.state.commandline}
                advancedActivate={() => {if(this.state.advanced === 'true') {
                  this.setState({advanced: 'false'}, () => this.changeCommandline(''))
                } else {
                  this.setState({advanced: 'true'})
                }}}
                doSendMail={(bool) => this.setState({send_mail:bool})}
              />}

              {this.state.running === 'martinize_generate' && this.martinizeGenerating()}

              {this.state.running === 'done' && <MartinizeGenerated 

                martinizeWarnings={this.state.files?.warnings}
                onReset={() => this.reset()}
                theme={this.state.theme}
                allAtomName={this.state.all_atom_pdb!.name.split('.')[0]}
                onThemeChange={this.onThemeChange}
                virtualLinks={this.state.builder_mode === 'classic' ? '' : this.state.builder_mode}
                allAtomOpacity={this.state.all_atom_opacity}
                allAtomVisible={this.state.all_atom_visible}
                onAllAtomOpacityChange={this.onAllAtomOpacityChange}
                onAllAtomVisibilityChange={this.onAllAtomVisibilityChange}
                onMoleculeDownload={this.onMoleculeDownload}
                //onSave={name => this.save(name)}
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
                edited={this.state.edited}
                generatingFiles={this.state.generating_files}
                onGoEditorStart={this.onGoEditorStart}
              />}

              {this.state.running === 'go_editor' && <GoEditor 
                stage={this.ngl}
                cgCmp={this.state.coarse_grain_ngl!}
                onBondRemove={this.onBondRemove}
                onBondCreate={this.onBondCreate}
                onAllBondRemove={this.onAllBondRemove}
                onValidate={this.onGoEditorValidate}
                onCancel={this.onGoEditorCancel}
                onRedrawGoBonds={this.redrawGoBonds}
                setColorForCgRepr={this.setSchemeIdColorForCg}
                onBondCreateFromSet={this.onBondCreateFromSet}
                onBondRemoveFromSet={this.onBondRemoveFromSet}
                onGoHistoryBack={this.onGoHistoryBack}
                onGoHistoryRevert={this.onGoHistoryRevert}
                goInstance={this.state.files!.go!}
                mode={this.state.builder_mode}
                onHistoryDownload={this.onHistoryDownload}
              />}
            </div>
          </Grid>
          
          <Grid item sm={4} md={8}>
            {this.state.running === 'load_error' && 
              <Alert severity="error">{this.state.load_error_message}</Alert>
            }
            <div id="ngl-stage" style={{ height: 'calc(100% - 5px)' }}/> 
                      
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
/*function martinizeOutputParser(input: string) : { 
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
}*/

// @ts-ignore
window.Buffer = Buffer;
