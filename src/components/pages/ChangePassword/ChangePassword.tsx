import React from 'react';
import ApiHelper, { APIError } from '../../../ApiHelper';
import { makeStyles, Paper, Avatar, Typography, TextField, Button, Link, Grid } from '@material-ui/core';
import { LoadFader } from '../../../Shared';
import { toast } from '../../Toaster';
import { errorToText, Marger, setPageTitle } from '../../../helpers';
import PasswordIcon from '@material-ui/icons/Lock';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import qs from 'qs';

const useStyles = makeStyles(theme => ({
  root: {
    height: '100vh',
  },
  image: {
    backgroundImage: 'url(https://source.unsplash.com/random?3)',
    backgroundRepeat: 'no-repeat',
    backgroundColor:
      theme.palette.type === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  paper: {
    margin: theme.spacing(8, 4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.primary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

export default function ChangePassword() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<APIError | undefined>();
  const [sended, setSended] = React.useState(false);
  const [password1, setPassword1] = React.useState("");
  const [password2, setPassword2] = React.useState("");
  const classes = useStyles();
  const location = useLocation();

  const query_string = qs.parse(location.search, { ignoreQueryPrefix: true });
  const token = query_string.token as string;

  React.useEffect(() => {
    setPageTitle("Change password");
  }, []);

  function handleSubmit(evt: React.FormEvent) {
    evt.stopPropagation();
    evt.preventDefault();

    if (loading || sended || !token) {
      return;
    }

    if (!password1 || !password2) {
      return toast("You must enter a new password.", "error");
    }

    if (password1 !== password2) {
      return toast("Passwords must match.", "error");
    }

    setLoading(true);

    ApiHelper.request('user/change_password', { parameters: { token, password: password1 }, method: 'POST', auth: false })
      .then(() => {
        toast("Your password has been changed. You can now log in.", "info");
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
    <Grid container component="main" className={classes.root}>
      <Grid item xs={false} sm={4} md={7} className={classes.image} />

      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <PasswordIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Change your password
          </Typography>

          <Marger size="1rem" />

          {!token && <Typography variant="body1" color="error" style={{ marginBottom: '1rem', maxWidth: '80%' }}>
            You must access this page with a request token. 
            Please ensure you've asked for a password renewal before accessing this page.
          </Typography>}

          <Marger size="1rem" />

          {error && <Typography variant="body1" color="error">
            {errorToText(error.code)}
          </Typography>}

          <LoadFader when={loading}>
            <form className={classes.form} onSubmit={handleSubmit}>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                label="Password"
                type="password"
                value={password1}
                autoFocus
                onChange={evt => setPassword1(evt.target.value)}
                disabled={!token}
              />
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                label="Password (again)"
                type="password"
                value={password2}
                autoFocus
                onChange={evt => setPassword2(evt.target.value)}
                disabled={!token}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="secondary"
                className={classes.submit}
                disabled={sended || !token}
              >
                Change password
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
        </div>
      </Grid>
    </Grid>
  );
}
