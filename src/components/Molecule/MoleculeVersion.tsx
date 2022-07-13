import React from 'react';
import { Molecule } from '../../types/entities';
import { Marger } from '../../helpers';
import { Typography, makeStyles, Link, Icon } from '@material-ui/core';
import { TreeView, TreeItem } from '@material-ui/lab';
import Settings from '../../Settings';
import clsx from 'clsx';
import AddMolecule from '../AddMolecule/AddMolecule';

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
  comments: {
    whiteSpace: 'pre-line',
    height: '400px',
    overflowY: 'scroll',
    outline: '0.01rem dashed',
    padding: '0.3rem',
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
  versionTitle: {
    display:"flex",
    gap:"1rem", 
    alignItems : "center"
  }
}));

interface MoleculeTree {
  molecule: Molecule;
  children: MoleculeTree[];
}

function createMoleculeTree(molecules: Molecule[]): MoleculeTree {
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

  const [newVersion, setNewVersion] = React.useState(false);
  const [parent, setParent] = React.useState<Molecule|undefined>(undefined);  

  const classes = useStyles();

  function formatVersion(molecule: Molecule) {
    return molecule.version;
  }

  function formatDetails(molecule: Molecule) {
    return `${Settings.martinize_variables.create_way[molecule.create_way]}, ${molecule.force_field}`;
  }

  function renderMoleculeLabel(molecule: Molecule) {
    if (molecule.version === "root") return (
      <Typography component="span" className={classes.alias}>
        <strong> {molecule.name} ({molecule.alias})</strong>
      </Typography>
    )

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
          <strong>{formatVersion(molecule)}</strong> • ({formatDetails(molecule)}) <Link onClick={() => { setNewVersion(true); setParent(molecule)}} style={{ color: "orange", fontSize: "small" }}> <Icon style={{ fontSize: "x-small" }} className={clsx("fas", "fa-plus", classes.linkIcon)} /> Add a derived model </Link>
        </Link>
      </Typography>
    );
  }

  function handleMoleculeClick(molecule: Molecule) {
    const link = document.getElementById('link-to-' + molecule.id);

    if (link) {
      link.click();
    }
  }

  function renderTreeItem(tree: MoleculeTree) {
    return (
      <TreeItem
        onClick={() => handleMoleculeClick(tree.molecule)}
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

  function createTreesAndIds(mols: Molecule[]) {
    const trees: { [ff: string]: MoleculeTree[] } = {}
    const mol_ids: { [ff: string]: string[] } = {}
    const ffs = new Set(mols.map(mol => mol.force_field))
    for (const ff of ffs) {
      trees[ff] = []
      const ffMols = mols.filter(mols => mols.force_field === ff)
      const roots = ffMols.filter(mol => mol.parent === null)
      const notRoots = ffMols.filter(mol => mol.parent !== null)
      for (const root of roots){
        const rootVersion = root.version.split(".")[0]
        const notRootsVersion = notRoots.filter(mol => mol.version.split(".")[0] === rootVersion)
        trees[ff].push(createMoleculeTree([root].concat(notRootsVersion)))
      }
      
      mol_ids[ff] = ffMols.map(m => m.id)

    }
    return { trees, mol_ids }
  }

  const { trees, mol_ids } = React.useMemo(() => createTreesAndIds(props.versions), [props]);

  return (
    <div>
      <Marger size="1.5rem" />

      <div className={classes.versionTitle}>
        <Typography variant="h4">
          Versions
        </Typography>

        <Link className={classes.link} style={{ color: "orange" }} onClick={() => setNewVersion(true)}>
          <Icon className={clsx("fas", "fa-plus", classes.linkIcon)} />
          <span>
            Add a new model
          </span>
        </Link>
      </div>



      <Marger size="1.5rem" />
      {Object.entries(trees).map((obj) => {
        return (
          <div>
            <span> {obj[0]} </span>
            {obj[1].map(molTree => {
              return(
              <TreeView expanded={mol_ids[obj[0]]} >
                {renderTreeItem(molTree)}
              </TreeView>)
            })}
            
          </div>

        )
      })}

      <Marger size="1.5rem" />
      {newVersion && <AddMolecule
        parent={parent}
        model={!parent ? { name: props.current.name, alias: props.current.alias, smiles: props.current.smiles, category: props.current.category, tree_id: props.current.tree_id } : undefined}
        versions={props.versions}
        open
        onClose={() => {setNewVersion(false); setParent(undefined)}}
        onChange={() => {
          setNewVersion(false);
          setParent(undefined)
        }}
      />}
    </div>
  );
}
