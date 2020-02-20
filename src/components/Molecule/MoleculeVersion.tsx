import React from 'react';
import { Molecule } from '../../types/entities';
import { Marger, dateFormatter } from '../../helpers';
import { Typography, makeStyles, List, ListItem, ListItemText, Link } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  name: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  version: {
    fontSize: '1.1rem',
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

export default function MoleculeVersion(props: { versions: Molecule[], current: Molecule, onVersionChange: (id: string) => void }) {
  const classes = useStyles();

  function formatVersion(molecule: Molecule) {
    return molecule.version;
  }

  function formatDetails(molecule: Molecule) {
    return `Martinize ${molecule.martinize_version}, ${molecule.force_field} (created on ${dateFormatter("Y-m-d", new Date(molecule.created_at))})`;
  }

  function specificity(molecule: Molecule) {
    let appended = "";
    if (molecule.id === props.current.id) {
      appended = " (current)";
    }
    else if (molecule.id === props.current.parent) {
      appended = " (parent)";
    }
    else if (molecule.parent === null) {
      appended = " (initial version)";
    }
    return appended;
  }

  return (
    <div>
      <Marger size="1.5rem" />

      <Typography variant="h4">
        Versions
      </Typography>

      <List dense>
        {props.versions.map(m => <ListItem key={m.version}>
          <ListItemText 
            primary={<Typography className={classes.alias}>
              <Link 
                href={"/molecule/" + m.alias + "?version=" + m.id} 
                onClick={(e: React.MouseEvent<any>) => {
                  e.preventDefault();
                  props.onVersionChange(m.id);
                }}
              >
                <strong>{formatVersion(m)} {specificity(m)}</strong>
              </Link>
            </Typography>} 
            
            secondary={<Typography variant="body2" color="textSecondary" className={classes.version}>
              {formatDetails(m)}
            </Typography>} />
        </ListItem>)}
      </List>

      <Marger size="1.5rem" />
    </div>
  );
}
