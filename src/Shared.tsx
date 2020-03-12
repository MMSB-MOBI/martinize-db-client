import React from 'react';
import { Grid, CircularProgress, FormControl, InputLabel, Select, MenuItem } from "@material-ui/core";
import clsx from 'clsx';

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

export function LoadFader(props: React.PropsWithChildren<{ when?: boolean }>) {
  return (
    <div className={clsx("can-load", props.when && "in")}>
      {props.children}
    </div>
  );
}

export function SimpleSelect(props: { label: string, value: string, onChange: (v: string) => void, id: string, values: { id: string, name: string }[], disabled?: boolean, formControlClass?: string }) {
  const inputLabel = React.useRef<HTMLLabelElement>(null);
  const [labelWidth, setLabelWidth] = React.useState(0);
  React.useEffect(() => {
    if (inputLabel.current)
      setLabelWidth(inputLabel.current!.offsetWidth);
  }, [props]);

  return (
    <FormControl className={props.formControlClass} variant="outlined" style={{ minWidth: 180 }}>
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
