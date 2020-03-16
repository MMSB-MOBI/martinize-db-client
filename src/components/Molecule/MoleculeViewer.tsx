import React from 'react';
import uuid from 'uuid/v4';
import { toast } from '../Toaster';
// @ts-ignore
import { Stage, Component as NGLComponent } from '@mmsb/ngl';
import { Theme, withTheme, CircularProgress } from '@material-ui/core';
import ApiHelper, { RequestPromise } from '../../ApiHelper';

// Component types
type MVProps = { id: string, theme: Theme, };
type MVState = { 
  component?: NGLComponent, 
  loading: boolean, 
  file?: Blob,
  download_percentage: number,
  request?: RequestPromise<Blob>,
};

class MoleculeViewer extends React.Component<MVProps, MVState> {
  protected component_uuid = uuid();
  protected ngl_stage?: Stage;

  state: MVState = {
    loading: false,
    component: undefined,
    file: undefined,
    download_percentage: 0,
    request: undefined,
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
    return "molecule/representation/" + this.props.id + ".pdb";
  }

  protected initStage() {
    this.setState({ loading: true });
    this.ngl_stage!.removeAllComponents();

    // Cancel current request
    if (this.state.request) {
      const req = this.state.request.request;
      req.onprogress = null;
      req.onerror = null;
      req.abort();
    }

    // Download a new file
    const request = ApiHelper.rawRequest(this.getUrlFromId(), {
      onprogress: download_percentage => {
        this.setState({ download_percentage });
      },
      type: 'blob',
      latency: 250,
    });

    this.setState({
      download_percentage: 1,
      file: undefined,
      request
    });

    request.then((blob: Blob) => {
      this.setState({ download_percentage: 100 });

      this.ngl_stage!.loadFile(blob, { ext: 'pdb', name: this.props.id + ".pdb" })
        .then((component: NGLComponent | void) => {
          if (component) {
            component.addRepresentation("ball+stick", undefined);
            component.addRepresentation("cartoon", undefined);
            component.autoView();
    
            // Register the component
            this.setState({ component });
          }
        })
        .catch((e: any) => {
          toast("Unable to initialize molecule viewer", "error");
          console.error(e);
        })
        .finally(() => {
          this.setState({ loading: false, download_percentage: 0, file: undefined, request: undefined });
        });
    });
  }

  render() {
    return (
      <div 
        id={this.viewport_id} 
        style={{ width: '100%', height: '100%', minHeight: '300px', borderRadius: '8px', border: '1px #82828278 dashed', position: 'relative' }} 
      >
        {this.state.loading && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 999 }}>
          <CircularProgress variant="static" value={this.state.download_percentage} />
        </div>}
      </div>
    );
  }
}

export default withTheme(MoleculeViewer);
