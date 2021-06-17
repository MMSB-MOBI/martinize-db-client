import React from 'react';
import ErrorIcon from '@material-ui/icons/ErrorOutline';
import InfoIcon from '@material-ui/icons/InfoOutlined';
import { Typography, Button } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { SvgIconProps } from '@material-ui/core/SvgIcon';
import { APIError } from '../../ApiHelper';
import { errorToText } from '../../helpers';
import { CenterComponent } from '../../Shared';
import './Errors.scss';
import { Link as RouterLink } from 'react-router-dom';
import { FaIcon } from '../../helpers'; 

type EEProp = {
  error?: APIError | number;
  text?: React.ReactNode;
  title?: React.ReactNode;
  in_container?: boolean;
  custom_icon?: React.ComponentType<SvgIconProps>;
  button?: {
    link: string;
    text?: string;
  };
};

type FEProp = {
  error?: APIError | number;
  text?: React.ReactNode;
  title?: React.ReactNode;
  custom_icon?: React.ComponentType<SvgIconProps>;
  button?: {
    link: string;
    text?: string;
  };
};

export const FullError: React.FC<FEProp> = props => {
  let t = props.text as string;

  if (props.error) {
    t = errorToText(props.error);
  }

  return (
    <CenterComponent style={{ height: '100vh', padding: '10px' }} className="Error">
      {props.custom_icon ? 
        <props.custom_icon className="icon" /> : 
        <ErrorIcon className="icon" />
      }
      <Typography component="h5" className="header">
        {props.title ?? "Error"}
      </Typography>
      <Typography component="h6" className="text">
        {t ?? "Unknown error"}
      </Typography>
      {props.button && <Link className="link no-underline" to={props.button.link} style={{ marginTop: '15px' }}>
        <Button color="primary">
          {props.button.text ?? props.button.link}
        </Button>
      </Link>}
      {props.children}
    </CenterComponent>
  );
};

const EmbeddedError: React.FC<EEProp> = props => {
  let t = props.text as string;

  if (props.error) {
    t = errorToText(props.error);
  }

  let style: any = {};
  if (props.in_container !== false) {
    style['padding'] = "14px";
  }

  return (
    <CenterComponent className="Error container" style={style}>
      {props.custom_icon ? 
        <props.custom_icon className="icon" /> : 
        <ErrorIcon className="icon" />
      }
      <Typography component="h5" className="header">
        {props.title ?? "Error"}
      </Typography>
      <Typography component="h6" className="text" align="center">
        {t ?? "Unknown error"}
      </Typography>

      {props.button && <Link className="link no-underline" to={props.button.link} style={{ marginTop: '15px' }}>
        <Button color="primary">
          {props.button.text ?? props.button.link}
        </Button>
      </Link>}

      {props.children}
      <div style = {{paddingTop:'1rem'}}>
      <RouterLink to="/" > 
          <FaIcon home style={{ fontSize: '1rem' }} /> 
          <span style={{fontSize : '1rem'}}> MAD Home </span> 
      </RouterLink>
      </div>
    </CenterComponent>
  )
};

export const EmbeddedInfo: React.FC<{
  text: string, 
  link?: { internal?: boolean; to: string; text?: string; } | string,
  in_container?: boolean,
}> = props => {
  let t = props.text as string;

  const link = props.link &&
    (typeof props.link === 'string' ? 
      <a className="link" href={props.link} rel="noopener noreferrer" target="_blank">{props.link}</a> :
      (props.link?.internal ? 
        <Link className="link" to={props.link.to}>
          {props.link?.text ?? props.link?.to}
        </Link> :
        <a className="link" href={props.link?.to} rel="noopener noreferrer" target="_blank">{props.link?.text ?? props.link?.to}</a>)
      );

  let style: any = {};
  if (props.in_container !== false) {
    style['padding'] = "14px";
  }

  return (
    <CenterComponent className="Error container" style={style}>
      <InfoIcon className="icon" />
      <Typography component="h6" className="text" align="center">
        {t}
      </Typography>
      {link}
      {props.children}
    </CenterComponent>
  )
};

export default EmbeddedError;