import React from 'react';
import { withTheme, withStyles, Theme, Typography, Container, Divider, Link, Icon, Button } from '@material-ui/core';
import { RouteComponentProps } from 'react-router-dom';
import { Molecule, StashedMolecule } from '../../types/entities';
import { CenterComponent, BigPreloader } from '../../Shared';
import EmbeddedError from '../Errors/Errors';
import ApiHelper from '../../ApiHelper';
import qs from 'qs';
import { setPageTitle, notifyError } from '../../helpers';
import { SERVER_ROOT } from '../../constants';
import Settings, { LoginStatus } from '../../Settings';
import AddMolecule from '../AddMolecule/AddMolecule';

interface StashedProps extends RouteComponentProps {
  theme: Theme;
  classes: Record<string, string>;
}

interface StashedState {
  molecule?: StashedMolecule,
  parent?: Molecule,
  edit?: boolean,
  error?: number,
}

const createStyles = (theme: Theme) => ({
  goBackLink: {
    fontSize: '1.1rem',
    "&:hover": {
      textDecoration: 'none',
    },
    marginLeft: '2vw',
  },
  nameWrapper: {
    padding: 14,
    display: 'grid',
    alignItems: 'center',
    gridTemplateColumns: '1fr 1fr 1fr',
  },
  moleculeName: {
    textAlign: 'center',
    fontSize: '1.8rem',
    fontWeight: '200',
  },
  moleculeAlias: {
    textAlign: 'right',
    fontSize: '1.1rem',
    marginRight: '2vw',
  },
});

class StashedPageBase extends React.Component<StashedProps, StashedState> {
  state: StashedState = {
    error: undefined,
    molecule: undefined,
  };
  
  componentDidMount() {
    if (Settings.logged !== LoginStatus.Admin) {
      return;
    }

    // @ts-ignore
    const id = this.props.match.params.id;
    const query_string = qs.parse(this.props.location.search, { ignoreQueryPrefix: true });

    setPageTitle("Moderation");

    const parameters: any = { id };

    ApiHelper.request('moderation', { parameters })  
      .then((mol: { molecule: StashedMolecule, parent?: Molecule, edit?: boolean, }) => {
        setPageTitle(`Moderation - ${mol.molecule.alias} (${mol.molecule.version})`);

        if (query_string.edit === "1") {
          mol.edit = true;
        }

        this.setState(mol);
      })
      .catch(e => {
        // Todo print error code
        this.setState({
          error: 0
        });
      })
  }

  delete = () => {
    // todo make delete modal
    ApiHelper.request('moderation/destroy/' + this.state.molecule!.id, { method: 'DELETE' })
      .then(() => {
        window.location.pathname = "/moderation";
      })
      .catch(notifyError);
  };

  accept = () => {
    // todo make accept modal
    ApiHelper.request('moderation/accept', { method: 'POST', parameters: { id: this.state.molecule!.id } })
      .then(() => {
        window.location.pathname = "/moderation";
      })
      .catch(notifyError);
  };

  renderInLoad() {
    return (
      <CenterComponent style={{ minHeight: '80vh' }}>
        <BigPreloader />
      </CenterComponent>
    );
  }

  renderError() {
    // todo better error
    return (
      <EmbeddedError title="Unable to find molecule." text="Check the URL." />
    );
  }

  renderForbidden() {
    return (
      <EmbeddedError title="Forbidden" text="You don't have the right to show this page." />
    );
  }

  goBackButton() {
    return (
      <Link href="#" onClick={() => this.props.history.goBack()} className={this.props.classes.goBackLink}>
        <Icon className="fas fa-arrow-left" style={{ marginRight: 10, fontSize: '1.1rem' }} />
        Go back 
      </Link>
    )
  }

  render() {
    if (Settings.logged !== LoginStatus.Admin) {
      return this.renderForbidden();
    }

    if (this.state.error !== undefined) {
      return this.renderError();
    }

    if (!this.state.molecule) {
      return this.renderInLoad();
    }

    const molecule = this.state.molecule;
    const classes = this.props.classes;
    
    return (
      <React.Fragment>
        <div className={classes.nameWrapper}>
          {/* we came from another page of the website */}
          {(this.props.history.action === "PUSH") ? this.goBackButton() : <span />}

          <span className={classes.moleculeName}>
            {molecule.name}
          </span>

          <span className={classes.moleculeAlias}>
            {molecule.alias}
          </span>
        </div>

        <Divider />

        <Container>
          <pre className="pre-break">
            <code>
              {`#${molecule.id}

              Creation date at ${molecule.created_at}

              Related ZIP file ID: ${molecule.files}

              Molecule version ${molecule.version} built on Martinize ${molecule.martinize_version} with force field ${molecule.force_field}.\n`}
            </code>

            <br />

            <Link href={SERVER_ROOT + "api/molecule/download?id=" + molecule.files + "&filename=" + molecule.alias + ".zip"} style={{ fontSize: '1.2rem' }}>
              <Icon className="fas fa-download" style={{ fontSize: '1.2rem', marginRight: 10 }} />
              <span>
                Download related files
              </span>
            </Link>
          </pre>

          {/* Edit / delete button */}
          <div style={{ display: 'flex', marginTop: 15 }}>
            <Button variant="outlined" color="primary" style={{ marginRight: 10 }} onClick={() => this.setState({ edit: true })}>
              Edit
            </Button>
            <Button 
              variant="outlined" 
              color="inherit" 
              style={{ marginRight: 10, color: 'green', borderColor: 'green' }}
              onClick={this.accept}
            >
              Accept
            </Button>
            <Button variant="outlined" color="secondary" onClick={this.delete}>
              Delete
            </Button>
          </div>

          <Divider />
          
          <pre>
            {this.state.parent ? "One" : "No"} parent available.
          </pre>

          <pre>
            <code>
              {JSON.stringify(this.state.parent, null, 2)}
            </code>
          </pre>
        </Container>

        <AddMolecule 
          onChange={mol => this.setState({ molecule: mol, edit: false })}
          from={this.state.molecule}
          stashed
          open={!!this.state.edit}
          onClose={() => this.setState({ edit: false })}
        />
      </React.Fragment>
    );
  }
}

// @ts-ignore
export default withTheme(withStyles(createStyles)(StashedPageBase));
