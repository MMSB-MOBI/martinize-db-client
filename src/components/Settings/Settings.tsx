import React from 'react';
import { Container, Typography, TextField, makeStyles, Button } from '@material-ui/core';
import { Marger, notifyError, setPageTitle } from '../../helpers';
import Settings from '../../Settings';
import ApiHelper from '../../ApiHelper';
import { User } from '../../types/entities';
import { LoadFader } from '../../Shared';
import { toast } from '../Toaster';

const useStyles = makeStyles(theme => ({
  text: {
    width: '100%',
  },
  passwordContainer: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    [theme.breakpoints.down("sm")]: {
      gridTemplateColumns: '1fr',
    },
  },
  password: {
    width: '100%',
  },
}));

export default function SettingsPage() {
  const [username, setUsername] = React.useState(Settings.user?.name);
  const [email, setEmail] = React.useState(Settings.user?.email);
  const [oldPassword, setOldPassword] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [passwordRepeat, setPasswordRepeat] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const classes = useStyles();

  React.useEffect(() => {
    setPageTitle("Settings");
  }, []);

  function changeUsernameEmail(e?: React.FormEvent<any>) {
    if (e) {
      e.preventDefault();
    }

    if (loading) {
      return;
    }

    setLoading(true);

    ApiHelper.request('user/update', { method: 'POST', parameters: { username, email } })
      .then((user: User) => {
        Settings.user = user;
        toast("User data has been updated.", "success");
      })
      .catch(notifyError)
      .finally(() => {
        setLoading(false);
      });
  }

  function changePassword(e?: React.FormEvent<any>) {
    if (e) {
      e.preventDefault();
    }

    if (loading) {
      return;
    }

    if (!oldPassword) {
      return toast("You must specify old password.", "error");
    }

    if (!password) {
      return toast("New password can't be empty.", "error");
    }

    if (password !== passwordRepeat) {
      toast("Passwords must match.", "error");
      return;
    }

    setLoading(true);

    ApiHelper.request('user/update', { method: 'POST', parameters: { password, old_password: oldPassword } })
      .then(() => {
        toast("Password has been updated.", "success");
        setPassword("");
        setOldPassword("");
        setPasswordRepeat("");
      })
      .catch(notifyError)
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <Container style={{ paddingTop: 14 }}>
      <Typography variant="h3" className="page-title">
        Settings
      </Typography>
    
      <Typography align="center">
        Change here your account settings.
      </Typography>

      <Marger size="1rem" />

      <LoadFader when={loading}>
        <Typography variant="h5">
          Details
        </Typography>

        <Typography variant="body2">
          Your current status is {Settings.user?.role === "admin" ? "administrator" : "curator"}.
        </Typography>

        <Marger size="1.5rem" />

        <form onSubmit={changeUsernameEmail}>
          <TextField 
            value={username}
            label="Username"
            onChange={e => setUsername(e.target.value)}
            variant="outlined"
            required
            className={classes.text}
          />

          <Marger size="1rem" />

          <TextField 
            value={email}
            label="E-mail"
            onChange={e => setEmail(e.target.value)}
            variant="outlined"
            type="email"
            required
            className={classes.text}
          />

          <Marger size="1.5rem" />  

          <div style={{ textAlign: 'right' }}>
            <Button onClick={changeUsernameEmail} variant="outlined" color="primary">
              Save
            </Button>
          </div>  
        </form>

        <Marger size="2rem" />

        <Typography variant="h5">
          Password
        </Typography>

        <Marger size="1.5rem" />

        <form onSubmit={changePassword}>
          <TextField 
            value={oldPassword}
            label="Old password"
            onChange={e => setOldPassword(e.target.value)}
            variant="outlined"
            type="password"
            required
            className={classes.text}
          />

          <Marger size="1rem" />

          <div className={classes.passwordContainer}>
            <TextField 
              value={password}
              label="New password"
              onChange={e => setPassword(e.target.value)}
              variant="outlined"
              type="password"
              required
              className={classes.password}
            />

            <TextField 
              value={passwordRepeat}
              label="New password (again)"
              onChange={e => setPasswordRepeat(e.target.value)}
              variant="outlined"
              type="password"
              required
              className={classes.password}
            />
          </div>

          <Marger size="1.5rem" />  

          <div style={{ textAlign: 'right' }}>
            <Button onClick={changePassword} variant="outlined" color="secondary">
              Change password
            </Button>
          </div>  
        </form>

      </LoadFader>
    </Container>
  );
}
