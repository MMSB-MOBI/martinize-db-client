import React from 'react';
import { ListItem, ListItemText, Typography, List, TextField } from '@material-ui/core'
import { Pagination } from '@mui/material'
import { getHistory } from '../../HistoryHelper';
import { errorToText } from '../../helpers'
import { RawJobDoc } from '../../types/entities'

type HistoryBuildProps = {
    onSelect(uuid: string): void; 
};

type HistoryBuildState = {
    available : RawJobDoc[]; 
    selected: RawJobDoc[]; 
    status?: "error" | "empty" | "loaded";
    currentPage : number; 

}

export default class HistoryBuild extends React.Component<HistoryBuildProps, HistoryBuildState> {
    state: HistoryBuildState = {
      available : [], 
      selected : [], 
      currentPage: 0
    };

    molPerPage = 5; 

    componentDidMount(){
        getHistory()
            .then(available => this.setState({available, status:"loaded", selected: available}))
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

    renderMoleculeList(){
      return (
        <React.Fragment>
          <TextField label="Search" variant="outlined" size="small" fullWidth onChange={this.handleSearchChange}/>
          <List>
              {this.state.selected.slice(this.state.currentPage * this.molPerPage, this.state.currentPage * this.molPerPage + this.molPerPage)
              .map(job => <ListItem key={job.jobId} button onClick={() => this.props.onSelect(job.jobId)}>
                <ListItemText 
                  primary={<Typography variant="body1">
                    <strong>{job.name.split('.pdb')[0]}</strong> ({job.settings.ff})
                  </Typography>} 
                  secondary={`Created on ${job.date} with mode ${this.modeToText(job.settings.builder_mode)}`} 
                />
              </ListItem>)}
            </List>
            <Pagination 
              count={Math.trunc(this.state.available.length / this.molPerPage) + 1} 
              shape="rounded" 
              onChange={this.handleChangePage}
            />
        </React.Fragment>
      );  

    }

    handleChangePage = (evt: React.ChangeEvent<unknown>, page:number) => {
      this.setState({currentPage: page - 1})
    }

    handleSearchChange = (evt: any) => {
      const newSelected = this.state.available.filter(job => job.name.includes(evt.target.value))
      this.setState({selected: newSelected})
    }
  
    render() {
    
    switch(this.state.status){
        case "empty":
            return this.renderEmptyHistory()
        case "error":
            return this.renderError()
        case "loaded": 
            return this.renderMoleculeList()
    }

    return null
      
    }
  }