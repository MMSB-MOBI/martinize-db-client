import React from 'react';
import { BaseMolecule, Molecule, StashedMolecule } from '../../types/entities';
import { Dialog, Slide, Button, Container, AppBar, Toolbar, IconButton, Typography, TextField, Link, withStyles, DialogTitle, DialogContent, DialogContentText, CircularProgress, DialogActions } from '@material-ui/core';
import { TransitionProps } from '@material-ui/core/transitions/transition';
import { LoadFader, SimpleSelect } from '../../Shared';
import CloseIcon from '@material-ui/icons/Close';
import Settings from '../../Settings';
import { flattenCategoryTree, getErrorMsgFromValidationError, Marger, notifyError } from '../../helpers';
import { toast } from '../Toaster';
import AddMoleculeFileInput, { MoleculeFilesInput } from './AddMoleculeFileInput';
import ApiHelper from '../../ApiHelper';
import { SERVER_ROOT } from '../../constants';
import { SettingsJson } from '../../types/settings';
import TopCreator from './TopCreator';
import { MultipleSelect } from '../Explore/ExploreFilters';

interface AddMoleculeProps {
  /**
   * This is the molecule to edit. This will set all the fields.
   * If this prop is not specify, it assume new molecule mode.
   */
  from?: BaseMolecule,
  /**
   * This is the parent of the current added/edited molecule.
   * This will determine which field is editable.
   */
  parent?: Molecule,
  open: boolean,
  /** When user cancel the molecule modification. */
  onClose: () => void,
  /** When user has added/modified a molecule, and the server has successfully received it. */
  onChange: (modified: StashedMolecule | Molecule) => void,
  stashed?: boolean,
  classes: Record<string, string>;
}

const Transition = React.forwardRef<unknown, TransitionProps>(function Transition(props, ref) {
  // @ts-ignore
  return <Slide direction="up" ref={ref} {...props} />;
});

interface AddMoleculeState {
  files: string | MoleculeFilesInput;
  name: string;
  alias: string;
  smiles: string;
  category: string[];
  command_line: string;
  version: string;
  comments: string;
  validation: string;
  citation: string;
  create_way: string;
  force_field: string;
  loading: boolean;
  top_creator: boolean;

  complete: BaseMolecule | false;
}

class AddMolecule extends React.Component<AddMoleculeProps, AddMoleculeState> {
  protected settings = Settings.martinize_variables;
  protected form_ref = React.createRef<HTMLFormElement>();
  protected saved_settings?: [SettingsJson, { id: string, name: string }[]];

  constructor(props: AddMoleculeProps) {
    super(props);

    this.state = {
      loading: false,
      files: props.from?.files ?? "",
      name: props.from?.name ?? (props.parent?.name ?? ""),
      alias: props.from?.alias ?? (props.parent?.alias ?? ""),
      smiles: props.from?.smiles ?? (props.parent?.smiles ?? ""),
      category: props.from?.category ?? (props.parent?.category ?? [""]),
      command_line: props.from?.command_line ?? "",
      version: props.from?.version ?? "",
      comments: props.from?.comments ?? "",
      validation: props.from?.validation ?? "",
      citation: props.from?.citation ?? "",
      create_way: props.from?.create_way ?? "",
      force_field: props.from?.force_field ?? "",
      top_creator: false,
      complete: false,
    };
  }

  componentDidUpdate(old_props: AddMoleculeProps) {
    if (this.props === old_props)
      return;

    const props = this.props;

    if (props.from) {
      this.setState({
        files: props.from.files,
        name: props.from.name,
        alias: props.from.alias,
        smiles: props.from.smiles,
        category: props.from.category,
        command_line: props.from.command_line,
        version: props.from.version,
        comments: props.from.comments,
        create_way: props.from.create_way,
        force_field: props.from.force_field,
        loading: false,
        top_creator: false
      });
    }
    else {
      if (props.parent) {
        this.setState({
          name: props.parent.name,
          alias: props.parent.alias,
          smiles: props.parent.smiles,
          category: props.parent.category,
        });
      }
      else {
        this.setState({
          name: "",
          alias: "",
          smiles: "",
          category: [],
        });
      }

      this.setState({
        files: "",
        command_line: "",
        version: "",
        comments: "",
        create_way: "",
        force_field: "",
        loading: false,
        top_creator: false
      });
    }
  }

