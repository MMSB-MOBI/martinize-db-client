import React from 'react';
import { setPageTitle, errorToText } from '../../helpers';
import { RouteComponentProps } from 'react-router-dom';
import Settings, { LoginStatus } from '../../Settings';
import EmbeddedError from '../Errors/Errors';
import { Container, Typography, Link, CircularProgress } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import ApiHelper from '../../ApiHelper';
import HistoryTable from './HistoryTable'
import { toast } from '../Toaster';
import { Link as RouterLink } from 'react-router-dom';

// Icon <Icon className="fas fa-camera" />

type MyHistoryState = {
  jobs: any[]; 
  updateState : number; //timestamp
  loaded : boolean; 
  status?: "error" | "not_found"
};

export class MyHistory extends React.Component<RouteComponentProps, MyHistoryState> {
  state: MyHistoryState = {
    jobs : [],
    updateState : Date.now(),
    loaded : false,
  }

  
  componentDidMount() {
    if (Settings.logged === LoginStatus.None) {
      return;
    }
    setPageTitle("My history");
    this.getHistory().then(() => {console.log("get history resolved") ; this.setState({loaded: true})});
    
  }

  componentDidUpdate(_: any, old_state: MyHistoryState){
    console.log("did update"); 
    if (this.state.updateState !== old_state.updateState){
      this.setState({loaded : false})
      this.getHistory().then(() => this.setState({loaded: true})); 
    }
    
    //if (this.state != old_state) this.getHistory(); 
    //this.getHistory(); 
  }

  async getHistory(){
    const userId = Settings.user?.id
    return new Promise((res, rej) => {
      ApiHelper.request(`history/list`, {parameters : {user:userId}})
      .then(jobs => {
        this.setState({jobs})
        res()
      }).catch(err => {
        const e = errorToText(err)
        if (e === "History not found.") this.setState({status : "not_found", jobs : []})
        else this.setState({status: "error", jobs : []})
        res()
      })
    }) as Promise<void>
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

        {!this.state.loaded && <CircularProgress/>} 

        {this.state?.jobs.length >= 1 && this.state.loaded && 
        <HistoryTable 
          jobs={this.state.jobs}
          onNeedUpdate={() => {this.setState({updateState : Date.now()})}}
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
