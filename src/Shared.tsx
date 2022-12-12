import React from 'react';
import { Grid, CircularProgress, FormControl, InputLabel, Select, MenuItem } from "@material-ui/core";
import { Alert } from '@material-ui/lab';
import clsx from 'clsx';

export const CenterComponent = (props: any) => {
  return (
    <Grid container direction="column"  style = {{justifyContent:'center'}} {...props} alignItems="center">
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

export function LoadFader(props: React.PropsWithChildren<{ when?: boolean }>) {
  return (
    <div className={clsx("can-load", props.when && "in")}>
      {props.children}
    </div>
  );
}

export function SimpleSelect(props: { 
  label: string, 
  value: string, 
  onChange: (v: string) => void, id: string, 
  values: { id: string, name: string }[], 
  disabled?: boolean, 
  formControlClass?: string,
  variant?: "outlined" | "standard" | "filled",
  noMinWidth?: boolean,
  required?: boolean,
}) {
  const inputLabel = React.useRef<HTMLLabelElement>(null);
  const [labelWidth, setLabelWidth] = React.useState(0);
  React.useEffect(() => {
    if (inputLabel.current)
      setLabelWidth(inputLabel.current!.offsetWidth);
  }, [props]);

  return (
    <FormControl required={props.required} className={props.formControlClass} variant={props.variant ?? "outlined"} style={{ minWidth: props.noMinWidth ? 0 : 180 }}>
      <InputLabel ref={inputLabel} id={props.id}>
        {props.label}
      </InputLabel>
      <Select
        labelId={props.id}
        value={props.value}
        onChange={v => props.onChange(v.target.value as string)}
        labelWidth={labelWidth}
        required
        disabled={props.disabled}
      >
        {props.values.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
      </Select>
    </FormControl>
  )
}

export const BetaWarning = () => {
  return <Alert severity="warning" style = {{justifyContent:'center', alignItems: 'center'}}>
    <div>
     <div>This is a beta version of MAD service. If you have any suggestions or problems, please contact us at mad-support@ibcp.fr or use contact page. </div>
     <div> New accounts for using beta versions of Molecule Builder and System Builder will be available starting September 1st 2021. </div>
    </div>
  </Alert>
} 



export const TutorialShow = () => {
  return <Alert severity="info" 
    style = {{justifyContent:'center', alignItems: 'center'}}>
    New to MAD? Try our <a href="tutorial">tutorial!</a>
  </Alert>
}