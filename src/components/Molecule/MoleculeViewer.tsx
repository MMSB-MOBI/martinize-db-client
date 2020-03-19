import React from 'react';
import uuid from 'uuid/v4';
import { toast } from '../Toaster';
// @ts-ignore
import { Stage, Component as NGLComponent } from '@mmsb/ngl';
import { Theme, withTheme, CircularProgress } from '@material-ui/core';
import ApiHelper, { RequestPromise } from '../../ApiHelper';
import { applyUserRadius, UserRadius } from '../../nglhelpers';

// Component types
type MVProps = { id: string, theme: Theme, };
type MVState = { 
  component?: NGLComponent, 
  loading: boolean, 
  file?: Blob,
};

class MoleculeViewer extends React.Component<MVProps, MVState> {
  protected component_uuid = uuid();
  protected ngl_stage?: Stage;

  state: MVState = {
    loading: false,
    component: undefined,
    file: undefined,
  };

  componentDidMount() {
    this.ngl_stage = new Stage(this.viewport_id, { backgroundColor: this.props.theme.palette.background.default });
    this.initStage();
    window.addEventListener('resize', this.refreshStage);

    // @ts-ignore
    window.MoleculeViewer = this;
  }

  componentDidUpdate(old_props: MVProps) {
    if (old_props.id !== this.props.id && this.ngl_stage) {
      // refresh the NGL viewer
      this.initStage();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.refreshStage);
  }

  refreshStage = () => {
    if (this.ngl_stage) {
      this.ngl_stage.handleResize();
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
    this.ngl_stage!.removeAllComponents();

    // Download a new file
    const request: Promise<{ radius: UserRadius, pdb: string }> = ApiHelper.request(this.getUrlFromId(), {
      mode: 'json'
    });

    this.setState({
      file: undefined,
    });

    request
      .then(({ radius, pdb }) => {
        // Apply the radius to NGL
        applyUserRadius(radius);

        // Load the PDB into NGL
        return this.ngl_stage!.loadFile(new Blob([pdb]), { ext: 'pdb', name: this.props.id + ".pdb" })
          .then((component: NGLComponent | void) => {
            if (component) {
              component.addRepresentation("ball+stick", undefined);
              component.addRepresentation("cartoon", undefined);
              component.autoView();
      
              // Register the component
              this.setState({ component });
            }
          });
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
