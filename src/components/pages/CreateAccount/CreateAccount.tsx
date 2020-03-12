import React from 'react';
import ApiHelper, { APIError } from '../../../ApiHelper';
import { makeStyles, Avatar, Typography, TextField, Button, Link, Grid, Container } from '@material-ui/core';
import { LoadFader } from '../../../Shared';
import { toast } from '../../Toaster';
import { errorToText, Marger, setPageTitle } from '../../../helpers';
import UserIcon from '@material-ui/icons/PersonAdd';
import { Link as RouterLink } from 'react-router-dom';

const useStyles = makeStyles(theme => ({
  root: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing(8, 4),
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.primary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
    minWidth: '50vw',
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  formItem: {
    width: '100%',
  }
}));

export default function CreateAccount() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<APIError | undefined>();
  const [sended, setSended] = React.useState(false);
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password1, setPassword1] = React.useState("");
  const [password2, setPassword2] = React.useState("");
  const classes = useStyles();

  React.useEffect(() => {
    setPageTitle("Create Account");
  }, []);

  function handleSubmit(evt: React.FormEvent) {
    evt.stopPropagation();
    evt.preventDefault();

    if (loading || sended) {
      return;
    }

    if (!username || !email) {
      return toast("You must define an username and an email.", "error");
    }

    if (!password1 || !password2) {
      return toast("You must enter a new password.", "error");
    }

    if (password1 !== password2) {
      return toast("Passwords must match.", "error");
    }

    setLoading(true);

    ApiHelper.request('user/create', { parameters: { username, email, password: password1 }, method: 'POST', auth: false })
      .then(() => {
        toast("Your account request has been successfully made.", "info");
        setSended(true);
        setError(undefined);
      })
      .catch(e => {        
        if (ApiHelper.isFullApiError(e)) {
          setError(e[1]);
        }
        else {
          // Erreur réseau ?
          toast("Unable to contact server. Please check your network.", "error");
        }
      })
      .finally(() => setLoading(false));
  }

  return (
    <Container className={classes.root}>
      <Avatar className={classes.avatar}>
        <UserIcon />
      </Avatar>
      <Typography component="h1" variant="h5">
        Create an account
      </Typography>

      <Marger size="1rem" />

      {error && <Typography variant="body1" color="error">
        {errorToText(error.code)}
      </Typography>}

      {sended && <Typography variant="body1" color="primary">
        Your account request has been successfully made. Please wait for an administrator to approve your request.
      </Typography>}

      <LoadFader when={loading}>
        <form className={classes.form} onSubmit={handleSubmit}>

          <Grid container className={classes.formItem}>
            <Grid item xs={12} sm={6} style={{ padding: '0 .3rem' }}>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                label="User name"
                autoComplete="name"
                type="text"
                value={username}
                onChange={evt => setUsername(evt.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} style={{ padding: '0 .3rem' }}>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                label="Email"
                autoComplete="email"
                type="email"
                value={email}
                onChange={evt => setEmail(evt.target.value)}
              />
            </Grid>
          </Grid>

          <Grid container className={classes.formItem}>
            <Grid item xs={12} sm={6} style={{ padding: '0 .3rem' }}>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                label="Password"
                type="password"
                value={password1}
                onChange={evt => setPassword1(evt.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} style={{ padding: '0 .3rem' }}>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                label="Password (again)"
                type="password"
                value={password2}
                onChange={evt => setPassword2(evt.target.value)}
              />
            </Grid>
          </Grid>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
            disabled={sended}
          >
            Create your account
          </Button>
          <Grid container>
            <Grid item xs>
              <Link component={RouterLink} to="/login" href="/login" variant="body2">
                Login
              </Link>
            </Grid>
          </Grid>
        </form>
      </LoadFader>
    </Container>
  );
}
