import React from 'react';
import { v4 as uuid } from 'uuid';
import { toast } from '../Toaster';
// @ts-ignore
import { Theme, withTheme, CircularProgress } from '@material-ui/core';
import ApiHelper from '../../ApiHelper';
import { applyUserRadius, UserRadius } from '../../nglhelpers';
import { itpBeads } from '../Builder/BeadsHelper';
import NglWrapper, { NglRepresentation, NglComponent } from '../Builder/NglWrapper';
import BallAndStickRepresentation from '@mmsb/ngl/declarations/representation/ballandstick-representation';
import { AvailableForceFields } from '../../types/entities';
import { Settings } from '../../Settings'


// Component types
type MVProps = { id: string, theme: Theme, ff: AvailableForceFields};
type MVState = {
  component?: NglComponent,
  loading: boolean,
  file?: Blob,
};

class MoleculeViewer extends React.Component<MVProps, MVState> {
  protected component_uuid = uuid();
  //protected ngl_stage?: Stage;
  protected ngl! : NglWrapper; 

  state: MVState = {
    loading: false,
    component: undefined,
    file: undefined,
  };

  componentDidMount() {
    //this.ngl_stage = new Stage(this.viewport_id, { backgroundColor: this.props.theme.palette.background.default });
    this.ngl = new NglWrapper(this.viewport_id, { backgroundColor: this.props.theme.palette.background.default })
    this.initStage();
    window.addEventListener('resize', this.refreshStage);

    // @ts-ignore
    window.MoleculeViewer = this;
  }

  componentDidUpdate(old_props: MVProps) {
    if (old_props.id !== this.props.id && this.ngl) {
      // refresh the NGL viewer
      this.initStage();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.refreshStage);
  }

  refreshStage = () => {
    if (this.ngl) {
      this.ngl.stage.handleResize();
    }
  };

  protected get viewport_id() {
    return "molecule_view_" + this.component_uuid;
  }

  protected getUrlFromId() {
    return "molecule/representation/" + this.props.id;
  }

  protected async initStage() {
    this.setState({ loading: true });
    this.ngl.stage.removeAllComponents();

    // Download a new file
    const request: Promise<{ radius: UserRadius, pdb: string, top: string, itps: string[] }> = ApiHelper.request(this.getUrlFromId(), {
      mode: 'json'
    });

    this.setState({
      file: undefined,
    });

    request
      .then(async ({ radius, pdb, top, itps }) => {
        // Apply the radius to NGL
        applyUserRadius(radius);
        console.log("FF", this.props.ff)
        console.log(Settings.martinize_variables.force_fields_info)
        const polarizableFF = Settings.martinize_variables.force_fields_info[this.props.ff].polarizable
        const beads = await itpBeads(top, itps, polarizableFF); 

        // Load the PDB into NGL

        return this.ngl.load(new Blob([pdb]), { ext: 'pdb', name: this.props.id + ".pdb" })
          .then((component) => {
            component.add<BallAndStickRepresentation>('ball+stick', undefined, {radius: true, color: true, beads, ff:this.props.ff, radiusFactor : 0.2})
            component.center()
            this.setState({ component });
          }) 
      })
      .catch((e: any) => {
        toast("Unable to initialize molecule viewer", "error");
        console.error(e);
      })
      .finally(() => {
        this.setState({ loading: false, file: undefined });
      });
  }

  render() {
    return (
      <div
        id={this.viewport_id}
        style={{ width: '100%', height: '100%', minHeight: '300px', borderRadius: '8px', border: '1px #82828278 dashed', position: 'relative' }}
      >
        {this.state.loading && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 999 }}>
          <CircularProgress variant="determinate" value={50} />
        </div>}
      </div>
    );
  }
}

export default withTheme(MoleculeViewer);
