import React from 'react';
import { ListItem, ListItemText, Typography, List } from '@material-ui/core'
import { getHistory } from '../../HistoryHelper';
import { errorToText } from '../../helpers'
import { RawJobDoc } from '../../types/entities'

type HistoryBuildProps = {
    onSelect(uuid: string): void; 
};

type HistoryBuildState = {
    available? : RawJobDoc[]; 
    status?: "error" | "empty" 

}

export default class HistoryBuild extends React.Component<HistoryBuildProps, HistoryBuildState> {
    state: HistoryBuildState = {
    };

    componentDidMount(){
        getHistory()
            .then(available => this.setState({available}))
            .catch(e => {
                if(errorToText(e) === "History not found.") this.setState({status: "empty"})
                else this.setState({status: "error"})
            })
    }

    modeToText(mode: "go" | "classic" | "elastic") {
        switch (mode) {
          case "go":
            return "GO sites";
          case "classic": 
            return "classic";
          case "elastic":
            return "elastic";
        }
    }

    renderError() {
        return (
          <div>
            There was an error when loading stashed builds.
          </div>
        );
    }

    renderEmptyHistory(){
        return (
            <Typography align="center" style={{color:"red"}}>
              There is no molecules in your history
            </Typography>
          );
    }
  
    render() {
    
    console.log(this.state.status)
    switch(this.state.status){
        case "empty":
            return this.renderEmptyHistory()
        case "error":
            return this.renderError()
    }

      return (
        <React.Fragment>
          <List>
              {this.state.available?.map(job => <ListItem key={job.jobId} button onClick={() => this.props.onSelect(job.jobId)}>
                <ListItemText 
                  primary={<Typography variant="body1">
                    <strong>{job.name.split('.pdb')[0]}</strong> ({job.settings.ff})
                  </Typography>} 
                  secondary={`Created on ${job.date} with mode ${this.modeToText(job.settings.builder_mode)}`} 
                />
              </ListItem>)}
            </List>
          
        </React.Fragment>
      ); 
    }
  }