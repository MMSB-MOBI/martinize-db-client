import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Grain from "@mui/material/Icon/Icon";
import { FormState } from './SimulationType'
import Typography from "@mui/material/Typography";
import CreateLink from "./Dialog/CreateLink";
import AutoFixHigh from "@mui/material/Icon/Icon";
import { FaIcon, Marger } from "../../helpers";
import { Badge, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, FormControl, Grid, Icon, Input, Paper, } from '@material-ui/core';
import { SimpleSelect } from "../../Shared";
import Link from "@mui/material/Link";
import { Link as RouterLink } from 'react-router-dom';
import { ModalMoleculeSelector, MoleculeWithFiles } from "../Builder/MembraneBuilder/MoleculeChooser";
import { Molecule } from "../../types/entities";
import { ModalHistorySelector } from "../MyHistory/MyHistory";



interface propsmenu {
  customITPS: { [name: string]: string };
  warningfunction: (arg: any) => void;
  setForcefield: (ff: string) => void,
  addNEwMolFromITP: (itp: string) => void,
  addnodeFromJson: (jsondata: JSON) => void,
  addnode: (arg0: FormState) => void,
  addlink: (arg1: any, arg2: any) => void,
  addprotsequence: (arg0: string) => void,
  send: () => void,
  addNEwCustomLink: (arg0: string, arg1: string) => void,
  dataForceFieldMolecule: {} | JSON,
  errorlink: any[],
  fixlinkcomponentappear: () => void;

}

interface GeneratorMenuState extends FormState {
  id1: string | undefined;
  id2: string | undefined;
  createLink: boolean;
  database_modal_chooser: boolean;
  history_modal_chooser: boolean;
  builder_mode: string;
  want_go_back: boolean
}

export default class GeneratorMenu extends React.Component<propsmenu, GeneratorMenuState> {

  // Set the state directly. Use props if necessary.
  state = {
    forcefield: "",
    moleculeToAdd: "",
    numberToAdd: 1,
    id1: undefined,
    id2: undefined,
    createLink: false,
    database_modal_chooser: false,
    history_modal_chooser: false,
    builder_mode: "classic",
    want_go_back: false,
  }

  protected go_back_btn = React.createRef<any>();

  closeCreate(): void {
    console.log(this.state)
    // this.setState( {createLink : false})
  }

  GetMolFField(jsonformdata: any, ff: string): string[] {
    return jsonformdata[ff];
  }


  CheckNewMolecule(): void {
    if (this.state.forcefield === '') {
      this.props.warningfunction("Field Forcefield null")
    }
    else if (this.state.moleculeToAdd === '') {
      this.props.warningfunction("Field Molecule null")
      //this.props.addnode
    }
    else {
      this.props.addnode(this.state)
    }
  }

  CheckNewLink(idLink1: string | undefined, idLink2: string | undefined): void {
    // check undefined value : 

    //checkLink( )
    if ((typeof (idLink1) == 'undefined') || (typeof (idLink2) == 'undefined')) {
      this.props.warningfunction("Problem link : id number undefined")
    }
    else {
      this.props.addlink(idLink1, idLink2)
    }
  }

  onGoBack = () => {
    console.log(this.go_back_btn)
    // Click on the hidden link
    this.go_back_btn.current.click();
  };

  handleUpload = (selectorFiles: FileList) => {
    this.setState({ want_go_back: false   });
    if (selectorFiles.length === 1) {
      let file = selectorFiles[0]
      const ext = file.name.split('.').slice(-1)[0]
      if (ext === 'json') {
        let reader = new FileReader();
        reader.onload = (event: any) => {
          let obj = JSON.parse(event.target.result);
          this.props.addnodeFromJson(obj);
        }
        reader.readAsText(file);
      }
      else if (ext === 'fasta') {
        let reader = new FileReader();
        reader.onload = (event: any) => {
          const fastaContent = event.target.result;
          let seq = ''
          for (let line of fastaContent.split('\n')) {
            if (!line.startsWith('>')) seq = seq + line
          }
          this.props.addprotsequence(seq)
        }
        reader.readAsText(file);
      }
      else if (ext === 'itp') {
        let file = selectorFiles[0]
        const ext = file.name.split('.').slice(-1)[0]
        if (ext === 'itp') {
          let reader = new FileReader();
          reader.onload = (event: any) => {
            this.props.addNEwMolFromITP(event.target.result)
          }
          reader.readAsText(file);
        }

      }
      else if (ext === 'ff') {
        let reader = new FileReader();
        reader.onload = (event: any) => {
          this.props.warningfunction(event.target.result)
        }
        reader.readAsText(file);
      }
      else {
        this.props.warningfunction("File unkown")
      }
    }
    else {
      this.props.warningfunction("Only one files should be upload")
      console.log(selectorFiles)
    }

  }


