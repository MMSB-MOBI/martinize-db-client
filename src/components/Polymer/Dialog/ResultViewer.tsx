import React from 'react';
import { Theme, withTheme, CircularProgress } from '@material-ui/core';
import ApiHelper from '../../../ApiHelper';
import { applyUserRadius, UserRadius } from '../../../nglhelpers';
import { itpBeads } from '../../Builder/BeadsHelper';
import NglWrapper, { NglRepresentation, NglComponent } from '../../Builder/NglWrapper';
import BallAndStickRepresentation from '@mmsb/ngl/declarations/representation/ballandstick-representation';
import { AvailableForceFields } from '../../../types/entities';
import { Settings } from '../../../Settings'


// Component types
type MVProps = { pdb: string, ff: AvailableForceFields, itp:string,  theme: Theme };
type MVState = {
    component?: NglComponent,
    loading: boolean,
    file?: Blob,
};

class ResultViewer extends React.Component<MVProps, MVState> {
    //protected ngl_stage?: Stage;
    protected ngl!: NglWrapper;

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



    componentWillUnmount() {
        window.removeEventListener('resize', this.refreshStage);
    }

    refreshStage = () => {
        if (this.ngl) {
            this.ngl.stage.handleResize();
        }
    };

    protected get viewport_id() {
        return "molecule_view_";
    }

     
    protected async initStage() {
        this.setState({ loading: true });
        this.ngl.stage.removeAllComponents();


        // Apply the radius to NGL
        //applyUserRadius(radius);
        console.log("FF", this.props.ff)
        console.log(Settings.martinize_variables.force_fields_info)
        const polarizableFF = Settings.martinize_variables.force_fields_info[this.props.ff].polarizable
        //const beads = await itpBeads(top, this.props.itp, polarizableFF);

        // Load the PDB into NGL

        this.ngl.load(new Blob([this.props.pdb]), { ext: 'pdb', name: "out.pdb" })
            .then((component) => {
                component.add<BallAndStickRepresentation>("ball+stick")
                //component.add<BallAndStickRepresentation>('ball+stick', undefined, { radius: true, color: true, /* beads */, ff: this.props.ff, radiusFactor: 0.2 })
                component.center()
                this.setState({ component });
            })

    }

    render() {
        return (
            <div
                id={this.viewport_id}
                style={{ width: '100%', height: '100%', minHeight: '300px', borderRadius: '8px', border: '1px #82828278 dashed', position: 'relative' }}
            >
                 
            </div>
        );
    }
}

export default withTheme(ResultViewer);
