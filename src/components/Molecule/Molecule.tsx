import React from 'react';
import { withTheme, withStyles, Theme, Container, Divider, Link, Icon } from '@material-ui/core';
import { RouteComponentProps } from 'react-router-dom';
import { Molecule } from '../../types/entities';
import { CenterComponent, BigPreloader } from '../../Shared';
import EmbeddedError from '../Errors/Errors';
import ApiHelper from '../../ApiHelper';
import qs from 'qs';
import { setPageTitle } from '../../helpers';
import MoleculeInfo from './MoleculeInfo';
import MoleculeVersion from './MoleculeVersion';

interface MPBP extends RouteComponentProps {
  theme: Theme;
  classes: Record<string, string>;
}

interface MPBS {
  molecule?: Molecule,
  versions: Molecule[],
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

class MoleculePageBase extends React.Component<MPBP, MPBS> {
  state: MPBS = {
    error: undefined,
    molecule: undefined,
    versions: [],
  };

  constructor(props: MPBP) {
    super(props);

    const query_string = qs.parse(this.props.location.search, { ignoreQueryPrefix: true });
    setPageTitle("Molecule");

    if (query_string.edit === "1") {
      this.editOnStartup = true;
    }
    else if (query_string.add === "1") {
      this.addOnStartup = true;
    }
  }

  addOnStartup = false;
  editOnStartup = false;
  
  componentDidMount() {
    // @ts-ignore
    const alias = this.props.match.params.alias;
    const query_string = qs.parse(this.props.location.search, { ignoreQueryPrefix: true });

    const parameters: any = { alias };
    if (query_string.version) {
      parameters.version = query_string.version;
    }

    ApiHelper.request('molecule', { parameters })  
      .then((mol: { molecule: Molecule, versions: Molecule[] }) => {
        setPageTitle(`Molecule - ${mol.molecule.alias} (${mol.molecule.version})`);
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

  goBackButton() {
    return (
      <Link href="#" onClick={() => this.props.history.goBack()} className={this.props.classes.goBackLink}>
        <Icon className="fas fa-arrow-left" style={{ marginRight: 10, fontSize: '1.1rem' }} />
        Go back 
      </Link>
    )
  }

  changeVersion = (id: string) => {
    const new_one = this.state.versions.find(m => m.id === id);

    if (new_one) {
      this.props.history.push({
        search: "?version=" + id
      });

      // todo change qs
      window.scrollTo(0, 0);
      this.setState({
        molecule: new_one
      });
    }
  };

  render() {
    if (this.state.error !== undefined) {
      return this.renderError();
    }

    if (!this.state.molecule) {
      return this.renderInLoad();
    }

    const molecule = this.state.molecule;
    const classes = this.props.classes;

    const parent = molecule.parent ? this.state.versions.find(v => v.id === molecule.parent) : undefined;
    
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
            onMoleculeChange={mol => {
              const versions = this.state.versions;
              const version = versions.findIndex(m => m.id === mol.id);
              if (version !== -1) {
                versions[version] = mol;
              }

              this.setState({ molecule: mol as Molecule });
            }}
            addOnStartup={this.addOnStartup}
            editOnStartup={this.editOnStartup}
            parent={parent}
          />

          <Divider />
          
          <MoleculeVersion 
            current={molecule} 
            versions={this.state.versions} 
            onVersionChange={this.changeVersion}
          />
        </Container>

        
      </React.Fragment>
    );
  }
}

// @ts-ignore
export default withTheme(withStyles(createStyles)(MoleculePageBase));
