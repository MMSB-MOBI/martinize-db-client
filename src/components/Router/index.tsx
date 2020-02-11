import React from 'react';
import { BrowserRouter as Router, Route, Switch, RouteComponentProps, Redirect } from 'react-router-dom';
import Explore from '../Explore/Explore';
import NotFound, { InnerNotFound } from '../pages/NotFound/NotFound';
import Login from '../pages/Login/Login';
import ApplicationDrawer from '../ApplicationBar/ApplicationBar';

function LoadAppDrawer(props: RouteComponentProps) {
  return <ApplicationDrawer {...props} />;
}

const RouterCmpt = (props: {}) => {
  return (
    <Router>
      {/* For now, every page except login will be encapsulated in ApplicationBar drawer */}

      <Switch>
        <Route path="/login" exact component={Login} />

        <Route path="/" exact render={() => <Redirect to="/explore" />} />

        <Route path="/molecule/:alias" component={LoadAppDrawer} />
        <Route path="/group/:alias" component={LoadAppDrawer} />
        <Route path="/moderation" component={LoadAppDrawer} />
        <Route path="/stashed/:id" component={LoadAppDrawer} />
        <Route path="/explore" component={LoadAppDrawer} />
        <Route path="/submissions" component={LoadAppDrawer} />
        <Route path="/settings" component={LoadAppDrawer} />
        <Route path="/contact" component={LoadAppDrawer} />

        {/* Not found */}
        <Route component={NotFound} />
      </Switch>
    </Router>
  )
};

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

