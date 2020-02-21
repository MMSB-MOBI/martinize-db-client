import React from 'react';
import { setPageTitle, errorToText } from '../../helpers';
import { RouteComponentProps } from 'react-router-dom';
import { Molecule } from '../../types/entities';
import ApiHelper from '../../ApiHelper';
import { toast } from '../Toaster';
import MoleculeTable from '../Explore/ExploreTable';
import Settings, { LoginStatus } from '../../Settings';
import EmbeddedError from '../Errors/Errors';
import { Container, Typography } from '@material-ui/core';

// Icon <Icon className="fas fa-camera" />

const DEFAULT_ROWS_PER_PAGE = 5;

type ModerationState = {
  molecules: { length: number, molecules: Molecule[] },
  page: number,
  rowsPerPage: number,
  loading: number,
};

export class Moderation extends React.Component<RouteComponentProps, ModerationState> {
  state: ModerationState = {
    molecules: { length: 0, molecules: [] as Molecule[] },
    page: 0,
    loading: 0,
    rowsPerPage: DEFAULT_ROWS_PER_PAGE,
  }

  previous_timeout = 0;
  first = true;

  componentDidMount() {
    setPageTitle("Moderation");

    if (Settings.logged !== LoginStatus.Admin) {
      return;
    }

    this.makeRequest();
    // Start the download (should fire, filters has changed is triggered.)
  }

  protected makeRequest(new_page?: number) {
    // Refresh the query string with filters
    let the_page = this.state.page;

    // We ask for page change
    if (new_page !== undefined) {
      the_page = new_page;
    }

    // Construct the filters
    const to_send: any = {};

    // Set the limit and skip parameters
    to_send.limit = this.state.rowsPerPage;
    to_send.skip = this.state.rowsPerPage * the_page;

      
    // Begin loading animation
    const load_uuid = Math.random();
    this.setState({
      loading: load_uuid
    });

    // Make the request
    ApiHelper.request('moderation/list', { parameters: to_send })
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
  
  render() {
    if (Settings.logged !== LoginStatus.Admin) {
      return <EmbeddedError title="Forbidden" text="You can't access this page." />;
    }

    return (
      <Container style={{ paddingTop: 14 }}>
        <Typography variant="h3" className="page-title">
          Moderation
        </Typography>

        <Typography style={{ marginBottom: '1rem' }}>
          You can find here the molecules waiting to be accepted.
        </Typography>

        <MoleculeTable
          loading={!!this.state.loading}
          molecules={this.state.molecules.molecules}
          length={this.state.molecules.length}
          page={this.state.page}
          rowsPerPage={this.state.rowsPerPage}
          onChangePage={page => this.makeRequest(page)}
          onMoleculeDelete={() => {
            toast("Molecule has been deleted.", "success");
            this.makeRequest();
          }}
          moderation
        />
      </Container>
    );
  }
}

export default Moderation;
