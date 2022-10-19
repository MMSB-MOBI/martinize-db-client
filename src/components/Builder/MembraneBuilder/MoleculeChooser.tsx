import React from 'react';
import { withStyles, Link, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, DialogContentText, CircularProgress } from '@material-ui/core';
import AddMoleculeFileInput from '../../AddMolecule/AddMoleculeFileInput';
import { toast } from '../../Toaster';
import { Marger, FaIcon, loadMartinizeFiles } from '../../../helpers';
import ApiHelper from '../../../ApiHelper';
import { Molecule, ReadedJobDoc } from '../../../types/entities';
import { SimpleSelect } from '../../../Shared';
import Settings from '../../../Settings';
import { Link as RouterLink } from 'react-router-dom';
import HistoryBuild from '../HistoryBuild'

export interface MoleculeWithFiles {
  pdb: File;
  top: File;
  itps: File[];
  force_field: string;
  builder_mode?: string; 
}

interface MCProps {
  Force_field : boolean;
  AddMolecule: string;
  classes: Record<string, string>;
  onMoleculeChoose(molecule: MoleculeWithFiles | Molecule | undefined): any;
}

interface MCState {
  pdb?: File;
  top?: File;
  itps: File[];
  ff: string;
  modal_chooser: boolean;
  builder_mode : string; 
}

class MoleculeChooser extends React.Component<MCProps, MCState> {
  state: MCState = {
    itps: [],
    modal_chooser: false,
    ff: 'martini3001',
    builder_mode : "classic"
  };

  // here
  nextFromFiles = () => {
    if (this.props.AddMolecule === "true"){
      const { pdb, top, itps, ff, builder_mode } = this.state;

      if (pdb && top && itps.length) {
        this.props.onMoleculeChoose({
          pdb, top, itps, force_field: ff, builder_mode
        });
      }
      else {
        toast("Some required files are missing.", "error");
      }
    } else {
      this.props.onMoleculeChoose(undefined);
    }
    
  };

  nextFromMolecule = (molecule: Molecule) => {
    this.setState({ modal_chooser: false });
    molecule.builder_mode = this.state.builder_mode
    this.props.onMoleculeChoose(molecule);
  };

  // here
  get can_continue() {
    if(this.props.AddMolecule === "false") {
      return this.props.Force_field;
    }
    else {
      const { pdb, top, itps } = this.state;

      return !!(pdb && top && itps.length);
    }
  }

  get force_fields() {
    return Settings.martinize_variables.force_fields;
  }

  render() {
    return (
      <React.Fragment>
        {this.props.AddMolecule === "true" && <React.Fragment>
          <ModalMoleculeSelector
            open={this.state.modal_chooser}
            onChoose={this.nextFromMolecule}
            onCancel={() => this.setState({ modal_chooser: false })}
          />

          <Marger size="1rem" />

          <Typography align="center" variant="h6">
            Load from database
          </Typography>

          <Marger size="1rem" />

          <div style={{ textAlign: 'center' }}>
            <Button variant="outlined" color="primary" onClick={() => this.setState({ modal_chooser: true })}>
              Search a molecule
            </Button>
          </div>

          <Marger size="2rem" />

          <Typography align="center" variant="h6">
            Load from history
          </Typography>

          <Typography align="center">
            <Link component={RouterLink} to="/builder">
              Want to martinize a molecule ?
            </Link>
          </Typography>
          <Marger size="1rem" />
          <HistoryBuild
            onSelect={async(uuid : string) => {
              const job : ReadedJobDoc = await ApiHelper.request(`history/get?jobId=${uuid}`)
              const martinizeFiles = await loadMartinizeFiles(job)
              
              this.setState({
                pdb: martinizeFiles.pdb.content, 
                top : martinizeFiles.top.content, 
                itps: martinizeFiles.itps.map(itp => itp.content),
                ff: job.settings.ff,
                builder_mode : job.settings.builder_mode
              }, this.nextFromFiles)
            }}
          
          />



          <Marger size="1rem" />

          <Typography align="center" variant="h6">
            Upload a molecule
          </Typography>
          
          <Marger size="1rem" />
          
          <SimpleSelect
            label="Used force field"
            variant="standard"
            id="ff_select"
            values={this.force_fields.map(e => ({ id: e, name: e }))}
            value={this.state.ff}
            onChange={val => this.setState({ ff: val })}
            noMinWidth
            formControlClass={this.props.classes.ff_select}
          />

          <Marger size="1rem" />

          <AddMoleculeFileInput 
            onChange={({ itp, top, pdb }) => {
              this.setState({
                pdb,
                top,
                itps: itp,
              });
            }}
          />

          </React.Fragment>}

          <Marger size="1rem" />

          <div style={{ textAlign: 'right' }}>
            <Button variant="outlined" color="primary" disabled={!this.can_continue} 
            onClick={this.nextFromFiles}>
              Next
            </Button>
          </div>
      </React.Fragment>
    );
  }
}