  nextFromMolecule = (molecule: Molecule | MoleculeWithFiles) => {
    this.setState({ want_go_back: false   });
    this.setState({ database_modal_chooser: false });
    //@ts-ignore
    console.log(molecule)
  };

  itpfromhistory = (molecule: any) => {
    this.setState({ want_go_back: false   });
    this.props.addNEwMolFromITP(molecule)
  };

  onWantGoBack = (e: React.MouseEvent) => {
    // Don't go to #!
    e.preventDefault();

    this.setState({
      want_go_back: true
    });
  };

  onWantGoBackCancel = () => {
    this.setState({ want_go_back: false });
  };

  renderModalBackToDatabase() {
    return (
      <Dialog open={!!this.state.want_go_back} onClose={this.onWantGoBackCancel}>
        <DialogTitle>
          Get back to explore
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            You will definitively lose your beautiful polymer.
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button color="primary" onClick={this.onWantGoBackCancel}>Cancel</Button>
          <Button color="secondary" onClick={this.onGoBack}>Go back</Button>
        </DialogActions>
      </Dialog>
    )
  }


  render() {
    let forcefield = this.state.forcefield;

    return (
      <div  >
        {this.renderModalBackToDatabase()}

        <CreateLink
          customITPS={this.props.customITPS}
          close={() => { this.setState({ createLink: false }) }}
          addthisRule={(name: string, content: string) => this.props.addNEwCustomLink(name, content)}
          showCreate={this.state.createLink}
        >
        </CreateLink>

        <ModalMoleculeSelector
          open={this.state.database_modal_chooser}
          onChoose={this.nextFromMolecule}
          onCancel={() => this.setState({ database_modal_chooser: false })}
        />

        <ModalHistorySelector
          open={this.state.history_modal_chooser}
          onChoose={this.itpfromhistory}
          onCancel={() => this.setState({ history_modal_chooser: false })}
        />

        <Marger size="2rem" />
        <Typography component="h1" variant="h3" align="center" style={{ fontWeight: 700, fontSize: '2.5rem', marginBottom: '1rem' }}>
          Design your own polymer:
        </Typography>

        <Marger size="1rem" />
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <Link
            href="#!"
            // When state is initial state (main loader), don't show the confirm modal
            onClick={this.state.want_go_back !== true ? this.onWantGoBack : this.onGoBack}
          >
            <FaIcon home style={{ fontSize: '1rem' }} />
            <span style={{ marginLeft: '.7rem', fontSize: '1.1rem' }}>
              MAD Home
            </span>
          </Link>

          <RouterLink ref={this.go_back_btn} to="/" style={{ display: 'none' }} />
        </div>


        <Divider variant='middle' />

        <Marger size="2rem" />

        <Grid container component="main" style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }}>

          <Grid item xs={6}>
            <Typography variant="h6" >
              First choose your forcefield:
            </Typography>

          </Grid>

          <Grid item xs={1}>

          </Grid>

          <Grid item xs={3}>
            {Object.keys(this.props.dataForceFieldMolecule).length === 0 ? (
              <CircularProgress />
            ) :
              (
                <FormControl fullWidth={true} >
                  <SimpleSelect
                    //formControlClass={this.props.classes.ff_select}
                    required
                    label="forcefield : "
                    variant="standard"
                    values={Object.keys(this.props.dataForceFieldMolecule).map(e => ({ id: e, name: e }))}
                    id="ff"
                    value={this.state.forcefield}
                    onChange={v => {
                      this.props.setForcefield(v);
                      this.setState({ forcefield: v });
                    }} />
                </FormControl>
              )}
          </Grid>

          <Marger size="2rem" />
          <Grid item xs={6}>
            <Typography variant="h6" >
              Design your own itp link file:
            </Typography>

          </Grid>

          <Grid item xs={1}>

          </Grid>


          <Grid item xs={3}>

            <Button id="Create" variant="contained" endIcon={<AutoFixHigh />} onClick={() => this.setState({ createLink: true })}>
              Create
            </Button>
          </Grid>


          <Marger size="2rem" />

