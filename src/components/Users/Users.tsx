import React from 'react';
import { Container, Typography, withStyles, List, ListItem, ListItemAvatar, Avatar, ListItemText, Button, Paper, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@material-ui/core';
import { Marger, notifyError, setPageTitle } from '../../helpers';
import { User } from '../../types/entities';
import ApiHelper from '../../ApiHelper';
import { CenterComponent, LoadFader } from '../../Shared';
import Settings from '../../Settings';

interface UserState {
  loading: boolean;
  users: User[];
  delete_open: string;
  approve_open: string;
}

class Users extends React.Component<{ classes: Record<string, string> }, UserState> {
  state: UserState = {
    loading: false,
    users: [],
    delete_open: "",
    approve_open: "",
  };

  componentDidMount() {
    this.setState({
      loading: true
    });

    setPageTitle("Users");

    ApiHelper.request('user/list')
      .then((users: User[]) => {
        this.setState({
          loading: false,
          users
        });
      })
      .catch(notifyError);
  } 

  renderUser(user: User) {
    return (
      <ListItem alignItems="flex-start" key={user.id}>
        <ListItemAvatar>
          <Avatar>
            {user.name.slice(0, 1).toLocaleUpperCase()}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <React.Fragment>
              <Typography
                component="span"
                variant="body1"
                style={{ display: 'inline' }}
                color="textPrimary"
              >
                <strong>{user.name}</strong> 
              </Typography>
              {" — "}{user.email}
            </React.Fragment>
          }
          secondary={
            <span style={{ marginTop: 7, display: 'inline-block' }}>
              {!user.approved && <Button 
                color="primary" 
                variant="outlined" 
                style={{ marginRight: 15 }} 
                onClick={() => this.setState({ approve_open: user.id })}
              >
                Accept account
              </Button>}

              {user.id !== Settings.user?.id && <Button 
                color="secondary" 
                variant="outlined" 
                onClick={() => this.setState({ delete_open: user.id })}
              >
                Delete
              </Button>}

              {user.id === Settings.user?.id && <Typography variant="body2" component="span">
                This is you.
              </Typography>}
            </span>
          }
        />
      </ListItem>
    );
  }

  render() {
    const classes = this.props.classes;

    const approved = this.state.users.filter(u => u.approved);
    const not_approved = this.state.users.filter(u => !u.approved);

    return (
      <Container style={{ paddingTop: 14 }}>
        <DeleteUser 
          open={!!this.state.delete_open} 
          userId={this.state.delete_open} 
          onClose={() => this.setState({ delete_open: "" })} 
          onDelete={() => {
            const id = this.state.delete_open;
            this.setState({
              delete_open: "",
              users: this.state.users.filter(u => u.id !== id)
            });
          }}
        />

        <ApproveUser 
          open={!!this.state.approve_open} 
          userId={this.state.approve_open} 
          onClose={() => this.setState({ approve_open: "" })} 
          onApprove={() => {
            const id = this.state.approve_open;
            const u = this.state.users.find(u => u.id === id)
            u!.approved = true;

            this.setState({
              approve_open: "",
              users: [...this.state.users]
            });
          }}
        />

        <Typography variant="h3" className="page-title">
          Users
        </Typography>

        <Typography align="center">
          Manage existing and waiting for approval users.
        </Typography>

        <Marger size="1rem" />

        {this.state.loading && <CenterComponent style={{ marginTop: '2rem' }}>
          <CircularProgress size={48} />
        </CenterComponent>}

        {!!not_approved.length && <React.Fragment>
          <Typography variant="h5" className={classes.secondTitle}>
            Waiting users
          </Typography>

          <Paper variant="outlined" className={classes.paperRoot}>
            <List className={classes.list_root}>
              {not_approved.map(u => this.renderUser(u))}
            </List>
          </Paper>
        </React.Fragment>}

        {not_approved.length > 0 && approved.length > 0 && <React.Fragment>
          <Marger size="2rem" />
        </React.Fragment>}

        {!!approved.length && <React.Fragment>
          <Typography variant="h5" className={classes.secondTitle}>
            Approved users
          </Typography>

          <Paper variant="outlined" className={classes.paperRoot}>
            <List className={classes.list_root}>
              {approved.map(u => this.renderUser(u))}
            </List>
          </Paper>
        </React.Fragment>}
      </Container>
    );
  }
}

export default withStyles(theme => ({
  passwordContainer: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    [theme.breakpoints.down("sm")]: {
      gridTemplateColumns: '1fr',
    },
  },
  input: {
    width: '100%',
  },
  list_root: {
    width: '100%',
  },
  secondTitle: {
    fontWeight: 200,
    marginBottom: 15,
  },
  paperRoot: {
    borderRadius: 12,
  },
}))(Users);

function DeleteUser(props: { open: boolean, userId: string, onClose: () => void, onDelete: () => void, }) {
  const [loading, setLoading] = React.useState(false);

  function handleDelete() {
    if (loading) {
      return;
    }
    setLoading(true);

    ApiHelper.request('user/destroy', { method: 'DELETE', parameters: { id: props.userId } })
      .then(() => {
        props.onDelete();
      })
      .catch(notifyError)
      .finally(() => setLoading(false));
  }

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>
        Delete this user ?
      </DialogTitle>

      <DialogContent>
        <LoadFader when={loading}>
          <DialogContentText>
            This user can't be restored, and all his submissions will be deleted.
          </DialogContentText>
        </LoadFader>
      </DialogContent>

      <DialogActions>
        <LoadFader when={loading}>
          <Button color="primary" autoFocus onClick={props.onClose}>
            Cancel
          </Button>

          <Button color="secondary" onClick={handleDelete}>
            Delete
          </Button>
        </LoadFader>
      </DialogActions>
    </Dialog>
  );
}

function ApproveUser(props: { open: boolean, userId: string, onClose: () => void, onApprove: () => void, }) {
  const [loading, setLoading] = React.useState(false);

  function handleApprove() {
    if (loading) {
      return;
    }
    setLoading(true);

    ApiHelper.request('user/update', { method: 'POST', parameters: { id: props.userId, approved: 'true' } })
      .then(() => {
        props.onApprove();
      })
      .catch(notifyError)
      .finally(() => setLoading(false));
  }

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>
        Approve this account ?
      </DialogTitle>

      <DialogContent>
        <LoadFader when={loading}>
          <DialogContentText>
            This new user will be able to submit new molecules.
          </DialogContentText>
        </LoadFader>
      </DialogContent>

      <DialogActions>
        <LoadFader when={loading}>
          <Button color="primary" autoFocus onClick={props.onClose}>
            Cancel
          </Button>

          <Button color="secondary" onClick={handleApprove}>
            Approve
          </Button>
        </LoadFader>
      </DialogActions>
    </Dialog>
  );
}