export default withStyles(theme => ({
  ff_select: {
    width: '100%'
  },
}))(MoleculeChooser);

interface ModalState {
  search: string;
  loading: boolean;
  molecules: Molecule[];
  load_more: boolean;
  content: string;
}

export class ModalMoleculeSelector extends React.Component<{ open: boolean; onChoose(molecule: Molecule): any; onCancel(): any; }, ModalState> {
  timeout: NodeJS.Timeout | undefined;

  state: ModalState = {
    search: "",
    loading: false,
    molecules: [],
    load_more: false,
    content: "",
  };

  onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    this.setState({ search: e.target.value });

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }

    const content = e.target.value.trim();
    if (content) {
      this.timeout = setTimeout(() => {
        this.timeout = undefined;
        this.startSearch(content);
      }, 350);
    }
    else {
      this.setState({
        content: '',
        molecules: [],
        load_more: false,
        loading: false,
      });
    }
  };

  onLoadMore = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    this.enlargeSearch();
  };

  async startSearch(content: string) {
    this.setState({ loading: true, load_more: false, content: "", molecules: [], });

    try { 
      const { molecules, length }: { molecules: Molecule[], length: number } = await ApiHelper.request('molecule/list', { 
        parameters: { q: content, combine: 'false', limit: 10 } 
      });

      if (this.state.loading)
        this.setState({ molecules, load_more: molecules.length < length, content });
    } catch (e) {
      toast("Error while loading molecules.", "error");
    } finally {
      this.setState({ loading: false });
    }
  }

  async enlargeSearch() {
    const content = this.state.content;

    this.setState({ loading: true, load_more: false, });

    try { 
      const { molecules, length }: { molecules: Molecule[], length: number } = await ApiHelper.request('molecule/list', { 
        parameters: { q: content, combine: 'false', limit: 10, skip: this.state.molecules.length, } 
      });

      const new_molecules = [...this.state.molecules, ...molecules];

      this.setState({ 
        molecules: new_molecules, 
        load_more: new_molecules.length < length, 
      });
    } catch (e) {
      toast("Error while loading molecules.", "error");
    } finally {
      this.setState({ loading: false });
    }
  }

  openUrl(molecule: Molecule) {
    window.open('/molecule/' + molecule.alias + '?version=' + molecule.id, '_blank');
  }

  render() {
    return (
      <Dialog open={this.props.open} onClose={this.props.onCancel} maxWidth="md" fullWidth>
        <DialogTitle>
          Find a molecule
        </DialogTitle>

        <DialogContent>
          <div>
            <TextField
              value={this.state.search}
              onChange={this.onInputChange}
              placeholder="Enter a query..."
              style={{ width: '100%' }}
              variant="outlined"
            />
          </div>

          <Marger size="1rem" />

          {this.state.molecules.length > 0 && <List>
            {this.state.molecules.map(m => (
              <ListItem key={m.id} button onClick={() => this.props.onChoose(m)}>
                <ListItemText
                  primary={`${m.name} (${m.alias}) - ${m.force_field} - Version ${m.version}`}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => this.openUrl(m)}>
                    <FaIcon external-link-alt />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>)
            )}
          </List>}

          {this.state.load_more && <div>
            <DialogContentText align="center" color="primary" style={{ cursor: 'pointer' }} onClick={this.onLoadMore}>
              Load more
            </DialogContentText>
          </div>}

          {this.state.loading && <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', }}>
            <CircularProgress size={48} />
          </div>}

          {this.state.molecules.length === 0 && this.state.content && !this.state.loading && <div>
            <DialogContentText align="center">
              No molecule matches your search.
            </DialogContentText>  
          </div>}
        </DialogContent>
        
        <DialogActions>
          <Button color="secondary" onClick={this.props.onCancel}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}
