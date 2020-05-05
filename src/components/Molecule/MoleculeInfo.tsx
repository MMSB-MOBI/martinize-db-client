import React, { Fragment } from 'react';
import { Molecule, StashedMolecule } from '../../types/entities';
import { Typography, makeStyles, Icon, Link, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Button, DialogContentText } from '@material-ui/core';
import Settings, { LoginStatus } from '../../Settings';
import { findInCategoryTree, Marger, dateFormatter, notifyError } from '../../helpers';
import { SERVER_ROOT } from '../../constants';
import clsx from 'clsx';
import AddMolecule from '../AddMolecule/AddMolecule';
import ApiHelper from '../../ApiHelper';
import { LoadFader } from '../../Shared';
import { toast } from '../Toaster';
import MoleculeViewer from './MoleculeViewer';

const useStyles = makeStyles(theme => ({
  name: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  version: {
    fontSize: '1.1rem',
  },
  title: {
    
  },
  infoWrapper: {
    display: 'grid',
    justifyContent: 'space-between',
    gridTemplateColumns: '47% 50%',
    rowGap: '1rem',
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: '1fr',
    },
  },
  alias: {
    fontSize: '1.3rem',
  },
  category: {
    fontSize: '1.1rem',
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      "& > *": {
        marginBottom: '.7rem',
      },
    },
  },
  link: {
    fontSize: '1.2rem',
  },
  linkIcon: {
    fontSize: '1.2rem',
    marginRight: '10px'
  },
}));

export default function MoleculeInfo<T extends StashedMolecule | Molecule>(props: { 
  molecule: T, 
  stashed?: boolean,
  onMoleculeChange: (molecule: T) => void,
  addOnStartup?: boolean,
  editOnStartup?: boolean,
  parent?: Molecule,
}) {
  const { molecule, stashed } = props;

  // Remember if you try to edit the molecule
  const [edit, setEdit] = React.useState(!!props.editOnStartup);

  // Remember if you try to delete a molecule
  const [deleteMol, setDeleteMol] = React.useState(false);

  // Remember if you try to accept a stashed molecule
  const [accept, setAccept] = React.useState(false);

  // Remember loading state
  const [loading, setLoading] = React.useState(false);

  // Remember if you try to add a child version
  const [newVersion, setNewVersion] = React.useState(!!props.addOnStartup);
  const classes = useStyles();

  /** DATES */
  const ca_date = dateFormatter("Y-m-d H:i", new Date(molecule.created_at));
  // @ts-ignore
  const lu_date = 'last_update' in molecule && dateFormatter("Y-m-d H:i", new Date(molecule.last_update));

  const show_last_update = !!lu_date && lu_date !== ca_date;
  const category = React.useMemo(() => findInCategoryTree(Settings.martinize_variables.category_tree, molecule.category), [molecule]);

  /** BUTTONS */
  let is_same_as_logged = false;
  if (Settings.user) {
    is_same_as_logged = Settings.user.id === molecule.owner;
  }

  const has_edit_button = Settings.logged === LoginStatus.Admin;
  const is_logged = Settings.logged > 1;
  const has_delete_button = Settings.logged === LoginStatus.Admin || is_same_as_logged;

  const deleteMolecule = () => {
    if (loading)
      return;

    setLoading(true);
    // todo make delete modal
    ApiHelper.request((props.stashed ? "moderation" : "molecule") + '/destroy/' + molecule.id, { method: 'DELETE' })
      .then(() => {
        window.location.pathname = "/explore";
      })
      .catch(notifyError)
      .finally(() => {
        setLoading(false);
      });
  };

  const acceptMolecule = () => {
    if (loading)
      return;
      
    setLoading(true);
    // todo make accept modal
    ApiHelper.request('moderation/accept', { method: 'POST', parameters: { id: molecule.id } })
      .then(() => {
        window.location.pathname = "/moderation";
      })
      .catch(notifyError)
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Fragment>
      <Marger size="1.5rem" />

      {/* Informations */}
      <div className={classes.infoWrapper}>
        <div>
          <Typography variant="h4" className={classes.title}>
            Informations
          </Typography>

          <Marger size="1rem" />

          <Typography className={classes.name}>
            {molecule.name}
          </Typography>

          <Typography className={classes.alias}>
            {molecule.alias}
          </Typography>

          <Typography className={classes.category}>
            {category}
          </Typography>

          {molecule.smiles && <Typography color="textSecondary">
            SMILES formula: <code>{molecule.smiles}</code>
          </Typography>}

          <Marger size="1rem" />

          <Typography component="pre">
            {molecule.comments}
          </Typography>

          <Marger size="1rem" />

          <Typography className={classes.version}>
            Version <strong>{molecule.version}</strong> created at {ca_date}.
          </Typography>

          {show_last_update && <Typography className={classes.version}>
            Last modified at <strong>{lu_date}</strong>.
          </Typography>}
        </div>

        <div>
          <MoleculeViewer id={molecule.files} />
        </div>
      </div>

      <Marger size="1.5rem" />
      <Divider />
      <Marger size="1.5rem" />

      {/* Details */}
      <Fragment>
        <Typography variant="h4" className={classes.title}>
          Details
        </Typography>

        <Marger size="1rem" />

        <div>
          {molecule.command_line && <React.Fragment>
            <Typography>
              Command line
            </Typography>
            <Typography component="pre">
              <code>{molecule.command_line}</code>
            </Typography>

            <Marger size="1rem" />
          </React.Fragment>}

          <Typography className={classes.version}>
            Created for force field <strong>{molecule.force_field}</strong> (<strong>{Settings.martinize_variables.create_way[molecule.create_way]}</strong>).
          </Typography>

          {molecule.validation && <Typography className={classes.version}>
            Validation informations: <strong>{molecule.validation}</strong>
          </Typography>}

          {molecule.citation && <Typography className={classes.version}>
            For using this molecule, please cite: <strong>{molecule.citation}</strong>
          </Typography>}
        </div>
      </Fragment>

      <Marger size="1rem" />

      {/* Buttons and download link */}
      <div className={classes.actionButtons}>
        {/* Download btn. Always available */}
        <Link href={SERVER_ROOT + "api/molecule/download?id=" + molecule.files + "&filename=" + molecule.alias + ".zip"} className={classes.link}>
          <Icon className={clsx("fas", "fa-download", classes.linkIcon)} />
          <span>
            Download files
          </span>
        </Link>

        {/* Edit icon. Available for administrators. */}
        {has_edit_button && <Link className={classes.link} onClick={() => setEdit(true)}>
          <Icon className={clsx("fas", "fa-pen", classes.linkIcon)} />
          <span>
            Edit
          </span>
        </Link>}

        {/* Delete button. Available for molecule owners and admins. */}
        {has_delete_button && <Link className={classes.link} color="secondary" onClick={() => setDeleteMol(true)}>
          <Icon className={clsx("fas", "fa-trash", classes.linkIcon)} />
          <span>
            Delete
          </span>
        </Link>}

        {/* Accept button. Available when {stashed}. */}
        {stashed && <Link className={classes.link} style={{ color: "green" }} onClick={() => setAccept(true)}>
          <Icon className={clsx("fas", "fa-check", classes.linkIcon)} />
          <span>
            Accept
          </span>
        </Link>}

        {/* Add button. Available when !{stashed}. */}
        {!stashed && is_logged && <Link className={classes.link} style={{ color: "orange" }} onClick={() => setNewVersion(true)}>
          <Icon className={clsx("fas", "fa-plus", classes.linkIcon)} />
          <span>
            Add a version
          </span>
        </Link>}
      </div>

      <Marger size="1.5rem" />

      {!newVersion && <AddMolecule
        from={molecule}
        open={edit}
        stashed={stashed}
        onClose={() => setEdit(false)}
        parent={props.parent}
        onChange={mol => {
          props.onMoleculeChange(mol as T);
          toast("Changes had been saved.", "success");
          setEdit(false);
        }}
      />}

      {newVersion && <AddMolecule
        parent={molecule as Molecule}
        open
        onClose={() => setNewVersion(false)}
        onChange={() => {
          toast("New molecule version has been submitted.", "success");
          setNewVersion(false);
        }}
      />}

      {deleteMol && <DeleteModal 
        onAccept={deleteMolecule}
        onClose={() => setDeleteMol(false)}
        loading={loading}
      />}

      {accept && <AcceptModal 
        onAccept={acceptMolecule}
        onClose={() => setAccept(false)}
        loading={loading}
      />}
    </Fragment>
  );
}

