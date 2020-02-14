import React from 'react';
import { Route, Switch, RouteComponentProps, Redirect, BrowserRouter } from 'react-router-dom';
import Explore from '../Explore/Explore';
import NotFound, { InnerNotFound } from '../pages/NotFound/NotFound';
import ApplicationDrawer from '../ApplicationBar/ApplicationBar';
import { WaitForLoginFinish } from '../LoginWaiter/LoginWaiter';
import Settings from '../../Settings';
import Login from '../pages/Login/Login';

function LoadAppDrawer(props: RouteComponentProps) {
  return <ApplicationDrawer {...props} />;
}

const RouterCmpt = (props: {}) => {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" exact render={() => <Redirect to="/explore" />} />

        <Route path="/login" exact component={LoadLoginDrawer} />

        <Route path="/molecule/:alias" component={LoadDrawer} />
        <Route path="/group/:alias" component={LoadDrawer} />
        <Route path="/moderation" component={LoadDrawer} />
        <Route path="/stashed/:id" component={LoadDrawer} />
        <Route path="/explore" component={LoadDrawer} />
        <Route path="/submissions" component={LoadDrawer} />
        <Route path="/settings" component={LoadDrawer} />
        <Route path="/contact" component={LoadDrawer} />

        {/* Not found */}
        <Route component={NotFound} />
      </Switch>
    </BrowserRouter>
  )
};

function LoadDrawer(props: RouteComponentProps) {
  return (
    <WaitForLoginFinish {...props} component={LoadAppDrawer} wait={[Settings.login_promise, Settings.martinize_variables_promise]} />
  );
}

function LoadLoginDrawer(props: RouteComponentProps) {
  return (
    <WaitForLoginFinish {...props} component={Login} wait={[Settings.login_promise, Settings.martinize_variables_promise]} />
  );
}

export const DrawerContentRouter = (props: RouteComponentProps) => {
  return (
    <Switch>
      <Route path="/explore" exact component={Explore} />
      
      {/* Not found */}
      <Route component={InnerNotFound} />
    </Switch>
  );
};

export default RouterCmpt;

