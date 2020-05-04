import React from 'react';
import { Molecule } from '../../types/entities';
import { Marger } from '../../helpers';
import { Typography, makeStyles, Link } from '@material-ui/core';
import { TreeView, TreeItem } from '@material-ui/lab';
import Settings from '../../Settings';

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

  const id_to_mol: { [id: string]: Molecule } = {};
  const tree: { [id: string]: MoleculeTree } = {};

  for (const mol of molecules) {
    id_to_mol[mol.id] = mol;
  }  

  // Root will always be the first element of object
  // Other elements will be "fast access" nodes
  tree[root.id] = {
    molecule: root,
    children: []
  };

  function insertInTree(node: MoleculeTree) {
    tree[node.molecule.id] = node;

    if (node.molecule.parent! in tree) {
      // case: parent is inserted
      tree[node.molecule.parent!].children.push(node);
    }
    else {      
      // Otherwise, insert until find 
      const parent_mol = {
        molecule: id_to_mol[node.molecule.parent!],
        children: [node]
      };

      insertInTree(parent_mol);
    }
  }
  
  for (const mol of molecules) {
    if (mol.id in tree) {
      continue;
    }

    if (mol.parent === null) {
      // Root is already added
      continue;
    }

    const mol_data = {
      molecule: mol,
      children: []
    };
    insertInTree(mol_data);
  }

  // Return the root
  return tree[root.id];
}

export default function MoleculeVersion(props: { versions: Molecule[], current: Molecule, onVersionChange: (id: string) => void }) {
  const classes = useStyles();

  function formatVersion(molecule: Molecule) {
    return molecule.version;
  }

  function formatDetails(molecule: Molecule) {
    return `${Settings.martinize_variables.create_way[molecule.create_way]}, ${molecule.force_field}`;
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
