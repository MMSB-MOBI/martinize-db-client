import React from 'react';
import './Explore.scss';
import { setPageTitle, errorToText } from '../../helpers';
import { makeStyles, Typography, Paper, TableContainer, Table, TableHead, TableRow, TableBody, TablePagination, TableCell } from '@material-ui/core';
import { RouteComponentProps } from 'react-router-dom';
import qs from 'qs';
import { Molecule } from '../../types/entities';
import ApiHelper from '../../ApiHelper';
import { toast } from '../Toaster';
import { LoadFader } from '../../Shared';

interface Filters {
  versions?: string[];
  force_fields?: string[];
  q?: string;
  author?: string;
  categories?: string[];
}

// Icon <Icon className="fas fa-camera" />
const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2),
  },
  paperRoot: {
    width: '100%',
  },
  container: {
    maxHeight: '80vh',
  },
}));

interface Column {
  id: 'name' | 'alias' | 'category' | 'created_at';
  label: string;
  minWidth?: number;
  align?: 'right';
  format?: (value: any) => string;
}

const columns: Column[] = [
  { id: 'name', label: 'Name', minWidth: 170 },
  { id: 'alias', label: 'Alias', minWidth: 100 },
  {
    id: 'category',
    label: 'Category',
    minWidth: 170,
    align: 'right',
  },
  {
    id: 'created_at',
    label: 'Created at',
    minWidth: 170,
    align: 'right',
    format: (value: string) => new Date(value).toISOString(),
  },
];


const Explore = (props: RouteComponentProps) => {
  const classes = useStyles();
  const [filters, setFilters] = React.useState<Filters | undefined>();
  const [molecules, setMolecules] = React.useState({ length: 0, molecules: [] as Molecule[] });
  const [page, setPage] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  function makeRequest(new_page?: number) {
    if (loading)
      return;
      
    setLoading(true);

    let the_page = page;

    if (new_page !== undefined) {
      the_page = new_page;
    }

    ApiHelper.request('molecule/list', { parameters: { ...filters, page: the_page + 1 }, latency: 1500 })
      .then(mols => {
        setLoading(false);
        setMolecules(mols);

        if (new_page !== undefined) {
          setPage(new_page);
        }
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
        toast(errorToText(e));
      });
  }

  React.useEffect(() => {
    setPageTitle("Explore");

    // Read from query string
    const query_string = qs.parse(props.location.search, { ignoreQueryPrefix: true });

    function parseArray(key: string) {
      const v = query_string[key] as string;

      if (v) {
        return v.split(',');
      }
      return [];
    }

    const new_filters = {
      free_text: query_string.free_text || "",
      author: query_string.author || "",
      versions: parseArray('versions'),
      force_fields: parseArray('force_fields'),
      categories: parseArray('categories'),
    };
    setFilters(new_filters);

    if (query_string.page) {
      const nb = Number(query_string.page);
      if (nb > 0) {
        setPage(nb);
      }
    }

    // Start the download (should fire, setFilters is triggered.)
  }, []);
  
  React.useEffect(() => {
    if (!filters)
      return;

    console.log("Downloading with filters");

    // TODO make the real download with filters !!
    makeRequest();
  }, [filters]);

  const ROWS_PER_PAGE = 25;

  return (
    <div className={classes.root}>
      <Paper className={classes.paperRoot}>
        <LoadFader when={loading}>
          <TableContainer className={classes.container}>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  {columns.map(column => (
                    <TableCell
                      key={column.id}
                      align={column.align}
                      style={{ minWidth: column.minWidth }}
                    >
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {molecules.molecules.map(row => {
                  return (
                    <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                      {columns.map(column => {
                        const value = row[column.id];
                        return (
                          <TableCell key={column.id} align={column.align}>
                            {column.format && typeof value === 'number' ? column.format(value) : value}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={molecules.length}
            rowsPerPage={ROWS_PER_PAGE}
            rowsPerPageOptions={[ROWS_PER_PAGE]}
            page={page}
            onChangePage={(_, page) => {
              console.log("page");
              makeRequest(page);
            }}
          />
        </LoadFader>
      </Paper>
    </div>
  );
}

export default Explore;