export function DeleteModal(props: { onAccept: () => void, onClose: () => void, loading: boolean, }) {
  return (
    <Dialog open onClose={props.loading ? undefined : props.onClose}>
      <DialogTitle>
        Delete this molecule ?
      </DialogTitle>

      <DialogContent>
        <LoadFader when={props.loading}>
          <DialogContentText>
            The molecule will be deleted and could not be restored. Do you want to continue ?
          </DialogContentText>
        </LoadFader>
      </DialogContent>
      
      <DialogActions>
        <LoadFader when={props.loading}>
          <Button color="primary" onClick={props.onClose}>
            Cancel
          </Button>
          <Button color="secondary" onClick={props.onAccept}>
            Delete
          </Button>
        </LoadFader>
      </DialogActions>
    </Dialog>
  );
}

function AcceptModal(props: { onAccept: () => void, onClose: () => void, loading: boolean, }) {
  return (
    <Dialog open onClose={props.loading ? undefined : props.onClose}>
      <DialogTitle>
        Accept molecule
      </DialogTitle>

      <DialogContent>
        <LoadFader when={props.loading}>
          <DialogContentText>
          The molecule will be publish to the database. Do you want to continue ?
          </DialogContentText>
        </LoadFader>
      </DialogContent>
      
      <DialogActions>
        <LoadFader when={props.loading}>
          <Button color="primary" onClick={props.onClose}>
            Cancel
          </Button>
          <Button style={{ color: "green" }} onClick={props.onAccept}>
            Accept
          </Button>
        </LoadFader>
      </DialogActions>
    </Dialog>
  );
}
