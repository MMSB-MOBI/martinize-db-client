import React from 'react';
import { withTheme, withStyles, Theme, Typography, Container } from '@material-ui/core';
import { RouteComponentProps } from 'react-router-dom';
import { Molecule } from '../../types/entities';
import { CenterComponent, BigPreloader } from '../../Shared';
import EmbeddedError from '../Errors/Errors';
import ApiHelper from '../../ApiHelper';

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

});

class MoleculePageBase extends React.Component<MPBP, MPBS> {
  state: MPBS = {
    error: undefined,
    molecule: undefined,
    versions: []
  };
  
  componentDidMount() {
    // @ts-ignore
    const alias = this.props.match.params.alias;

    ApiHelper.request('molecule', { parameters: { alias } })
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
      <EmbeddedError title="Unable to find molecule." />
    );
  }

  render() {
    if (this.state.error !== undefined) {
      return this.renderError();
    }

    if (!this.state.molecule) {
      return this.renderInLoad();
    }

    const molecule = this.state.molecule;

    return (
      <Container>
        <Typography variant="h3">
          {molecule.name}
        </Typography>
        <Typography variant="body1">
          {molecule.alias}
        </Typography>

        <pre>
          #{molecule.id}

          {molecule.last_update}

          {molecule.created_at}

          {molecule.files}

          Version {molecule.version} built on Martinize {molecule.martinize_version} with force field {molecule.force_field}.
        </pre>
        
        <pre>
          {this.state.versions.length} versions available.
        </pre>
      </Container>
    );
  }
}

export default withTheme(withStyles(createStyles)(MoleculePageBase));
