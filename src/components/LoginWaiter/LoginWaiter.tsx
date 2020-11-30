import React from 'react';
import Settings, { LoginStatus } from '../../Settings';
import { FullError } from '../Errors/Errors';
import { BigPreloader } from '../../Shared';
import { Link, Button } from '@material-ui/core';

export type AllowedLoginState = "none" | "progress" | "curator" | "admin" | "error" | "done";
export type RegisterableLoginState = "none" | "curator" | "admin" | "done";

type LWProps = { 
  component: React.ComponentType;
  renderWhen: RegisterableLoginState | RegisterableLoginState[];
  wait: Promise<any> | Promise<any>[];

  onNotAllowed?: JSX.Element | React.ComponentType<{ state: AllowedLoginState }>;
  onWaiting?: JSX.Element | React.ComponentType;
  onError?: JSX.Element | React.ComponentType;
};

type LWState = {
  logged: AllowedLoginState;
};

/**
 * Wrap the login phase into a component, in order to wait login-ness into a component.
 * 
 * When login is completed and matches {renderWhen}, the {component} is rendered.
 */
export default class LoginWaiter extends React.Component<LWProps, LWState> {
  state: LWState;

  constructor(props: LWProps) {
    super(props);

    Promise.all(Array.isArray(this.props.wait) ? this.props.wait : [this.props.wait])
      .then(() => {
        let logged: AllowedLoginState;
        if (Settings.logged === LoginStatus.Admin) {
          logged = "admin";
        }
        else if (Settings.logged === LoginStatus.Curator) {
          logged = "curator";
        }
        else {
          // None
          logged = "none";
        }

        this.setState({ logged });
      })
      .catch(() => {
        this.setState({ logged: "error" });
      });

    this.state = {
      logged: "progress"
    };
  }

  get allowed() {
    const r_w = this.props.renderWhen as RegisterableLoginState | RegisterableLoginState[];

    if (typeof r_w=== 'string')
      return [r_w];
    return r_w;
  }

  renderNotAllowed() {

    if (this.props.onNotAllowed) {
      if (React.isValidElement(this.props.onNotAllowed)) {
        return this.props.onNotAllowed;
      }
      else {
        const Cpnt = this.props.onNotAllowed as React.ComponentType<{ state: AllowedLoginState }>;
        return <Cpnt state={this.state.logged} />;
      }
    }

    //Adapt error message
    let error_text:string = "You can't access this page" 
    switch(this.state.logged){
      case "none" : error_text = error_text + " as simple user. You may login or make request for an account.";
        break; 
      case "curator" : error_text = error_text + " as curator."
        break; 
      case "admin" : error_text = error_text + " as admin."
        break; 
    }
    

    return <FullError
      text={error_text}
      button={{
        link: "/",
        text: "Home"
      }}
    />;
  }

  renderOnWaiting() {
    if (this.props.onWaiting) {
      if (React.isValidElement(this.props.onWaiting)) {
        return this.props.onWaiting;
      }
      else {
        const Cmnt = this.props.onWaiting as React.ComponentType;
        return <Cmnt />;
      }
    }
    
    return (
      <BigPreloader style={{ height: '100vh' }} />
    );
  }

  renderError() {
    if (this.props.onError) {
      if (React.isValidElement(this.props.onError))
        return this.props.onError;
      else
        // @ts-ignore
        return <this.props.onError />;
    }

    return <FullError
      text="Unable to login. This might be an server error, or you login keys are not valid anymore."
    >
      <Link className="link no-underline" href="#" style={{ marginTop: '15px' }} onClick={async () => { await Settings.unlog(); window.location.pathname = "/login"; }}>
        <Button color="primary">
          Log out
        </Button>
      </Link>
    </FullError>;
  }

  render() {
    if (this.state.logged === "progress") {
      return this.renderOnWaiting();
    }

    if (this.state.logged === "error") {
      return this.renderError();
    }

    // On est plus en train d'attendre ou face à une erreur

    // Si on autorise n'importe quel mode représentant une phase de login "terminée"
    if (this.allowed.includes("done")) {
      return <this.props.component {...this.props} />;
    }

    // Si on recherche un type précis
    if (this.allowed.includes(this.state.logged)) {
      return <this.props.component {...this.props} />;
    }

    // Visiblement, on a pas le bon type.
    return this.renderNotAllowed();
  }
}

export function WaitForLoginFinish<T extends { component: React.ComponentType<any>, wait: Promise<any> | Promise<any>[] }>(props: T) {
  return <LoginWaiter {...props} renderWhen="done" />
};

export function WaitForLogged<T extends { component: React.ComponentType<any>, wait: Promise<any> | Promise<any>[] }>(props: T) {
  return <LoginWaiter {...props} renderWhen={["admin", "curator"]} />
};

export function WaitForAdminLogged<T extends { component: React.ComponentType<any>, wait: Promise<any> | Promise<any>[] }>(props: T) {
  return <LoginWaiter {...props} renderWhen="admin" />
};
