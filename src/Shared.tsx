import React from 'react';
import { Grid, CircularProgress } from "@material-ui/core";

export const CenterComponent = (props: any) => {
  return (
    <Grid container direction="column" justify="center" {...props} alignItems="center">
      {props.children}
    </Grid>
  );
};

export const BigPreloader: React.FC<any> = (props: any) => {
  return (
    <CenterComponent {...props}>
      <CircularProgress size={70} thickness={2} />
    </CenterComponent>
  );
};

