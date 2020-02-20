import React from 'react';
import { Molecule } from '../../types/entities';
import { Marger, dateFormatter } from '../../helpers';
import { Link as RouterLink } from 'react-router-dom';
import { Typography, makeStyles, Link } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  version: {
    fontSize: '1.1rem',
  },
  alias: {
    fontSize: '1.3rem',
  },
}));

export default function MoleculeParent(props: { parent?: Molecule }) {
  const classes = useStyles();

  if (!props.parent) {
    return (
      <div style={{ margin: '1.5rem 0' }}>
        <Typography variant="h6">
          This molecule doesn't have any parent.
        </Typography>
      </div>
    );
  }

  const { parent } = props;

  function formatVersion(molecule: Molecule) {
    return molecule.version;
  }

  function formatDetails(molecule: Molecule) {
    return `Martinize ${molecule.martinize_version}, ${molecule.force_field} (created on ${dateFormatter("Y-m-d", new Date(molecule.created_at))})`;
  }

  return (
    <div>
      <Marger size="1.5rem" />

      <Typography variant="h4">
        Parent
      </Typography>

      <Marger size=".5rem" />

      <Typography className={classes.alias}>
        <Link 
          to={"/molecule/" + parent.alias + "?version=" + parent.id} 
          component={RouterLink}
        >
          <strong>{formatVersion(parent)}</strong> 
          <Typography 
            variant="body2" 
            color="textSecondary" 
            component="span" 
            className={classes.version}
          >
            {" "}- {formatDetails(parent)}
          </Typography>
        </Link>
      </Typography>

      <Marger size="1.5rem" />
    </div>
  );
}
