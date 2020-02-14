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

type ExploreState = {
  filters?: Filters,
  molecules: { length: number, molecules: Molecule[] },
  page: number,
  rowsPerPage: number,
  loading: number,
};

export class Explore extends React.Component<RouteComponentProps, ExploreState> {
  state: ExploreState = {
    molecules: { length: 0, molecules: [] as Molecule[] },
    page: 0,
    loading: 0,
    rowsPerPage: DEFAULT_ROWS_PER_PAGE,
  }

  previous_timeout = 0;
  first = true;

  componentDidMount() {
    setPageTitle("Explore");

    // Read from query string
    const query_string = qs.parse(this.props.location.search, { ignoreQueryPrefix: true });

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

    let page = this.state.page;
    let rowsPerPage = this.state.rowsPerPage;

    if (query_string.page) {
      const nb = Number(query_string.page);
      if (nb > 0) {
        page = nb - 1;
      }
    }

    if (query_string.page_size) {
      const ps = Number(query_string.page_size);
      if (ps > 0 && ps <= 200) {
        rowsPerPage = ps;
      }
    }

    this.setState({
      filters: new_filters,
      page,
      rowsPerPage
    });

    // Start the download (should fire, filters has changed is triggered.)
  }

  componentDidUpdate(_: any, old_state: ExploreState) {
    if (this.state.filters !== old_state.filters) {
      if (this.first) {
        this.first = false;
        this.makeRequest();
        return;
      }

      if (this.previous_timeout) {
        clearTimeout(this.previous_timeout);
        this.previous_timeout = 0;
      }
  
      this.previous_timeout = setTimeout(() => {
        this.previous_timeout = 0;
        this.makeRequest();
      }, 500) as any;  
    }
  }

  protected makeRequest(new_page?: number) {
    // Refresh the query string with filters
    let the_page = this.state.page;

    // We ask for page change
    if (new_page !== undefined) {
      the_page = new_page;
    }

    // Construct the filters
    const to_send = getRealFilters(this.state.filters!);

    // Save the query string with selected filters
    if (the_page) {
      to_send.page = the_page + 1;
    }
    if (this.state.rowsPerPage !== DEFAULT_ROWS_PER_PAGE) {
      to_send.page_size = this.state.rowsPerPage;
    }

    this.props.history.push({
      search: "?" + new URLSearchParams(to_send).toString()
    });
    // This is irrelevant for server
    delete to_send.page;
    delete to_send.page_size;

    // Set the limit and skip parameters
    to_send.limit = this.state.rowsPerPage;
    to_send.skip = this.state.rowsPerPage * the_page;

      
    // Begin loading animation
    const load_uuid = Math.random();
    this.setState({
      loading: load_uuid
    });

    // Make the request
    ApiHelper.request('molecule/list', { parameters: to_send, latency: 1500, auth: 'auto' })
      .then(mols => {
        if (load_uuid === this.state.loading) {
          this.setState({
            loading: 0,
            molecules: mols,
            page: new_page !== undefined ? new_page : this.state.page
          });
        }
      })
      .catch(e => {
        if (load_uuid === this.state.loading) {
          this.setState({
            loading: 0,
          });

          console.error(e);
          toast(errorToText(e));
        }
      });
  }

  protected changeFilters(filters: Filters) {
    this.setState({ filters });
  }
  
  render() {
    return (
      <div>
        <div style={{ padding: 14 }}>
          <MoleculeFilters 
            {...(this.state.filters ?? {})}
            onFiltersChange={filters => this.changeFilters(filters)}
          />
        </div>
        
        <MoleculeTable 
          loading={!!this.state.loading}
          molecules={this.state.molecules.molecules}
          length={this.state.molecules.length}
          page={this.state.page}
          rowsPerPage={this.state.rowsPerPage}
          onChangePage={page => this.makeRequest(page)}
        />
      </div>
    );
  }
}

export default Explore;