  get is_disabled() {
    if (this.props.parent) {
      return true;
    }
    return false;
  }

  get categories() {
    if (!this.saved_settings || this.settings !== this.saved_settings[0]) {
      this.saved_settings = [this.settings, flattenCategoryTree(this.settings.category_tree)];
    }

    return this.saved_settings[1];
  }

  onSave = () => {
    // Send molecule to API
    // Check form data
    const form = this.form_ref.current!;
    const { files, name, alias, category, create_way, version, force_field } = this.state;

    if (typeof files === 'object') {
      if (files.itp.length === 0) {
        return toast("At least one ITP is required.", "error");
      }
      if (!files.pdb) {
        return toast("PDB/GRO file is required.", "error")
      }
    }
    else if (!files) {
      return toast("You must specify at least one ITP and PDB/GRO file.", "error");
    }

    if (!category) {
      return toast("Molecule category is required.", "error")
    }
    if (!force_field) {
      return toast("Targeted force field is required.", "error")
    }

    if (!form.checkValidity()) {
      if (!name) {
        return toast("Molecule name is required.", "error")
      }
      if (!alias) {
        return toast("Molecule alias is required.", "error")
      }
      if (!create_way) {
        return toast("Create way is required.", "error")
      }
      if (!version) {
        return toast("You must specify a molecule version name.", "error")
      }

      return toast("Form is not valid. Please check the fields.", "warning");
    }

    if (typeof files === 'object' && !files.top) {
      this.setState({ top_creator: true });
      return;
    }

    this.sendMolecule();
  };

  sendMolecule() {
    const { files, name, alias, category, create_way, version, force_field, command_line, comments, validation, citation, smiles } = this.state;

    let partial_molecule: Partial<Molecule> & { itp?: File[], pdb?: File, top?: File, map?: File[] } = {
      name,
      alias,
      smiles,
      version,
      category,
      command_line,
      comments,
      create_way,
      force_field,
      validation,
      citation,
    };

    if (this.props.from) {
      partial_molecule = { ...this.props.from, ...partial_molecule };
    }
    else if (this.props.parent) {
      partial_molecule.parent = this.props.parent.id;
    }
    
    if (typeof files === 'object') {
      partial_molecule.itp = files.itp;
      partial_molecule.pdb = files.pdb;
      partial_molecule.map = files.map;

      if (files.top)
        partial_molecule.top = files.top;
    }
    else {
      // This is a file ID reference, only for edit mode.
      partial_molecule.files = files;
    }

    this.setState({ loading: true })

    if (this.props.from) {
      if (this.props.stashed) {
        // @ts-ignore
        partial_molecule.stashed = "1";
      }

      ApiHelper.request((this.props.stashed ? 'moderation' : 'molecule') + '/edit', {
        method: 'POST', 
        parameters: partial_molecule,
        body_mode: 'multipart',
      })
        .then((mol: BaseMolecule) => {
          this.setState({ complete: mol });
        })
        .catch((e) => {
          if(Array.isArray(e) && e.length > 1 && e[1].errorCode && e[1].errorCode === "PARAMS_VALIDATION_ERROR"){
            const msg = getErrorMsgFromValidationError(e[1].e)
            toast(msg, "error") 
          }
          else notifyError(e)
          })
        .finally(() => {
          this.setState({ loading: false });
        });
    }
    else {
      ApiHelper.request('molecule/create', {
        method: 'POST', 
        parameters: partial_molecule,
        body_mode: 'multipart',
      })
        .then((mol: BaseMolecule) => {
          this.setState({ complete: mol });
        })
        .catch((e) => {
          if(Array.isArray(e) && e.length > 1 && e[1].errorCode && e[1].errorCode === "PARAMS_VALIDATION_ERROR"){
            const msg = getErrorMsgFromValidationError(e[1].e)
            toast(msg, "error") 
          }
          else notifyError(e)
          })
        .finally(() => {
          this.setState({ loading: false });
        });
    }
  };

