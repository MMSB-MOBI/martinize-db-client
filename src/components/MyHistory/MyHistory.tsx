import React from 'react';
import { setPageTitle, errorToText } from '../../helpers';
import { RouteComponentProps } from 'react-router-dom';
import Settings, { LoginStatus } from '../../Settings';
import EmbeddedError from '../Errors/Errors';
import { Container, Typography, Link, CircularProgress } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import HistoryTable from './HistoryTable'
import { Link as RouterLink } from 'react-router-dom';
import { getHistory } from '../../HistoryHelper'
import { RawJobDoc } from '../../types/entities'

// Icon <Icon className="fas fa-camera" />

type MyHistoryState = {
  jobs: RawJobDoc[]; 
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
    getHistory()
      .then(jobs => {
        this.setState({jobs, loaded: true})
      })
      .catch(err => this.dealWithGetHistoryError(err))
    
  }

  componentDidUpdate(_: any, old_state: MyHistoryState){
    console.log("did update"); 
    if (this.state.updateState !== old_state.updateState){
      this.setState({loaded : false})
      getHistory()
        .then(jobs => {
          this.setState({jobs, loaded:true})
        })
        .catch(err => this.dealWithGetHistoryError(err))
        
    }
    
  }

  dealWithGetHistoryError(err: any){
    const e = errorToText(err)
    if (e === "History not found.") this.setState({status : "not_found", jobs : [], loaded:true})
    else this.setState({status: "error", jobs : [], loaded:true})
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
