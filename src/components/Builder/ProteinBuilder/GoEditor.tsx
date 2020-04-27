import React from 'react';
import NglWrapper from '../NglWrapper';
import PickingProxy from '@mmsb/ngl/declarations/controls/picking-proxy';
import { Vector3 } from 'three';
import { Shape } from '@mmsb/ngl';
import { Typography, Divider, Button, Box } from '@material-ui/core';
import * as ngl from '@mmsb/ngl';
import { Marger, FaIcon } from '../../../helpers';

interface GoEditorProps {
  stage: NglWrapper;
  onBondCreate(go_atom_1: number, go_atom_2: number): any;
  onBondRemove(real_atom_1: number, real_atom_2: number): any;
  onAllBondRemove(from_go_atom: number): any;
  onCancel(): any;

  onRedrawGoBonds(highlight?: [number, number], opacity?: number): any;
  setColorForCgRepr(schemeId?: string): any;
}

interface GoEditorState {
  mode: 'idle' | 'add-link';
  clicked?: {
    type: 'atom',
    source: number,
  } | { 
    type: 'link',
    source: number,
    target: number,
  };
}

interface PickedGoBond {
  name: string;
  color: { r: number, g: number, b: number };
  radius: number;
  position1: Vector3;
  position2: Vector3;
  shape: Shape;
}

// Mode idle:
// Click one atom or bond, clicked will be filled
// IF ATOM: Remove all bonds from this atom (go atom selected) OR create a new bond from this atom
// IF LINK: Remove this link
// When create bond: Click on a atom, link will be automatically created

export default class GoEditor extends React.Component<GoEditorProps, GoEditorState> {
  state: GoEditorState = {
    mode: 'idle',
  };

  componentDidMount() {
    this.props.stage.onClick(this.nglClickReciever);
    this.props.stage.removePanOnClick();
  }

  componentWillUnmount() {
    this.props.stage.removeEvents();
    this.props.onRedrawGoBonds();
    this.props.stage.restoreDefaultMouseEvents();
    this.props.setColorForCgRepr();
  }

  nglClickReciever = (pp?: PickingProxy) => {
    if (!pp) {
      // Disable selection. De-highlight all only if not in atom selection
      if (this.state.mode === 'idle') {
        if (this.state.clicked?.type === 'link') {
          this.removeBondHighlight();
        }
        if (this.state.clicked?.type === 'atom') {
          this.removeAtomHighlight();
        }

        this.setState({ 
          clicked: undefined,
        });
      }

      return;
    }

    // Detect type
    // If go atom, pp.atom.element === "CA"
    if (pp.atom?.element === "CA") {
      // GO atom
      let source_or_target = pp.atom.index;
      // Get the residue index (this is the needed thing to highlight it)
      const residue_number = pp.atom.resno;

      if (this.state.mode === 'add-link' && this.state.clicked?.type === 'atom') {
        // Create the bond if possible
        if (this.state.clicked.source !== source_or_target)
          this.props.onBondCreate(this.state.clicked.source, source_or_target);

        this.setState({
          mode: 'idle'
        });

        // Stop here
        return;
      }

      // Remove the highlighted bond/the highlighted atom
      if (this.state.clicked?.type === 'link') {
        this.removeBondHighlight();
      }
      else {
        this.removeAtomHighlight();
      }

      // Highlight the selected one
      this.highlightAtom(residue_number);

      this.setState({
        clicked: {
          type: 'atom',
          source: source_or_target,
        }
      });
    }
    else if (pp.atom === undefined && pp.bond === undefined && (pp.object as PickedGoBond)?.name) {
      if (this.state.mode === 'add-link') {
        // can't select for now
        return;
      }

      // this might be a go bond...
      const obj = pp.object as PickedGoBond;

      if (!obj.name.startsWith('[GO]')) {
        return;
      }

      // Remove highlight atom if any
      if (this.state.clicked?.type === 'atom') {
        this.removeAtomHighlight();
      }
      
      // Get atoms
      const [source, target] = obj.name.split('atoms ')[1].split('-').map(Number);

      // Highlight the bond
      this.highlightBond([source, target]);

      this.setState({
        clicked: {
          type: 'link',
          source,
          target,
        }
      });
    }
  };

  highlightBond(target: [number, number]) {
    this.props.onRedrawGoBonds(target, 1);
  } 

  removeBondHighlight() {
    this.props.onRedrawGoBonds(undefined, 1);
  }

  highlightAtom(...indexes: number[]) {
    console.log(indexes)
    const schemeId = ngl.ColormakerRegistry.addSelectionScheme([
      ["red", indexes.join(' or ')],
      // @ts-ignore
      ["element", "*"],
    ], "test");
    
    this.props.setColorForCgRepr(schemeId);
  }

  removeAtomHighlight() {
    this.props.setColorForCgRepr();
  }