  complete = () => {
    if (this.state.complete)
      this.props.onChange(this.state.complete);

    this.setState({ complete: false });
  };

  renderTopCreator() {
    if (typeof this.state.files === 'object') {
      const files = this.state.files;

      return (
        <TopCreator 
          open={this.state.top_creator}
          itpFiles={files.itp}
          onCancel={() => this.setState({ top_creator: false })}
          onValidate={file => {
            this.setState({
              files: { ...files, top: file },
              top_creator: false,
            }, () => this.sendMolecule());
          }}
        />
      );
    }
    return <React.Fragment />;
  }

  render() {
    const classes = this.props.classes;
    const props = this.props;
    const { loading, files, force_field, name, alias, category, smiles, complete } = this.state;

    return (
      <Dialog fullScreen open={props.open} TransitionComponent={Transition} disableEscapeKeyDown>
        {loading && <WaiterModal 
          open
          title="Saving molecule..." 
          content={`
            Please wait a bit, your molecule is being saved. 
            The server is validating fields and pre-process associated files. 
            This may take a while.
          `} 
        />}

        {complete && <CompleteModal 
          open
          title="Molecule submitted" 
          content={`
            Your molecule has been successfully submitted.
            ${this.props.from ? '' : 'A moderator will check and adjust submitted information, then your molecule will be publicly available.'}
          `} 
          onClose={this.complete}
        />}

        <AppBar>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={props.onClose}>
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}>
              {props.from ? "Edit " : "Add "} a molecule
            </Typography>
            <Button color="inherit" onClick={this.onSave}>
              save
            </Button>
          </Toolbar>
        </AppBar>

        {this.renderTopCreator()}
  
        <LoadFader when={loading}>
          <Container className={classes.root}>
            <form ref={this.form_ref} onSubmit={e => e.preventDefault()}>
              <Marger size={16} />
  
              <Typography variant="h5">
                Define here the details of your molecule.
              </Typography>
  
              <Marger size=".5rem" />
  
              <Typography variant="body2">
                Fields marked with an asterisk (*) are mandatory.
              </Typography>
  
              <Marger size="1.5rem" />
  
              {/* Fixed elements when parent */}
              <Typography variant="h6">
                General information
              </Typography>
  
              <Marger size="1rem" />
  
              {props.parent && <Typography style={{ marginBottom: '1rem' }}>
                The following values are fixed by the parent molecule.
              </Typography>}
              <div className={classes.parentFixedBlock}>
                <TextField
                  label="Name" 
                  value={name}
                  onChange={v => this.setState({ name: v.target.value })}
                  variant="outlined"
                  disabled={this.is_disabled}
                  required
                />
  
                <TextField
                  label="Alias" 
                  value={alias}
                  onChange={v => this.setState({ alias: v.target.value })}
                  variant="outlined"
                  disabled={this.is_disabled}
                  required
                />
  
                <TextField
                  label="SMILES formula" 
                  value={smiles}
                  onChange={v => this.setState({ smiles: v.target.value })}
                  variant="outlined"
                  disabled={this.is_disabled}
                />  

                <MultipleSelect 
                  id="s-category-new"
                  label="Category"
                  onChange={v => this.setState({ category: v })}
                  options={this.categories.map(e => ({ value: e.id, label: e.name }))} 
                  value={category}
                  disabled={this.is_disabled}
                  required
                />
              </div>
  
              <Marger size="2rem" />
  
              <Typography variant="h6">
                About this version
              </Typography>
  
              <Marger size="1rem" />
  
              {/* Variable elements between each version */}
              <div className={classes.commandLineAndVersionBlock}>
                <TextField
                  label="Citations" 
                  placeholder="PubMed IDs, authors..."
                  value={this.state.citation}
                  onChange={v => this.setState({ citation: v.target.value })}
                  variant="outlined"
                  required
                />
  
                <div className={classes.martinizeVersionForceFieldBlock}>
                  <TextField
                    label="Command line" 
                    placeholder="If a software has been used"
                    value={this.state.command_line}
                    onChange={v => this.setState({ command_line: v.target.value })}
                    variant="outlined"
                  />
  
                  <TextField
                    label="Molecule Version" 
                    placeholder="Unique number to identify molecule"
                    value={this.state.version}
                    onChange={v => this.setState({ version: v.target.value })}
                    variant="outlined"
                    required
                  />
                </div>
              </div>
  
              <Marger size="1rem" />
  
              <div className={classes.martinizeVersionForceFieldBlock}>
                <SimpleSelect 
                  id="s-martinize-creation-new"
                  label="Creation way"
                  onChange={v => this.setState({ create_way: v })}
                  values={Object.entries(this.settings.create_way).map(([id, name]) => ({ id, name }))}
                  value={this.state.create_way}
                  required
                />
  
                <SimpleSelect
                  id="s-ff-v-new"
                  label="Used force field"
                  onChange={v => this.setState({ force_field: v })}
                  values={this.settings.force_fields.map(m => ({ id: m, name: m }))}
                  value={force_field}
                  required
                />
              </div>
  
              <Marger size="1rem" />
  
              <div>
                <TextField
                  label="Validation information" 
                  value={this.state.validation}
                  onChange={v => this.setState({ validation: v.target.value })}
                  variant="outlined"
                  fullWidth
                />
              </div>
  
              <Marger size="1rem" />
  
              <div className={classes.commentsBlock}>
                <TextField
                  label="Comments" 
                  value={this.state.comments}
                  onChange={v => this.setState({ comments: v.target.value })}
                  variant="outlined"
                  multiline
                  rows="4"
                  className={classes.commentInput}
                />
              </div>
  
              <Marger size="1.5rem" />
  
              {/* Attached files */}
              <Typography variant="h6">
                Attached files
              </Typography>
                
              {(!files || typeof files !== 'string') && <div>
                <Marger size="1rem" />
  
                <AddMoleculeFileInput
                  showMap 
                  useGrid
                  optionalTop
                  onChange={files => this.setState({ files })}
                />
              </div>}
  
              {(files && typeof files === 'string') && <div>
                <Typography>
                  A ZIP file is attached to this molecule. {" "}
                  <Link href={SERVER_ROOT + "api/molecule/download?id=" + files + "&filename=files.zip"} style={{ fontSize: '1.2rem' }}>
                    <span>
                      Download
                    </span>
                  </Link>
                </Typography>
  
                <Marger size="1rem" />
  
                <Button variant="outlined" onClick={() => this.setState({ files: "" })} color="secondary">
                  Delete related files
                </Button>
              </div>}
  
              <Marger size="2.5rem" />
            </form>
          </Container>
        </LoadFader>
      </Dialog>
    );
  }
}

