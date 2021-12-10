import React from 'react';
import { Route, Switch, RouteComponentProps, Redirect, BrowserRouter } from 'react-router-dom';
import Explore from '../Explore/Explore';
import NotFound, { InnerNotFound } from '../pages/NotFound/NotFound';
import ApplicationDrawer from '../ApplicationBar/ApplicationBar';
import { WaitForLoginFinish, WaitForLogged, WaitForAdminLogged } from '../LoginWaiter/LoginWaiter';
import Settings from '../../Settings';
import Login from '../pages/Login/Login';
import MoleculePage from '../Molecule/Molecule';
import StashedMolecule from '../Moderation/Stashed';
import MySubmissions from '../MySubmissions/MySubmissions';
import Moderation from '../Moderation/Moderation';
import SettingsPage from '../Settings/Settings';
import Users from '../Users/Users';
import LostPassword from '../pages/LostPassword/LostPassword';
import ChangePassword from '../pages/ChangePassword/ChangePassword';
import CreateAccount from '../pages/CreateAccount/CreateAccount';
import ContactPage from '../Contact/Contact';
import MartinizeBuilder from '../Builder/Builder';
import MembraneBuilder from '../Builder/MembraneBuilder';
import ForceField from '../ForceField/ForceField';
import MyHistory from '../MyHistory/MyHistory'; 
import Tutorial from '../Tutorial/Tutorial'

function LoadAppDrawer(props: RouteComponentProps) {
  return <ApplicationDrawer {...props} />;
}

const RouterCmpt = () => {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" exact render={() => <Redirect to="/explore" />} />

        <Route path="/login" exact component={LoadLoginDrawer} />
        <Route path="/lost_password" exact component={LoadLostPasswordDrawer} />
        <Route path="/create_account" exact component={LoadCreateAccountDrawer} />
        <Route path="/change_password" exact component={LoadChangePasswordDrawer} />
        <Route path="/builder" exact component={LoadMartinizeBuilder} />
        <Route path="/membrane_builder" exact component={LoadMembraneBuilder} />

        <Route path="/molecule/:alias" component={LoadDrawer} />
        <Route path="/group/:alias" component={LoadDrawer} />
        <Route path="/moderation" component={LoadDrawer} />
        <Route path="/stashed/:id" component={LoadDrawer} />
        <Route path="/explore" component={LoadDrawer} />
        <Route path="/submissions" component={LoadDrawer} />
        <Route path="/history" component={LoadDrawer} />
        <Route path="/settings" component={LoadDrawer} />
        <Route path="/users" component={LoadDrawer} />
        <Route path="/contact" component={LoadDrawer} />
        <Route path="/force_fields" component={LoadDrawer} />
        <Route path="/builder/:id" exact component={LoadMartinizeBuilder} />

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

function LoadMartinizeBuilder(props: RouteComponentProps) {
  return (
    <WaitForLoginFinish {...props} component={MartinizeBuilder} wait={[Settings.login_promise, Settings.martinize_variables_promise]} />
  );
}

function LoadMembraneBuilder(props: RouteComponentProps) {
  return (
    <WaitForLoginFinish {...props} component={MembraneBuilder} wait={[Settings.login_promise, Settings.martinize_variables_promise]} />
  );
}

function LoadLoginDrawer(props: RouteComponentProps) {
  return (
    <WaitForLoginFinish {...props} component={Login} wait={[Settings.login_promise, Settings.martinize_variables_promise]} />
  );
}

function LoadLostPasswordDrawer(props: RouteComponentProps) {
  return (
    <WaitForLoginFinish {...props} component={LostPassword} wait={[Settings.login_promise, Settings.martinize_variables_promise]} />
  );
}

function LoadCreateAccountDrawer(props: RouteComponentProps) {
  return (
    <WaitForLoginFinish {...props} component={CreateAccount} wait={[Settings.login_promise, Settings.martinize_variables_promise]} />
  );
}

function LoadChangePasswordDrawer(props: RouteComponentProps) {
  return (
    <WaitForLoginFinish {...props} component={ChangePassword} wait={[Settings.login_promise, Settings.martinize_variables_promise]} />
  );
}

function LoadSettingsDrawer(props: RouteComponentProps) {
  return (
    <WaitForLogged {...props} component={SettingsPage} wait={[Settings.login_promise]} />
  );
}

function LoadUsersDrawer(props: RouteComponentProps) {
  return (
    <WaitForAdminLogged {...props} component={Users} wait={[Settings.login_promise]} />
  );
}

function LoadModerationDrawer(props: RouteComponentProps) {
  return (
    <WaitForAdminLogged {...props} component={Moderation} wait={[Settings.login_promise]} />
  );
}


export const DrawerContentRouter = (props: RouteComponentProps) => {
  return (
    <Switch>
      <Route path="/explore" exact component={Explore} />
      <Route path="/molecule/:alias" component={MoleculePage} />
      <Route path="/force_fields" component={ForceField} />
      <Route path="/submissions" component={MySubmissions} />
      <Route path="/history" component={MyHistory} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/settings" component={LoadSettingsDrawer} />
      <Route path="/users" component={LoadUsersDrawer} />
      <Route path="/moderation" component={LoadModerationDrawer} />
      <Route path="/stashed/:id" component={StashedMolecule} />
      
      {/* Not found */}
      <Route component={InnerNotFound} />
    </Switch>
  );
};

export default RouterCmpt;

