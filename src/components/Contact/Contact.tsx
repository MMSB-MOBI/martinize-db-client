import React from 'react';
import { Container, Typography, TextField, makeStyles, Button } from '@material-ui/core';
import { Marger, notifyError, setPageTitle } from '../../helpers';
import Settings from '../../Settings';
import ApiHelper from '../../ApiHelper';
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

export default function ContactPage() {
  const [email, setEmail] = React.useState(Settings.user?.email);
  const [content, setContent] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const classes = useStyles();

  React.useEffect(() => {
    setPageTitle("Contact");
  }, []);

  function handleSubmit(e?: React.FormEvent<any>) {
    if (e) {
      e.preventDefault();
    }

    if (loading || !content.trim()) {
      return;
    }

    if (!email) {
      toast("Your e-mail is invalid.");
    }

    setLoading(true);

    ApiHelper.request('user/contact', { method: 'POST', parameters: { email, content } })
      .then(() => {
        toast("Your request has been sent.", "success");
        setContent("");
      })
      .catch(notifyError)
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <Container style={{ paddingTop: 14 }}>
      <Typography variant="h3" className="page-title">
        Contact
      </Typography>
    
      <Typography align="center">
        Ask us about what you want.
      </Typography>

      <Marger size="1rem" />

      <LoadFader when={loading}>
        <Typography variant="h5">
          Message
        </Typography>

        <Typography variant="body2">
          Please indicate here your request and how we can contact you.
        </Typography>

        <Marger size="1.5rem" />

        <form onSubmit={handleSubmit}>
          <TextField 
            value={email}
            label="E-mail"
            onChange={e => setEmail(e.target.value)}
            variant="outlined"
            type="email"
            required
            className={classes.text}
          />

          <Marger size="1rem" />

          <TextField 
            value={content}
            label="Your request"
            onChange={e => setContent(e.target.value)}
            variant="outlined"
            required
            className={classes.text}
            multiline
            rows={5}
          />

          <Marger size="1.5rem" />  

          <div style={{ textAlign: 'right' }}>
            <Button type="submit" variant="outlined" color="primary">
              Submit
            </Button>
          </div>  
        </form>

        <Marger size="1.5rem" />  

      </LoadFader>
    </Container>
  );
}
