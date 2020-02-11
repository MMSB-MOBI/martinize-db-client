import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import EmbeddedError, { FullError } from '../../Errors/Errors';

export default function NotFound(props: RouteComponentProps) {
  return (
    <FullError 
      title="Page not found"
      text={<span>You tried to show <strong>{props.location.pathname}</strong>, but it does not exists.</span>}
    />
  );
}

export function InnerNotFound(props: RouteComponentProps) {
  return (
    <EmbeddedError 
      title="Page not found"
      text={<span>You tried to show <strong>{props.location.pathname}</strong>, but it does not exists.</span>}
    />
  );
}

