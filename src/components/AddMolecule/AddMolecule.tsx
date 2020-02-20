import React from 'react';
import { BaseMolecule, Molecule, StashedMolecule } from '../../types/entities';
import { Dialog, Slide, makeStyles, createStyles, Theme, Button, Container, AppBar, Toolbar, IconButton, Typography, TextField, FormControl, InputLabel, Select, MenuItem, Link } from '@material-ui/core';
import { TransitionProps } from '@material-ui/core/transitions/transition';
import { LoadFader } from '../../Shared';
import CloseIcon from '@material-ui/icons/Close';
import Settings from '../../Settings';
import { flattenCategoryTree, Marger, notifyError } from '../../helpers';
import { toast } from '../Toaster';
import AddMoleculeFileInput from './AddMoleculeFileInput';
import ApiHelper from '../../ApiHelper';
import { SERVER_ROOT } from '../../constants';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    appBar: {
      position: 'relative',
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
      gap: '15px',
      gridTemplateColumns: '3fr 1fr',
      width: '100%',
    },
    martinizeVersionForceFieldBlock: {
      display: 'grid',
      gap: '15px',
      gridTemplateColumns: '1fr 1fr',
      width: '100%',
    },
    commentsBlock: {
      width: '100%',
    },
    commentInput: {
      width: '100%',
    },
  }),
);

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
}

const Transition = React.forwardRef<unknown, TransitionProps>(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});


