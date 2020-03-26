import React from 'react';
import StashedBuildHelper, { StashedBuildInfo } from '../../StashedBuildHelper';
import { CircularProgress, List, ListItem, ListItemText, Typography, IconButton, ListItemSecondaryAction, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@material-ui/core';
import { dateFormatter, FaIcon } from '../../helpers';

type StashedBuildProps = {
  onSelect(uuid: string): void;
};

type StashedBuildState = {
  available?: { [uuid: string]: StashedBuildInfo };
  error?: any;
  want_delete?: string;
};

export default class StashedBuild extends React.Component<StashedBuildProps, StashedBuildState> {
  state: StashedBuildState = {};
    
  componentDidMount() {
    const helper = new StashedBuildHelper();

    helper.list()
      .then(available => 
        this.setState({
          available
        })
      )
      .catch((error: any) =>
        this.setState({
          error
        })
      );
  }

  onItemDelete = () => {
    if (!this.state.available || !this.state.want_delete) 
      return;

    const uuid = this.state.want_delete;
    
    const available = { ...this.state.available };
    delete available[uuid];

    const helper = new StashedBuildHelper();
    helper.remove(uuid).catch(err => console.error("Can't remove", uuid, ":", err));

    this.setState({ available, want_delete: undefined });
  }

  onWantDelete = (uuid: string) => {
    this.setState({ want_delete: uuid });
  }

  onWantDeleteCancel = () => {
    this.setState({ want_delete: undefined });
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

  renderModalDelete() {
    return (
      <Dialog open={!!this.state.want_delete} onClose={this.onWantDeleteCancel}>
        <DialogTitle>
          Delete this save ?
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            You won't be able to load it or use it in the Membrane Builder anymore.
          </DialogContentText>
          <DialogContentText>
            You can't restore a deleted save.
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button color="primary" onClick={this.onWantDeleteCancel}>Cancel</Button>
          <Button color="secondary" onClick={this.onItemDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    )
  }

  renderError() {
    return (
      <div>
        There was an error when loading stashed builds.
      </div>
    );
  }

  renderLoading() {
    return (
      <div>
        <CircularProgress size={56} />
      </div>
    );
  }

  render() {
    if (this.state.error) {
      return this.renderError();
    }

    if (!this.state.available) {
      return this.renderLoading();
    }

    if (Object.keys(this.state.available).length === 0) {
      return (
        <Typography style={{ marginTop: '1rem' }}>
          You don't have any stashed molecule.
        </Typography>
      );
    }

    return (
      <React.Fragment>
        {this.renderModalDelete()}

        <List>
          {Object.entries(this.state.available).map(([uuid, save]) => <ListItem key={uuid} button onClick={() => this.props.onSelect(uuid)}>
            <ListItemText 
              primary={<Typography variant="body1">
                <strong>{save.name.split('.pdb')[0]}</strong> ({save.builder_force_field})
              </Typography>} 
              secondary={`Created on ${dateFormatter("Y-m-d", save.created_at)} with mode ${this.modeToText(save.builder_mode)}`} 
            />

            <ListItemSecondaryAction onClick={() => this.onWantDelete(uuid)}>
              <IconButton edge="end" aria-label="delete">
                <FaIcon trash />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>)}
        </List>
      </React.Fragment>
    ); 
  }
}
