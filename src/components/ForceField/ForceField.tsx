import React from 'react';
import { Container, Typography, ListItem, List, Link, Box, CircularProgress } from "@material-ui/core";
import { Marger, notifyError } from '../../helpers';
import ApiHelper from '../../ApiHelper';
import { SERVER_ROOT } from '../../constants';

export default function ForceField() {
  const [available, setAvailable] = React.useState<string[] | null>(null);

  React.useEffect(() => {
    ApiHelper.request('force_fields/list')
      .then(available => setAvailable(available))
      .catch(notifyError)
  }, []);
  
  return (
    <Container style={{ paddingTop: 14 }}>
      <Typography variant="h3" className="page-title">
        Download force fields
      </Typography>

      <Marger size={14} />

      <Typography variant="h6" style={{ textAlign: 'center' }}>
        Available force fields
      </Typography>

      <Marger size={14} />
      
      {available && <List>
        {available.map(e => <ListItem key={e}>
          <Link 
            style={{ fontSize: '1.3rem', fontWeight: 'bold' }} 
            href={SERVER_ROOT + 'api/force_fields/download?name=' + e} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {e}
          </Link>
        </ListItem>)}
      </List>}
      
      {!available && <Box textAlign="center">
        <Marger size="3rem" />
        <CircularProgress size={56} />
      </Box>}
    </Container>
  );
}