export default function AddMolecule(props: AddMoleculeProps) {
  // string if files are already set, File[] if we want to set new files.
  const [files, setFiles] = React.useState<string | { itp: File[], pdb: File | undefined }>(props.from?.files ?? "");
  
  const [name, setName] = React.useState(props.from?.name ?? (props.parent?.name ?? ""));
  const [alias, setAlias] = React.useState(props.from?.alias ?? (props.parent?.alias ?? ""));
  const [formula, setFormula] = React.useState(props.from?.formula ?? (props.parent?.formula ?? ""));
  // todo refine categories
  const [category, setCategory] = React.useState(props.from?.category ?? (props.parent?.category ?? ""));

  const [commandLine, setCommandLine] = React.useState(props.from?.command_line ?? "");
  const [version, setVersion] = React.useState(props.from?.version ?? "");
  const [comments, setComments] = React.useState(props.from?.comments ?? "");
  const [martinizeVersion, setMartinizeVersion] = React.useState(props.from?.martinize_version ?? "");
  const [forceField, setForceField] = React.useState(props.from?.force_field ?? "");

  const [loading, setLoading] = React.useState(false);
  const settings = Settings.martinize_variables;
  const categories = React.useMemo(() => flattenCategoryTree(settings.category_tree), [settings]);

  const classes = useStyles();
  const formRef = React.createRef<HTMLFormElement>();

  React.useEffect(() => {
    if (props.from) {
      setFiles(props.from.files);
      setName(props.from.name);
      setAlias(props.from.alias);
      setFormula(props.from.formula);
      setCategory(props.from.category);
      setCommandLine(props.from.command_line);
      setVersion(props.from.version);
      setComments(props.from.comments);
      setMartinizeVersion(props.from.martinize_version);
      setForceField(props.from.force_field);
      setLoading(false);
    }
    else {
      if (props.parent) {
        setName(props.parent.name);
        setAlias(props.parent.alias);
        setFormula(props.parent.formula);
        setCategory(props.parent.category);
      }
      else {
        setName("");
        setAlias("");
        setFormula("");
        setCategory("");
      }
      setFiles("");
      setCommandLine("");
      setVersion("");
      setComments("");
      setMartinizeVersion("");
      setForceField("");
      setLoading(false);
    }
  }, [props]);

  function isDisabled() {
    if (props.parent) {
      return true;
    }
    return false;
  }

  function sendMolecule() {
    // todo send molecule to API
    // Check form data
    const form = formRef.current!;

    if (typeof files === 'object') {
      if (files.itp.length === 0) {
        return toast("At least one ITP is required.", "error");
      }
      if (!files.pdb) {
        return toast("PDB file is required.", "error")
      }
    }
    else if (!files) {
      return toast("You must specify ITP and PDB files.", "error");
    }

    if (!form.checkValidity()) {
      if (!name) {
        return toast("Molecule name is required.", "error")
      }
      if (!alias) {
        return toast("Molecule alias is required.", "error")
      }
      if (!formula) {
        return toast("Molecule formula is required.", "error")
      }
      if (!category) {
        return toast("Molecule category is required.", "error")
      }
      if (!commandLine) {
        return toast("Used command line to generate files is required.", "error")
      }
      if (!martinizeVersion) {
        return toast("Martinize version is required.", "error")
      }
      if (!version) {
        return toast("You must specify a molecule version name.", "error")
      }
      if (!forceField) {
        return toast("Targeted force field is required.", "error")
      }

      return toast("Form is not valid. Please check the fields.", "warning");
    }

    let partial_molecule: Partial<Molecule> & { itp?: File[], pdb?: File } = {
      name,
      alias,
      formula,
      version,
      category,
      command_line: commandLine,
      comments,
      martinize_version: martinizeVersion,
      force_field: forceField,
    };

    if (props.from) {
      partial_molecule = { ...props.from, ...partial_molecule };
    }
    else if (props.parent) {
      partial_molecule.parent = props.parent.id;
    }
    if (typeof files === 'object') {
      partial_molecule.itp = files.itp;
      partial_molecule.pdb = files.pdb;
    }
    else {
      // This is a file ID reference, only for edit mode.
      partial_molecule.files = files;
    }

    setLoading(true);

    if (props.from) {
      if (props.stashed) {
        // @ts-ignore
        partial_molecule.stashed = "1";
      }

      ApiHelper.request((props.stashed ? 'moderation' : 'molecule') + '/edit', {
        method: 'POST', 
        parameters: partial_molecule,
        body_mode: 'multipart',
      })
        .then((mol: BaseMolecule) => {
          props.onChange(mol);
        })
        .catch(notifyError)
        .finally(() => {
          setLoading(false);
        });
    }
    else {
      ApiHelper.request('molecule/create', {
        method: 'POST', 
        parameters: partial_molecule,
        body_mode: 'multipart',
      })
        .then((mol: BaseMolecule) => {
          props.onChange(mol);
        })
        .catch(notifyError)
        .finally(() => {
          setLoading(false);
        });
    }
  } 

  return (
    <Dialog fullScreen open={props.open} TransitionComponent={Transition}>
      <AppBar className={classes.appBar}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={props.onClose}>
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            {props.from ? "Edit " : "Add "} a molecule
          </Typography>
          <Button autoFocus color="inherit" onClick={sendMolecule}>
            save
          </Button>
        </Toolbar>
      </AppBar>

      <LoadFader when={loading}>
        <Container>

          <form ref={formRef} onSubmit={e => e.preventDefault()}>
            <Marger size={16} />

            <Typography variant="h5">
              Define here the details of your molecule.
            </Typography>

            <Marger size="1.5rem" />

            {/* Fixed elements when parent */}
            <Typography variant="h6">
              Informations
            </Typography>

            <Marger size="1rem" />

            {props.parent && <Typography style={{ marginBottom: '1rem' }}>
              The following values are fixed by the parent molecule.
            </Typography>}
            <div className={classes.parentFixedBlock}>
              <TextField
                label="Name" 
                value={name}
                onChange={v => {
                  setName(v.target.value);
                }}
                variant="outlined"
                disabled={isDisabled()}
                required
              />

              <TextField
                label="Alias" 
                value={alias}
                onChange={v => {
                  setAlias(v.target.value);
                }}
                variant="outlined"
                disabled={isDisabled()}
                required
              />

              <TextField
                label="Formula" 
                value={formula}
                onChange={v => {
                  setFormula(v.target.value);
                }}
                variant="outlined"
                disabled={isDisabled()}
                required
              />  

              <SimpleSelect 
                id="s-category-new"
                label="Category"
                onChange={v => setCategory(v)}
                values={categories}
                value={category}
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
                label="Command line" 
                value={commandLine}
                onChange={v => {
                  setCommandLine(v.target.value);
                }}
                variant="outlined"
                required
              />

              <TextField
                label="Molecule Version" 
                value={version}
                onChange={v => {
                  setVersion(v.target.value);
                }}
                variant="outlined"
                required
              />
            </div>

            <Marger size="1rem" />

            <div className={classes.martinizeVersionForceFieldBlock}>
              <SimpleSelect 
                id="s-martinize-v-new"
                label="Martinize version"
                onChange={v => setMartinizeVersion(v)}
                values={settings.martinize_versions.map(m => ({ id: m, name: m }))}
                value={martinizeVersion}
              />

              <SimpleSelect 
                id="s-ff-v-new"
                label="Used force field"
                onChange={v => setForceField(v)}
                values={settings.force_fields.map(m => ({ id: m, name: m }))}
                value={forceField}
              />
            </div>

            <Marger size="1rem" />

            <div className={classes.commentsBlock}>
              <TextField
                label="Comments (optional)" 
                value={comments}
                onChange={v => {
                  setComments(v.target.value);
                }}
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
              <AddMoleculeFileInput 
                onChange={files => setFiles(files)}
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

              <Button onClick={() => setFiles("")} color="secondary">
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


function SimpleSelect(props: { label: string, value: string, onChange: (v: string) => void, id: string, values: { id: string, name: string }[], }) {
  const inputLabel = React.useRef<HTMLLabelElement>(null);
  const [labelWidth, setLabelWidth] = React.useState(0);
  React.useEffect(() => {
    if (inputLabel.current)
      setLabelWidth(inputLabel.current!.offsetWidth);
  }, [props]);

  return (
    <FormControl variant="outlined" style={{ minWidth: 180 }}>
      <InputLabel ref={inputLabel} id={props.id}>
        {props.label}
      </InputLabel>
      <Select
        labelId={props.id}
        value={props.value}
        onChange={v => props.onChange(v.target.value as string)}
        labelWidth={labelWidth}
        required
      >
        {props.values.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
      </Select>
    </FormControl>
  )
}
