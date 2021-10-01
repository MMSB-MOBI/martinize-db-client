import React from 'react';
import { setPageTitle, errorToText, Marger } from '../../helpers';
import { RouteComponentProps } from 'react-router-dom';
import Settings, { LoginStatus } from '../../Settings';
import EmbeddedError from '../Errors/Errors';
import { Container, Typography } from '@material-ui/core';
import ApiHelper from '../../ApiHelper';
import HistoryTable from './HistoryTable'

// Icon <Icon className="fas fa-camera" />

type MyHistoryState = {
  filters?: any; 
  jobs: any[]; 
};

export class MyHistory extends React.Component<RouteComponentProps, MyHistoryState> {

  previous_timeout = 0
  first = true; 
  jobs = []; 

  componentDidMount() {

    if (Settings.logged === LoginStatus.None) {
      return;
    }

    console.log("history did mount")
    setPageTitle("My history");
    this.getHistory();
  }

  componentDidUpdate(_: any, old_state:MyHistoryState){
    console.log("History did update")
    console.log(this.state)
    console.log(old_state)
    //this.getHistory(); 
    return; 
  }

  protected getHistory(){
    console.log("get history"); 
    const userId = Settings.user?.id
    ApiHelper.request(`history/list`, {parameters : {user:userId}})
      .then(jobs => {
        console.log("get jobs")
        console.log(jobs)
        this.setState({jobs})
      }).catch(err => console.log("err"))
    //ApiHelper.request('history/')
  }

  render() {
    const test = [{
      id: "1111",
      date : "fdfdslfdsf",
      type : "pouet"

    }]
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

        {this.state?.jobs && 
        <HistoryTable jobs={this.state.jobs}/> 
        }

      </Container>
    );
  }
}

export default MyHistory;
