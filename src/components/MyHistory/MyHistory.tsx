import React from 'react';
import { setPageTitle, errorToText, Marger, FaIcon } from '../../helpers';
import { RouteComponentProps } from 'react-router-dom';
import Settings, { LoginStatus } from '../../Settings';
import EmbeddedError from '../Errors/Errors';
import { Alert } from '@material-ui/lab';
import HistoryTable from './HistoryTable'
import { Link as RouterLink } from 'react-router-dom';
import { getHistory } from '../../HistoryHelper'
import { Molecule, RawJobDoc } from '../../types/entities'
import ApiHelper from '../../ApiHelper';
import { toast } from '../Toaster';
import { Container, Link, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, DialogContentText, CircularProgress } from '@material-ui/core';


// Icon <Icon className="fas fa-camera" />

type MyHistoryState = {
  jobs: RawJobDoc[];
  updateState: number; //timestamp
  loaded: boolean;
  status?: "error" | "not_found"
};

export class MyHistory extends React.Component<RouteComponentProps, MyHistoryState> {
  state: MyHistoryState = {
    jobs: [],
    updateState: Date.now(),
    loaded: false,
  }


  componentDidMount() {
    if (Settings.logged === LoginStatus.None) {
      return;
    }
    setPageTitle("My history");
    getHistory()
      .then(jobs => {
        this.setState({ jobs, loaded: true })
      })
      .catch(err => this.dealWithGetHistoryError(err))

  }

  componentDidUpdate(_: any, old_state: MyHistoryState) {
    if (this.state.updateState !== old_state.updateState) {
      this.setState({ loaded: false })
      getHistory()
        .then(jobs => {
          this.setState({ jobs, loaded: true })
        })
        .catch(err => this.dealWithGetHistoryError(err))

    }

  }

  dealWithGetHistoryError(err: any) {
    const e = errorToText(err)
    if (e === "History not found.") this.setState({ status: "not_found", jobs: [], loaded: true })
    else this.setState({ status: "error", jobs: [], loaded: true })
  }

  render() {
    if (Settings.logged === LoginStatus.None) {
      return <EmbeddedError title="Forbidden" text="You can't access this page." />;
    }

    return (
      <Container style={{ paddingTop: 14 }}>
        <Typography variant="h3" className="page-title">
          History
        </Typography>

        <Typography style={{ marginBottom: '1rem' }}>
          This page contains all jobs you've submitted.
        </Typography>

        {!this.state.loaded && <CircularProgress />}

        {this.state?.jobs.length >= 1 && this.state.loaded &&
          <HistoryTable
            jobs={this.state.jobs}
            onNeedUpdate={() => { this.setState({ updateState: Date.now() }) }}
          />
        }
        {this.state.status === "not_found" && this.state.loaded && <Alert variant="outlined" severity="info">
          No jobs have been found in your history. Use <Link component={RouterLink} to="/builder"> Molecule Builder </Link>
        </Alert>}

        {this.state.status === "error" && this.state.loaded && <Alert variant="outlined" severity="error">
          Server error occured. Impossible to retrieve your history.
        </Alert>}

      </Container>
    );
  }
}

export default MyHistory;



export class ModalHistorySelector extends React.Component<{ open: boolean; onChoose(molecule: Molecule): any; onCancel(): any; }, any> {
  timeout: NodeJS.Timeout | undefined;

  state: any = {
    search: "",
    loading: false,
    molecules: [],
    load_more: false,
    content: "",
    jobs: []
  };


  componentDidMount() {
    if (Settings.logged === LoginStatus.None) {
      return;
    }
    setPageTitle("My history");
    getHistory()
      .then(jobs => {
        this.setState({ jobs, loaded: true })
      })
      .catch(err => console.log(err))

  }

  async molecule_to_itp(obj: any) {
    try {
      const res: any = await ApiHelper.request(`history/itp/${obj.id}` )
      this.props.onChoose(res)
    } catch (e) {
      console.log("Error while loading molecules.", e);
    }
  }

  onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    this.setState({ search: e.target.value });

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }

    const content = e.target.value.trim();
    if (content) {
      this.timeout = setTimeout(() => {
        this.timeout = undefined;

      }, 350);
    }
    else {
      this.setState({
        content: '',
        molecules: [],
        load_more: false,
        loading: false,
      });
    }
  };

  onLoadMore = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

  };



  render() {
    return (
      <Dialog open={this.props.open} onClose={this.props.onCancel} maxWidth="md" fullWidth>
        <DialogTitle>
          Find a molecule in your history
        </DialogTitle>

        <DialogContent>
          <div>
            <TextField
              value={this.state.search}
              onChange={this.onInputChange}
              placeholder="Enter a query..."
              style={{ width: '100%' }}
              variant="outlined"
            />
          </div>

          <Marger size="1rem" />

          <List>
            {this.state.jobs.map((m: any) => (
              <ListItem key={m.id} button onClick={() => this.molecule_to_itp(m)}>
                <ListItemText
                  primary={`${m.name} (${m.date}) - ${m.settings.ff} - id ${m.id}`}
                />

              </ListItem>)
            )}
          </List>


        </DialogContent>

        <DialogActions>
          <Button color="secondary" onClick={this.props.onCancel}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

