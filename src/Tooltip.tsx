import React from 'react';
import { Tooltip as MUITooltip, makeStyles } from '@material-ui/core';

type TProps = {
  children: any;
  placement?: "bottom" | "bottom-end" | "bottom-start" | "left-end" | "left-start" | "left" | "right-end" | "right-start" | "right" | "top-end" | "top-start" | "top";
  title: string;
};

const useStyles = makeStyles(() => ({
  big_text: {
    fontSize: 13,
  }
}));

const Tooltip: React.FC<TProps> = (props: TProps) => {
  const classes = useStyles();

  return (
    <MUITooltip
      classes={{
        tooltip: classes.big_text,
        popper: classes.big_text
      }} 
      title={props.title}
      placement={props.placement ? props.placement : "bottom"}
    >
      {props.children}
    </MUITooltip>
  );
}

export default Tooltip;
