import React from 'react';
import './Explore.scss';
import { setPageTitle, errorToText } from '../../helpers';
import { RouteComponentProps } from 'react-router-dom';
import qs from 'qs';
import { Molecule } from '../../types/entities';
import ApiHelper from '../../ApiHelper';
import { toast } from '../Toaster';
import MoleculeTable from './ExploreTable';
import MoleculeFilters, { Filters } from './ExploreFilters';

// Icon <Icon className="fas fa-camera" />

function getRealFilters(filters: Filters) {
  const to_send: any = { ...filters };

  // Delete keys that contain nothing
  for (const key of Object.keys(to_send)) {
    if (Array.isArray(to_send[key])) {
      if (to_send[key].length === 0) {
        delete to_send[key];
      }
      else {
        to_send[key] = to_send[key].join(',');
      }
    }
    else if (!to_send[key]) {
      delete to_send[key];
    }
  }

  return to_send;
}

const DEFAULT_ROWS_PER_PAGE = 5;

const Explore = (props: RouteComponentProps) => {
  const [filters, setFilters] = React.useState<Filters | undefined>();
  const [molecules, setMolecules] = React.useState({ length: 0, molecules: [] as Molecule[] });
  const [page, setPage] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [rowsPerPage, setRowsPerPage] = React.useState(DEFAULT_ROWS_PER_PAGE);

  // Make the request when filters changes
  function makeRequest(new_page?: number) {
    if (loading)
      return;

    // Refresh the query string with filters
    let the_page = page;

    // We ask for page change
    if (new_page !== undefined) {
      the_page = new_page;
    }

    // Construct the filters
    const to_send = getRealFilters(filters!);

    // Save the query string with selected filters
    if (the_page) {
      to_send.page = the_page + 1;
    }
    if (rowsPerPage !== DEFAULT_ROWS_PER_PAGE) {
      to_send.page_size = rowsPerPage;
    }
    props.history.push({
      search: "?" + new URLSearchParams(to_send).toString()
    });
    // This is irrelevant for server
    delete to_send.page;
    delete to_send.page_size;

    // Set the limit and skip parameters
    to_send.limit = rowsPerPage;
    to_send.skip = rowsPerPage * the_page;

      
    // Begin loading animation
    setLoading(true);

    // Make the request
    ApiHelper.request('molecule/list', { parameters: to_send, latency: 1500 })
      .then(mols => {
        setLoading(false);
        setMolecules(mols);

        if (new_page !== undefined) {
          // Save the page change
          setPage(new_page);
        }
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
        toast(errorToText(e));
      });
  }

  // Component didLoad
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

    const new_filters: Filters = {
      q: query_string.q || "",
      author: query_string.author || "",
      name: query_string.name || "",
      alias: query_string.alias || "",
      martinize_versions: parseArray('martinize_versions'),
      force_fields: parseArray('force_fields'),
      categories: parseArray('categories'),
    };
    setFilters(new_filters);

    if (query_string.page) {
      const nb = Number(query_string.page);
      if (nb > 0) {
        setPage(nb - 1);
      }
    }

    if (query_string.page_size) {
      const ps = Number(query_string.page_size);
      if (ps > 0 && ps <= 200) {
        setRowsPerPage(ps);
      }
    }

    // Start the download (should fire, setFilters is triggered.)
  }, []);
  
  // Component didUpdate on filter change
  React.useEffect(() => {
    if (!filters)
      return;

    console.log("Downloading with filters");
    makeRequest();
  }, [filters]);

  return (
    <div>
      <MoleculeFilters 
        {...filters}
        onFiltersChange={setFilters}
      />
      
      <MoleculeTable 
        loading={loading}
        molecules={molecules.molecules}
        length={molecules.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onChangePage={page => makeRequest(page)}
      />
    </div>
  )
}

export default Explore;
