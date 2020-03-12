import React from 'react';
import ApiHelper, { APIError } from '../../../ApiHelper';
import { makeStyles, Paper, Avatar, Typography, TextField, Button, Link, Grid } from '@material-ui/core';
import { LoadFader } from '../../../Shared';
import { toast } from '../../Toaster';
import { errorToText, Marger, setPageTitle } from '../../../helpers';
import MailIcon from '@material-ui/icons/Mail';
import { Link as RouterLink } from 'react-router-dom';

const useStyles = makeStyles(theme => ({
  root: {
    height: '100vh',
  },
  image: {
    backgroundImage: 'url(https://source.unsplash.com/random?2)',
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

export default function LostPassword() {
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<APIError | undefined>();
  const [sended, setSended] = React.useState(false);
  const classes = useStyles();

  React.useEffect(() => {
    setPageTitle("Reset Password");
  }, []);

  function handleSubmit(evt: React.FormEvent) {
    evt.stopPropagation();
    evt.preventDefault();

    if (loading || sended) {
      return;
    }

    setLoading(true);

    ApiHelper.request('user/lost_password', { parameters: { email }, method: 'POST', auth: false })
      .then(() => {
        toast("A password renewal e-mail has been sent. Please check your mailbox.", "info");
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
            <MailIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Reset your password
          </Typography>

          <Marger size="1rem" />

          <Typography component="p" variant="body2" style={{ maxWidth: '80%' }}>
            If you've lost your password, we can send you an e-mail to create a new one.
            Follow the guide.
          </Typography>

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
                label="Email Address"
                autoComplete="email"
                type="email"
                value={email}
                autoFocus
                onChange={evt => setEmail(evt.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="secondary"
                className={classes.submit}
                disabled={sended}
              >
                Ask for a password reset
              </Button>
              <Grid container>
                <Grid item xs>
                  <Link component={RouterLink} to="/login" href="/login" variant="body2">
                    Login
                  </Link>
                </Grid>
                <Grid item>
                  <Link component={RouterLink} to="/create_account" href="/create_account" variant="body2">
                    {"Don't have an account? Sign Up"}
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