  onAddLinkEnable = () => {
    this.setState({ mode: 'add-link' });
  };

  onAddLinkDisable = () => {
    this.setState({ mode: 'idle' });
  };
  
  onRemoveAllBonds = () => {
    const { clicked } = this.state;
    if (!clicked) {
      return;
    }

    this.props.onAllBondRemove(clicked.source);
  };

  onRemoveBond = () => {
    const { clicked } = this.state;
    if (!clicked || clicked.type !== 'link') {
      return;
    }

    this.props.onBondRemove(clicked.source, clicked.target);
    this.setState({ mode: 'idle', clicked: undefined });
  };

  renderAtomSelected() {
    return (
      <React.Fragment>
        <Typography align="center">
          Atom #<strong>{this.state.clicked!.source}</strong> selected.
        </Typography>

        <Marger size="1rem" />

        <Typography variant="body2" align="center">
          You can add a new bond between this atom and another Go virtual site, or
          you can remove every go bond attached to this atom.
        </Typography>
        <Typography variant="body2" align="center">
          To remove a specific bond, just click on it.
        </Typography>

        <Marger size="1rem" />

        <Box alignContent="center" justifyContent="center" width="100%" flexDirection="column">
          <Button 
            style={{ width: '100%' }} 
            color="primary" 
            onClick={this.onAddLinkEnable}
          >
            <FaIcon plus /> <span style={{ marginLeft: '.6rem' }}>Add Go bond</span>
          </Button>

          <Marger size=".2rem" />

          <Button 
            style={{ width: '100%' }} 
            color="secondary" 
            onClick={this.onRemoveAllBonds}
          >
            <FaIcon trash /> <span style={{ marginLeft: '.6rem' }}>Remove all Go links of atom</span>
          </Button>
        </Box>
      </React.Fragment>
    );
  }

  renderWaitingSecondAtomSelection() {
    return (
      <React.Fragment>
        <Typography align="center">
          Creating a link between atom #<strong>{this.state.clicked!.source}</strong> and another.
        </Typography>

        <Typography variant="body2" align="center">
          Please select another Go atom to create link, or click below to cancel operation.
        </Typography>

        <Marger size="1rem" />

        <Box alignContent="center" justifyContent="center" width="100%" flexDirection="column">
          <Button 
            style={{ width: '100%' }} 
            color="primary" 
            onClick={this.onAddLinkDisable}
          >
            <FaIcon times /> <span style={{ marginLeft: '.6rem' }}>Cancel</span>
          </Button>
        </Box>
      </React.Fragment>
    );
  }

  renderLinkSelected() {
    if (this.state.clicked?.type !== 'link') {
      return;
    }

    return (
      <React.Fragment>
        <Typography align="center">
          Link between atoms #<strong>{this.state.clicked!.source}</strong> and #<strong>{this.state.clicked!.target}</strong>.
        </Typography>

        <Typography variant="body2" align="center">
          You can remove this bond by clicking on the button below.
        </Typography>

        <Marger size="1rem" />

        <Box alignContent="center" justifyContent="center" width="100%" flexDirection="column">
          <Button 
            style={{ width: '100%' }} 
            color="secondary" 
            onClick={this.onRemoveBond}
          >
            <FaIcon trash /> <span style={{ marginLeft: '.6rem' }}>Remove</span>
          </Button>
        </Box>
      </React.Fragment>
    );
  }

  renderNoneSelected() {
    return (
      <React.Fragment>
        <Typography align="center">
          Please select virtual Go atom or bond by clicking on them in the molecule representation.
        </Typography>

        <Marger size=".7rem" />

        <Typography variant="body2" align="center">
          Go atoms and bonds are highlighted in green.
        </Typography>
      </React.Fragment>
    );
  }

  render() {
    return (
      <React.Fragment>
        <Marger size="1rem" />

        {/* Theme */}
        <Typography variant="h6" align="center">
          Edit Go virtual bonds
        </Typography>

        <Marger size="2rem" />

        {this.state.mode === 'idle' && this.state.clicked?.type === 'atom' && this.renderAtomSelected()}

        {this.state.mode === 'add-link' && this.state.clicked?.type === 'atom' && this.renderWaitingSecondAtomSelection()}

        {this.state.mode === 'idle' && this.state.clicked?.type === 'link' && this.renderLinkSelected()}

        {this.state.mode === 'idle' && !this.state.clicked && this.renderNoneSelected()}

        <Marger size="2rem" />

        <Divider style={{ width: '100%' }} />

        <Marger size="1rem" />

        <Box alignContent="center" justifyContent="center" width="100%">
          <Button 
            style={{ width: '100%' }} 
            color="primary" 
            onClick={this.props.onCancel}
          >
            <FaIcon arrow-left /> <span style={{ marginLeft: '.6rem' }}>Back to visualization</span>
          </Button>
        </Box>
      </React.Fragment>
    );
  }
}