export default withStyles(theme => ({
  root: {
    [theme.breakpoints.down('xs')]: {
      paddingTop: '56px',
    },
    paddingTop: '64px',
  },
  title: {
    marginLeft: theme.spacing(2),
    flex: 1,
  },
  formControl: {
    minWidth: 180,
  },
  parentFixedBlock: {
    display: 'grid',
    gap: '15px',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    width: '100%',
  },
  commandLineAndVersionBlock: {
    display: 'grid',
    gap: '2%',
    gridTemplateColumns: '49% 49%',
    width: '100%',
  },
  martinizeVersionForceFieldBlock: {
    display: 'grid',
    gap: '2%',
    gridTemplateColumns: '49% 49%',
    width: '100%',
  },
  commentsBlock: {
    width: '100%',
  },
  commentInput: {
    width: '100%',
  },
}))(AddMolecule);

function WaiterModal(props: { open: boolean, title: string, content: string, onClose?: () => void }) {
  return (
    <Dialog open={props.open} onClose={props.onClose} >
      <DialogTitle>
        {props.title}
      </DialogTitle>

      <DialogContent>
        <div style={{ marginTop: '.5rem', textAlign: 'center', marginBottom: '2rem' }}>
          <CircularProgress size={56} />
        </div>

        <DialogContentText>
          {props.content}
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
}

function CompleteModal(props: { open: boolean, title: string, content: string, onClose: () => void }) {
  return (
    <Dialog open={props.open}>
      <DialogTitle>
        {props.title}
      </DialogTitle>

      <DialogContent>
        <DialogContentText>
          {props.content}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button style={{ color: 'green' }} onClick={props.onClose}>
          Complete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
