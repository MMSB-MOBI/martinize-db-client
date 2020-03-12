import React from 'react';
import { withTheme, withStyles, Theme, Container, Divider, Link, Icon } from '@material-ui/core';
import { RouteComponentProps } from 'react-router-dom';
import { Molecule, StashedMolecule } from '../../types/entities';
import { CenterComponent, BigPreloader } from '../../Shared';
import EmbeddedError from '../Errors/Errors';
import ApiHelper from '../../ApiHelper';
import qs from 'qs';
import { setPageTitle } from '../../helpers';
import Settings, { LoginStatus } from '../../Settings';
import MoleculeInfo from '../Molecule/MoleculeInfo';
import MoleculeParent from '../Molecule/MoleculeParent';

interface StashedProps extends RouteComponentProps {
  theme: Theme;
  classes: Record<string, string>;
}

interface StashedState {
  molecule?: StashedMolecule,
  parent?: Molecule,
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
      <Link onClick={() => this.props.history.goBack()} className={this.props.classes.goBackLink}>
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
          <MoleculeInfo 
            molecule={molecule}
            stashed
            onMoleculeChange={mol => this.setState({ molecule: mol })}
          />

          <Divider />
          
          <MoleculeParent parent={this.state.parent} />
        </Container>
      </React.Fragment>
    );
  }
}

// @ts-ignore
export default withTheme(withStyles(createStyles)(StashedPageBase));
