import React from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Link from '@material-ui/core/Link';
import { Link as RouterLink } from 'react-router-dom';
import Paper from '@material-ui/core/Paper';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import ApiHelper, { APIError } from '../../../ApiHelper';
import { User } from '../../../types/entities';
import Settings from '../../../Settings';
import { loginErrorToText, setPageTitle, Marger } from '../../../helpers';
import { LoadFader } from '../../../Shared';
import { toast } from '../../Toaster';
import { Alert } from '@material-ui/lab';



function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      MArtini Database {new Date().getFullYear()}
    </Typography>
  );
}

const useStyles = makeStyles(theme => ({
  root: {
    height: '100vh',
  },
  image: {
    backgroundImage: 'url(/assets/background.jpg)',
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
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

export default function Login() {
  const classes = useStyles();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [operating, setOperating] = React.useState("idle");
  const [error, setError] = React.useState<APIError | undefined>();

  React.useEffect(() => {
    setPageTitle("Login");
  }, []);

  function handleSubmit(evt: React.FormEvent) {
    evt.stopPropagation();
    evt.preventDefault();

    if (operating === "send") {
      return;
    }

    setOperating("send");

    const username = email;

    ApiHelper.request('user/login', { parameters: { username, password }, method: 'POST', auth: false })
      .then(({ user, token }: { user: User, token: string }) => {
        Settings.user = user;
        Settings.token = token;
        //console.log( "hellog" , user)
        window.location.pathname = "/";
      })
      .catch(e => {
        setOperating("error");
        
        if (ApiHelper.isFullApiError(e)) {
          setError(e[1]);
        }
        else {
          // Erreur réseau ?
          toast("Unable to login. Please check your network.", "error");
        }
      })
  }

  return (
    <Grid container component="main" className={classes.root}>
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>

          <Marger size="1rem" />

          {error && <Typography variant="body1" color="error">
            {loginErrorToText(error.code)}.
          </Typography>}

          <LoadFader when={operating === "send"}>
            <form className={classes.form} onSubmit={handleSubmit}>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                label="Email Address or Username"
                name="email"
                autoComplete="email"
                value={email}
                autoFocus
                onChange={evt => setEmail(evt.target.value)}
              />
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={evt => setPassword(evt.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                className={classes.submit}
              >
                Sign In
              </Button>
              <Grid container>
                <Grid item xs>
                  <Link color="secondary" component={RouterLink} to="/lost_password" href="/lost_password" variant="body2">
                    Forgot password?
                  </Link>
                </Grid>
                <Grid item>
                  <Link color="secondary" component={RouterLink} to="/create_account" href="/create_account" variant="body2">
                    {"Don't have an account? Sign Up"}
                  </Link>
                </Grid>
              </Grid>
              <Box mt={5}>
                <Copyright />
              </Box>
            </form>
          </LoadFader>
        </div>
      </Grid>

      <Grid item xs={false} sm={4} md={7} className={classes.image} />
    </Grid>
  );
}