          {/* 
          {(forcefield !== '') &&
            <><Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center' }}>

              <Typography variant="h6" >
                Upload a polymer:
              </Typography>
            </Grid>
           
            <Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center' }}>
              <Input

                color="primary"
                onChange={(e: any) => this.handleUpload(e.target.files)}
                type="file"
              />
            </Grid>
            </>
          } */}
          {(forcefield !== '') &&
            <>
              <Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center' }}>

                <Typography variant="h6" >
                  Add my own molecule:
                </Typography>
              </Grid>

              <Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center' }}>
                <Input

                  color="primary"
                  onChange={(e: any) => this.handleUpload(e.target.files)}
                  type="file"
                />
              </Grid>

              <Grid item xs={11} style={{ textAlign: 'left', alignItems: 'center' }}>

                <Typography component={'div'}>
                  <ul>
                    <li>Your previous polymer (.json)</li>
                    <li>Fasta protein sequence (.fasta)</li>
                    <li>Topology of a polymer/molecule (.itp)</li>
                  </ul>
                </Typography>
              </Grid>
              <Marger size="1rem" />

              <Grid item xs={10} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >
                <Typography variant="h6" >Add from database or history: </Typography>
              </Grid>

              <Grid item xs={4} style={{ textAlign: 'left', alignItems: 'center' }}>
                <Button variant="outlined" color="primary" onClick={() => this.setState({ database_modal_chooser: true })}>
                  (BETA) Load from database
                  <Badge color="secondary" >
                    <Icon className={"fas fa-" + "upload"} />
                  </Badge>
                </Button>
              </Grid>


              <Grid item xs={1}>

              </Grid>

              <Grid item xs={4} style={{ textAlign: 'left', alignItems: 'center' }}>
                <Button variant="outlined" color="primary" onClick={() => this.setState({ history_modal_chooser: true })}>
                  Load from history
                  <Badge color="secondary" >
                    <Icon className={"fas fa-" + "upload"} />
                  </Badge>
                </Button>
              </Grid>


              <Marger size="1rem" />


              <Grid item xs={10} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }}>
                <Typography variant="h6" align="left">
                  Add your molecule (in chain):
                </Typography>
              </Grid>

              <Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >

                <SimpleSelect
                  //formControlClass={this.props.classes.ff_select}
                  required
                  label="Molecule"
                  variant="standard"
                  values={this.GetMolFField(this.props.dataForceFieldMolecule, forcefield).map(e => ({ id: e, name: e }))}
                  id="ff"
                  value={this.state.moleculeToAdd}
                  onChange={v => this.setState({ moleculeToAdd: v })} />
              </Grid>

              <Grid item xs={2} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >

                <TextField
                  label="numberToAdd"
                  type="number"
                  InputProps={{ inputProps: { min: 1, max: 100 } }}
                  value={this.state.numberToAdd}
                  onChange={v => this.setState({ numberToAdd: Number(v.target.value) })}
                  variant="standard" />
              </Grid>

              <Grid item xs={3} style={{ textAlign: 'right', alignItems: 'center', justifyContent: 'center', }} >
                <Button
                  endIcon={<Grain />}
                  id="addmol"
                  variant="outlined"
                  onClick={() => {this.setState({ want_go_back: false   });this.CheckNewMolecule()}}>
                  add

                  <Badge color="secondary" >
                    <Icon className={"fas fa-" + "plus"} />
                  </Badge>
                </Button>
              </Grid>



              <Marger size="1rem" />


              <Grid item xs={10} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >
                <Typography variant="h6" >Add a new link: </Typography>
              </Grid>


              <Grid item xs={3} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >
                <TextField
                  label="id1"
                  type="number"
                  InputProps={{ inputProps: { min: 0, max: 100 } }}
                  value={this.state.id1}
                  onChange={v => this.setState({ id1: v.target.value })}
                  variant="standard" />
              </Grid>

              <Grid item xs={1} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} > </Grid>


              <Grid item xs={3} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >
                <TextField
                  label="id2"
                  type="number"
                  InputProps={{ inputProps: { min: 0, max: 100 } }}
                  value={this.state.id2}
                  onChange={v => this.setState({ id2: v.target.value })}
                  variant="standard" />
              </Grid>

              <Grid item xs={3} style={{ textAlign: 'right', alignItems: 'center', justifyContent: 'center', }} >
                <Button
                  id="addlink"
                  variant="contained"
                  onClick={() => {this.setState({ want_go_back: false   }); this.CheckNewLink(this.state.id1, this.state.id2)}}>
                  Add link
                  <Badge color="secondary" >
                    <Icon className={"fas fa-" + "link"} />
                  </Badge>
                </Button>

              </Grid>

              <Marger size="2rem" />

              <Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }}>
                <Button id="send" variant="contained" color="success" endIcon={<AutoFixHigh />} onClick={() => this.props.send()}>
                  Polyply That!
                  <Badge color="secondary" >
                    <Icon className={"fas fa-" + "magic"} />
                  </Badge>
                </Button>
              </Grid>
            </>}

          {
            ((forcefield !== '') && (this.props.errorlink.length !== 0)) &&
            <Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }}>
              <Button id="send" variant="contained" color="error" endIcon={<AutoFixHigh />} onClick={() => this.props.fixlinkcomponentappear()}>
                Fix link
                <Badge color="secondary" >
                  <Icon className={"fas fa-" + "pen"} />
                </Badge>
              </Button>
            </Grid>
          }
          <Marger size="1rem" />

        </Grid >
      </div >
    )
  };
}
