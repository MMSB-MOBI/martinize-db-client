import React from 'react';
import { Molecule } from '../../types/entities';
import { Marger } from '../../helpers';
import { Typography, makeStyles, Link } from '@material-ui/core';
import { TreeView, TreeItem } from '@material-ui/lab';

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
  moleculeLink: {
    "&:hover": {
      textDecoration: 'none',
    },
  },
  contentTree: {
    backgroundColor: 'unset !important',
  },
}));

interface MoleculeTree {
  molecule: Molecule;
  children: MoleculeTree[];
}

function createMoleculeTree(molecules: Molecule[]) : MoleculeTree {
  const root = molecules.find(m => m.parent === null);
  if (!root) {
    return {
      molecule: molecules[0],
      children: []
    };
  }

  const id_to_mol: { [id: string]: MoleculeTree } = {};

  id_to_mol[root.id] = {
    molecule: root,
    children: []
  };
  
  for (const mol of molecules) {
    if (mol.id in id_to_mol) {
      continue;
    }

    if (mol.parent === null) {
      // Root is already added
      continue;
    }

    if (mol.parent in id_to_mol) {
      id_to_mol[mol.parent].children.push({
        molecule: mol,
        children: []
      });
    }
    else {
      const parent = molecules.find(m => m.id === m.parent)!;
      id_to_mol[mol.parent] = {
        molecule: parent,
        children: [{
          molecule: mol,
          children: []
        }]
      };
    }
  }

  return id_to_mol[root.id];
}

export default function MoleculeVersion(props: { versions: Molecule[], current: Molecule, onVersionChange: (id: string) => void }) {
  const classes = useStyles();

  function formatVersion(molecule: Molecule) {
    return molecule.version;
  }

  function formatDetails(molecule: Molecule) {
    return `Martinize ${molecule.martinize_version}, ${molecule.force_field}`;
  }

  function renderMoleculeLabel(molecule: Molecule) {
    return (
      <Typography component="span" className={classes.alias}>
        <Link 
          href={"/molecule/" + molecule.alias + "?version=" + molecule.id} 
          className={classes.moleculeLink}
          id={"link-to-" + molecule.id} 
          color={molecule.id === props.current.id ? "secondary" : "primary"}
          onClick={(e: React.MouseEvent<any>) => {
            e.preventDefault();
            props.onVersionChange(molecule.id);
          }}
        >
          <strong>{formatVersion(molecule)}</strong> • ({formatDetails(molecule)})
        </Link>
      </Typography>
    );
  }

  function handleMoleculeClick(molecule_id: string) {
    const link = document.getElementById('link-to-' + molecule_id);

    if (link) {
      link.click();
    }
  }

  function renderTreeItem(tree: MoleculeTree) {
    return (
      <TreeItem 
        onClick={() => handleMoleculeClick(tree.molecule.id)} 
        key={tree.molecule.id} 
        nodeId={tree.molecule.id} 
        label={renderMoleculeLabel(tree.molecule)}
        classes={{
          content: classes.contentTree
        }}
      >
        {tree.children.length ? tree.children.map(m => renderTreeItem(m)) : null}
      </TreeItem>
    );
  }

  const tree = React.useMemo(() => createMoleculeTree(props.versions), [props]);
  const mol_ids = props.versions.map(v => v.id);

  return (
    <div>
      <Marger size="1.5rem" />

      <Typography variant="h4">
        Versions
      </Typography>

      <Marger size="1.5rem" />

      <TreeView expanded={mol_ids}>
        {renderTreeItem(tree)}
      </TreeView>

      <Marger size="1.5rem" />
    </div>
  );
}