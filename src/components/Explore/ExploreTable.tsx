import React from 'react';
import { makeStyles, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, TableFooter, CircularProgress, createStyles, IconButton, TablePagination } from '@material-ui/core';
import clsx from 'clsx';
import FirstPageIcon from '@material-ui/icons/FirstPage';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import LastPageIcon from '@material-ui/icons/LastPage';
import { BaseMolecule } from '../../types/entities';
import { Link } from 'react-router-dom';
import { DeleteModal } from '../Molecule/MoleculeInfo';
import ApiHelper from '../../ApiHelper';
import { notifyError, findInCategoryTree, dateFormatter } from '../../helpers';
import Settings from '../../Settings';

const useStyles = makeStyles(theme => ({
  paperRoot: {
    width: '100%',
  },
  container: {
    //maxHeight: '80vh',
  },
  moleculeLink: {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    }
  },
  moleculeAccepted : {
    color : 'green',
    fontWeight: 'bold'
  },
  moleculeReview : {
    color : 'DarkOrange',
    fontWeight: 'bold'
  }
}));

interface Column {
  id: 'name' | 'alias' | 'category' | 'created_at' | 'version' | 'from_stashed' | 'owner';
  label: string;
  minWidth?: number;
  align?: 'right';
  format?: (value: any) => string;
}

export default function MoleculeTable(props: {
  loading?: boolean,
  molecules: BaseMolecule[],
  length: number,
  rowsPerPage: number,
  page: number,
  onChangePage: (page: number) => void,
  onMoleculeDelete?: (id: string) => void,
  moderation?: boolean,
  withVersion?: boolean,
  submission?: boolean; 
  }) {
    
  const classes = useStyles();
  const { loading, molecules, length, rowsPerPage, page, onChangePage } = props;
  const [deleteMol, setDeleteMol] = React.useState("");
  const [loadModal, setLoadModal] = React.useState(false);

  const categories = Settings.martinize_variables.category_tree;
  let columns: Column[] = [
    { id: 'name', label: 'Name', minWidth: 170 },
    { id: 'alias', label: 'Alias', minWidth: 100 },
    {
      id: 'category',
      label: 'Category',
      minWidth: 170,
      align: 'right',
      format: (value: string[]) => value.map(val => findInCategoryTree(categories, val)).join(', ')
    },
    {
      id: 'created_at',
      label: 'Created at',
      minWidth: 170,
      align: 'right',
      format: (value: string) => dateFormatter("Y-m-d H:i", new Date(value))
    }
  ];


  if (props.withVersion) {
    const version_column: Column = { id: 'version', label: 'Version' };

    columns = [...columns.slice(0, 2), version_column, ...columns.slice(2)];
  }

  if (props.submission) {
    const status_column : Column = {
      id : "from_stashed",
      label: 'Status',
      align: 'right',
      format: (value: string) => value ? "Under review" : "Accepted"
      
    }
    columns.push(status_column)
  }

  if (props.moderation) {
    const submitter_column : Column = {
      id : "owner",
      label : 'Submitted by', 
      align: "right"
    }
    columns.push(submitter_column)
  }
  
  const deleteMolecule = () => {
    if (loadModal)
      return;

    const mol_id = deleteMol;
    setLoadModal(true);
    ApiHelper.request((props.moderation ? "moderation" : "molecule") + '/destroy/' + mol_id, { method: 'DELETE' })
      .then(() => {
        if (props.onMoleculeDelete)
          props.onMoleculeDelete(mol_id);
      })
      .catch(notifyError)
      .finally(() => {
        setLoadModal(false);
        setDeleteMol("");
      });
  };

  return (
    <div>
      <Paper className={classes.paperRoot}>
        <TableContainer className={classes.container}>
          <Table stickyHeader aria-label="sticky table" size="small">
            <TableHead className={clsx("can-load", loading && "in")}>
              <TableRow>
                {/*props.moderation && <TableCell align="left" size="medium">
                  Actions
  </TableCell>*/}

                {columns.map(column => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    style={{ minWidth: column.minWidth }}
                    size="medium"
                  >
                    {column.label}
                  </TableCell> 
                ))}
              </TableRow>
            </TableHead>
            <TableBody className={clsx("can-load", loading && "in")}>
              {molecules.map(row => {
                return (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                    {/*props.moderation && <TableCell align="left">
                      <IconButton onClick={() => setDeleteMol(row.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>*/}

                    {/*<TableCell align="left" size="small">
                      <FormControlLabel
                        control={<Checkbox size="small" //icon={<CheckBoxOutlineBlank />} checkedIcon={<Checkbox />} 
                        name="checkedH" onClick={() => {
                          addMoleculesToDownload(row, molToDownload)
                          console.log(molToDownload)
                      }}/>}
                        label=''
                      />
                    </TableCell>*/}

                    {columns.map(column => {
                      const value = row[column.id]
                      const link = props.moderation ? "/stashed/" + row.id : "/molecule/" + row.alias + "?version=" + row.id;

                      return (
                        <TableCell 
                          key={column.id} 
                          align={column.align} 
                        >
                          {(column.id === 'name' || column.id === 'alias') && (!row.from_stashed) ?
                            <Link 
                              className={classes.moleculeLink} 
                              to={link}
                            >
                              {column.format ? column.format(value) : value}
                            </Link> : 
                            <div className={column.id === "from_stashed" ? row.from_stashed ? classes.moleculeReview : classes.moleculeAccepted : ''}>
                              {column.format ? column.format(value) : value}
                            </div>
                          }
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>

            <TableFooter>
              <TableRow>
                {/* Loading indicator */}
                {loading && <TableCell style={{ lineHeight: '1', display: 'flex', alignItems: 'center' }} size="medium">
                  <CircularProgress size={20} /> <span style={{ marginLeft: 12 }}>
                    <em>Loading...</em>
                  </span>
                </TableCell>}

                <TablePagination
                  count={length}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={[rowsPerPage]}
                  page={length ? page : 0}
                  className={clsx("can-load", loading && "in")}
                  onPageChange={(_, page) => {
                    onChangePage(page);
                  }}
                  ActionsComponent={TablePaginationActions}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Paper>

      {deleteMol && <DeleteModal 
        onAccept={deleteMolecule}
        onClose={() => setDeleteMol("")}
        loading={loadModal}
      />}


      {/*<MLink 
        onClick={() => downloadMolecules(molToDownload)}
        style={{ fontSize: '1.3rem', fontWeight: 'bold' }} 
        >
            Download files
      </MLink>*/}
    </div>
  );
}

// Custom table pagination
interface TablePaginationActionsProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: React.MouseEvent<HTMLButtonElement>, newPage: number) => void;
}

const useStylesTablePagination = makeStyles(theme =>
  createStyles({
    root: {
      flexShrink: 0,
      marginLeft: theme.spacing(2.5),
    },
  }),
);

function TablePaginationActions(props: TablePaginationActionsProps) {
  const classes = useStylesTablePagination();
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <div className={classes.root}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        <FirstPageIcon />
      </IconButton>
      <IconButton onClick={handleBackButtonClick} disabled={page === 0}>
        <KeyboardArrowLeft />
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        <KeyboardArrowRight />
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        <LastPageIcon />
      </IconButton>
    </div>
  );
}
