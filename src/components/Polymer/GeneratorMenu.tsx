import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Grain from "@mui/material/Icon/Icon";
import { FormState } from './SimulationType'
import Typography from "@mui/material/Typography";
import CreateLink from "./Dialog/CreateLink";
import AutoFixHigh from "@mui/material/Icon/Icon";
import { FaIcon, Marger } from "../../helpers";
import { Badge, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, FormControl, Grid, Icon, Input, InputLabel, MenuItem, Paper, Select, } from '@material-ui/core';
import { SimpleSelect } from "../../Shared";
import Link from "@mui/material/Link";
import { Link as RouterLink } from 'react-router-dom';
import { ModalMoleculeSelector, MoleculeWithFiles } from "../Builder/MembraneBuilder/MoleculeChooser";

import { ModalHistorySelector } from "../MyHistory/MyHistory";
import Switch from '@mui/material/Switch';
import { ImportProtein } from "./Dialog/importProtein";

import ApiHelper from "../../ApiHelper";



interface propsmenu {
  customITPS: { [name: string]: string };
  warningfunction: (arg: any) => void;
  setForcefield: (ff: string) => void;
  addNEwMolFromITP: (itp: string) => void;
  addnodeFromJson: (jsondata: JSON) => void;
  addnode: (arg0: FormState) => void;
  addlink: (arg1: any, arg2: any) => void;
  addprotsequence: (arg0: string) => void;
  addmoleculecoord: (arg0: string) => void;
  send: () => void;
  addCustomitp: (arg0: string, arg1: string) => void;
  dataForceFieldMolecule: { [forcefield: string]: string[] };
  errorlink: any[];
  fixlinkcomponentappear: () => void;
  clear: () => void;

}

interface GeneratorMenuState extends FormState {
  id1: string | undefined;
  id2: string | undefined;
  createLink: boolean;
  database_modal_chooser: boolean;
  history_modal_chooser: boolean;
  builder_mode: string;
  want_go_back: boolean
  Menuplus: boolean;
  proteinImport: boolean;
  add_to_every_residue: string | undefined;
}

export default class GeneratorMenu extends React.Component<propsmenu, GeneratorMenuState> {

  // Set the state directly. Use props if necessary.
  state = {
    forcefield: "martini3",
    moleculeToAdd: "",
    numberToAdd: 1,
    id1: undefined,
    id2: undefined,
    createLink: false,
    database_modal_chooser: false,
    history_modal_chooser: false,
    builder_mode: "classic",
    want_go_back: false,
    Menuplus: false,
    proteinImport: false,
    add_to_every_residue: "",
  }


  protected go_back_btn = React.createRef<any>();

  closeCreate(): void {
    console.log(this.state)
    // this.setState( {createLink : false})
  }

  CheckNewMolecule(): void {
    if (this.state.forcefield === '') {
      this.props.warningfunction("Please select a forcefield")
    }
    else if (this.state.moleculeToAdd === '') {
      this.props.warningfunction("Please select a molecule.")
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
      this.props.warningfunction("Please select id for your new link.")
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
    this.setState({ want_go_back: false });
    if (selectorFiles.length === 1) {
      let file = selectorFiles[0]
      const ext = file.name.split('.').slice(-1)[0]
      if (ext === 'json') {
        let reader = new FileReader();
        reader.onload = (event: any) => {
          //check if json file is well json formatted?

          if (/^[\],:{}\s]*$/.test(event.target.result.replace(/\\["\\\/bfnrtu]/g, '@').
            replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
            replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

            let obj = JSON.parse(event.target.result);
            this.props.addnodeFromJson(obj);

          } else {
            this.props.warningfunction("Not good json format.")
          }


        }
        reader.readAsText(file);
      }
      else if (ext === 'fasta') {
        let reader = new FileReader();
        reader.onload = (event: any) => {
          const fastaContent = event.target.result;
          let seq = ''
          for (let line of fastaContent.split('\n')) {
            if (!line.startsWith('>')) {
              seq = seq + line
            }
          }
          if (/^[a-zA-Z]+$/.test(seq)) {
            this.props.addprotsequence(seq)
          }
          else {
            this.props.warningfunction("Not good fasta format.")
          }
        }
        reader.readAsText(file);
      }
      else if (ext === 'itp') {
        let file = selectorFiles[0]
        let reader = new FileReader();
        reader.onload = (event: any) => {
          this.props.addNEwMolFromITP(event.target.result)
        }
        reader.readAsText(file);
      }


      // else if (ext === 'pdb') {
      //   let reader = new FileReader();
      //   reader.onload = (event: any) => {
      //     const pdbContent = event.target.result;
      //     this.props.addNEwMolFromPDB(pdbContent)
      //   }
      //   reader.readAsText(file);
      // }
      else if (ext === 'ff') {
        let reader = new FileReader();
        reader.onload = (event: any) => {
          this.props.warningfunction(event.target.result)
        }
        reader.readAsText(file);
      }
      else {
        this.props.warningfunction("File extension unkown")
      }
    }
    else {
      this.props.warningfunction("Only one files should be upload")
      console.log(selectorFiles)
    }
  }

  nextFromMolecule = async (molecule: any) => {
    this.setState({ want_go_back: false });
    this.setState({ database_modal_chooser: false });

    console.log(molecule)
    if ((molecule.force_field !== "martini3001") && (this.state.forcefield === "martini3")) {
      this.props.warningfunction("Wrong forcefield : " + molecule.force_field)
      return
    }
    else if ((molecule.force_field !== "martini22") && (this.state.forcefield === "martini2")) {
      this.props.warningfunction("Wrong forcefield : " + molecule.force_field)
      return
    }
    else {
      const req = "molecule/get/" + molecule.force_field + "/" + molecule.alias + ".itp"
      console.log(req)
      ApiHelper.request(req, { mode: "text" })
        .then((itp: string) => {
          this.props.addNEwMolFromITP(itp)
        })
        .catch(e => {
          console.error(e)
          this.props.warningfunction(molecule.alias + " Not found")
        })
    }

  };

  moleculefromhistory = (ff: string, molecule: any) => {
    if ((ff !== "martini3001") && (this.state.forcefield === "martini3")) {
      this.props.warningfunction("Wrong forcefield : " + ff)
      return
    }
    else if ((ff !== "martini22") && (this.state.forcefield === "martini2")) {
      this.props.warningfunction("Wrong forcefield : " + ff)
      return
    }
    console.log(molecule)
    this.setState({ want_go_back: false });
    this.props.addmoleculecoord(molecule.gro.content)
    this.props.addNEwMolFromITP(molecule.itp)
    this.setState({ history_modal_chooser: false })
  };

  onWantGoBack = (e: React.MouseEvent) => {
    // Don't go to #!
    e.preventDefault();
    this.props.clear()
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
            You will definitively loose your beautiful polymer.
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
    //console.log("menuPlus", this.state.Menuplus)
    return (
      <div  >
        {this.renderModalBackToDatabase()}

        <CreateLink
          customITPS={this.props.customITPS}
          close={() => { this.setState({ createLink: false }) }}
          addthisRule={(name: string, content: string) => this.props.addCustomitp(name, content)}
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
          onChoose={this.moleculefromhistory}
          onCancel={() => this.setState({ history_modal_chooser: false })}
        />

        <ImportProtein
          open={this.state.proteinImport}
          close={() => this.setState({ proteinImport: false })}
          addprotcoord={this.props.addmoleculecoord}
          addNEwMolFromITP={this.props.addNEwMolFromITP}
          addCustomitp={this.props.addCustomitp}

        />


        <Marger size="2rem" />
        <Typography component="h1" variant="h3" align="center" style={{ fontWeight: 700, fontSize: '2.5rem', marginBottom: '1rem' }}>
          Polymer Generator
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

        <Grid container component="main" style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'left', }}>

          {(this.props.dataForceFieldMolecule[this.state.forcefield] !== undefined) ?
            (<>
              <Grid item xs={1}></Grid>
              <Grid item xs={5}>
                <Typography variant="h6" > Current forcefield: </Typography>
              </Grid>
              <Grid item xs={5}>
                <FormControl >
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

              </Grid>
              <Grid item xs={1}></Grid>



              <Marger size="1rem" />



              <Marger size="1rem" />

              <Grid item xs={1}></Grid>
              <Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center' }}>

                <Typography variant="h6" >
                  Upload your file:
                </Typography>
              </Grid>

              <Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center' }}>
                <Input
                  inputProps={{ accept: ".itp,.json,.fasta" }}
                  color="primary"
                  onChange={(e: any) => this.handleUpload(e.target.files)}
                  type="file"
                />
              </Grid>
              <Grid item xs={1}></Grid>
              <Grid item xs={1}></Grid>
              <Grid item xs={10} style={{ textAlign: 'left', alignItems: 'center' }}>

                <Typography component={'div'}>
                  <ul>
                    <li>Polymer (.json)</li>
                    <li>Protein sequence (.fasta)</li>
                    <li>Topology file (.itp)</li>
                  </ul>
                </Typography>
              </Grid>
              <Grid item xs={1}></Grid>

              <Marger size="1rem" />

              <Grid item xs={1}></Grid>
              <Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center' }}>

                <Typography variant="h6" >
                  Modify a molecule:
                </Typography>
              </Grid>

              <Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center' }}>
                <Button variant="outlined" color="primary"
                  onClick={() => this.setState({ proteinImport: true })}
                >
                  Load
                </Button>
              </Grid>
              <Grid item xs={1}></Grid>


              <Marger size="1rem" />

              <Grid item xs={1}></Grid>
              <Grid item xs={6}>
                <Typography variant="h6" > Show advanced menu: </Typography>
              </Grid>
              <Grid item xs={4}>
                <Switch
                  checked={this.state.Menuplus}
                  onChange={(t, checked) => this.setState({ Menuplus: checked })}
                  inputProps={{ 'aria-label': 'controlled' }}
                />
              </Grid>
              <Grid item xs={1}></Grid>

              {(this.state.Menuplus) &&
                <>
                  <Marger size="1rem" />

                  <Grid item xs={2}></Grid>
                  <Grid item xs={9} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >
                    <Typography variant="button" >Add from database or history: </Typography>
                  </Grid>
                  <Grid item xs={1}></Grid>

                  <Grid item xs={2}></Grid>
                  <Grid item xs={4} style={{ textAlign: 'left', alignItems: 'center' }}>
                    <Button variant="outlined" color="primary" onClick={() => this.setState({ database_modal_chooser: true })}>
                      From database
                      <Badge color="secondary" >
                        <Icon className={"fas fa-" + "upload"} />
                      </Badge>
                    </Button>
                  </Grid>

                  <Grid item xs={1}>

                  </Grid>

                  <Grid item xs={4} style={{ textAlign: 'left', alignItems: 'center' }}>
                    <Button variant="outlined" color="primary"
                      onClick={() => this.setState({ history_modal_chooser: true })}>
                      From history
                      <Badge color="secondary" >
                        <Icon className={"fas fa-" + "upload"} />
                      </Badge>
                    </Button>
                  </Grid>

                  <Grid item xs={1}></Grid>

                  <Marger size="1rem" />

                  <Grid item xs={2}></Grid>
                  <Grid item xs={5}>
                    <Typography variant="button" >
                      Design your own itp link file:
                    </Typography>

                  </Grid>

                  <Grid item xs={1}></Grid>

                  <Grid item xs={3}>

                    <Button id="Create" variant="contained" endIcon={<AutoFixHigh />} onClick={() => this.setState({ createLink: true })}>
                      Create
                    </Button>
                  </Grid>

                  <Grid item xs={1}></Grid>
                </>}
              <Marger size="1rem" />


              <Grid item xs={1}></Grid>

              <Grid item xs={10} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }}>
                <Typography variant="h6" align="left">
                  Add a molecule or chain of molecules:
                </Typography>
              </Grid>
              <Grid item xs={1}></Grid>

              <Grid item xs={1}></Grid>

              <Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >

                <SimpleSelect

                  //formControlClass={this.props.classes.ff_select}
                  required
                  label="Molecule"
                  variant="standard"
                  // values={this.GetMolFField(this.props.dataForceFieldMolecule, forcefield).map(e => ({ id: e, name: e }))}
                  // @ts-ignore
                  values={this.props.dataForceFieldMolecule[this.state.forcefield].map(e => ({ id: e, name: e }))}
                  id="ff"
                  value={this.state.moleculeToAdd}
                  onChange={v => this.setState({ moleculeToAdd: v })} />
              </Grid>



              <Grid item xs={2} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >

                <FormControl >
                  <TextField
                    label="Number"
                    type="number"
                    InputProps={{ inputProps: { min: 1, max: 100 } }}
                    value={this.state.numberToAdd}
                    onChange={v => this.setState({ numberToAdd: Number(v.target.value) })}
                    variant="standard" />
                </FormControl>

              </Grid>

              <Grid item xs={3} style={{ textAlign: 'right', alignItems: 'center', justifyContent: 'center', }} >
                <Button
                  endIcon={<Grain />}
                  id="addmol"
                  variant="outlined"
                  onClick={() => { this.setState({ want_go_back: false }); this.CheckNewMolecule() }}>
                  <Grid container component="main" style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'left', }}>

                    <Grid item xs={10}>
                      <Typography variant="body2" align="left">
                        Add
                      </Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Badge color="secondary" >
                        <Icon className={"fas fa-" + "plus"} />
                      </Badge>
                    </Grid>

                  </Grid>

                </Button>
              </Grid>
              <Grid item xs={1}></Grid>

              <Grid item xs={2}></Grid>
              <Grid item xs={3}>
                <Typography variant={'button'} > Link to all:</Typography>
              </Grid>
              <Grid item xs={4}>

                <FormControl fullWidth>
                  <InputLabel id="demo-simple-select-helper-label">resName</InputLabel>
                  <Select
                    labelId="demo-simple-select-helper-label"
                    id="demo-simple-select-helper"
                    value={this.state.add_to_every_residue}
                    onChange={(event: any) => this.setState({ add_to_every_residue: event.target.value })}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>

                    {this.props.dataForceFieldMolecule[this.state.forcefield]
                      .map(e => <MenuItem key={e} value={e}> {e}</MenuItem>)}

                  </Select>

                </FormControl>


              </Grid>
              <Grid item xs={3}></Grid>


              <Marger size="1rem" />

              <Grid item xs={1}></Grid>
              <Grid item xs={10} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >
                <Typography variant="h6" >Create a new link: </Typography>
              </Grid>
              <Grid item xs={1}></Grid>

              <Grid item xs={1}></Grid>
              <Grid item xs={2} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >
                <TextField
                  label="resid 1"
                  type="number"
                  InputProps={{ inputProps: { min: 0, max: 100 } }}
                  value={this.state.id1}
                  onChange={v => this.setState({ id1: v.target.value })}
                  variant="standard" />
              </Grid>
              <Grid item xs={1}></Grid>
              <Grid item xs={2} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >
                <TextField
                  label="resid 2"
                  type="number"
                  InputProps={{ inputProps: { min: 0, max: 100 } }}
                  value={this.state.id2}
                  onChange={v => this.setState({ id2: v.target.value })}
                  variant="standard" />
              </Grid>
              <Grid item xs={1}></Grid>
              <Grid item xs={3} style={{ textAlign: 'right', alignItems: 'center', justifyContent: 'center', }} >
                <Button
                  id="addlink"
                  variant="contained"
                  onClick={() => { this.setState({ want_go_back: false }); this.CheckNewLink(this.state.id1, this.state.id2) }}>
                  <Grid container component="main" style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'left', }}>

                    <Grid item xs={10}>
                      <Typography variant="body2" align="left">
                        Create
                      </Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Badge color="secondary" >
                        <Icon className={"fas fa-" + "link"} />
                      </Badge>
                    </Grid>

                  </Grid>
                </Button>
              </Grid>
              <Grid item xs={2}></Grid>

              <Marger size="2rem" />

              {
                ((forcefield !== '') && (this.props.errorlink.length !== 0)) ?
                  (
                    <><Grid item xs={4}></Grid>
                      <Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }}>
                        <Button id="send" variant="contained" color="error" endIcon={<AutoFixHigh />} onClick={() => this.props.fixlinkcomponentappear()}>
                          <Typography variant="body2" align="left">
                            Fix link
                          </Typography>

                          <Badge color="secondary" >
                            <Icon className={"fas fa-" + "pen"} />
                          </Badge>
                        </Button>
                      </Grid>
                      <Grid item xs={3}></Grid></>) :
                  (
                    <><Grid item xs={4}></Grid>
                      <Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }}>
                        <Button id="send" variant="contained" color="success" endIcon={<AutoFixHigh />} onClick={() => this.props.send()}>
                          <Grid container component="main" style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'left', }}>
                            <Grid item xs={10}>
                              <Typography variant="body2" align="left">
                                Send to polyply!
                              </Typography>
                            </Grid>
                            <Grid item xs={2}>
                              <Badge color="secondary" >
                                <Icon className={"fas fa-" + "magic"} />
                              </Badge>
                            </Grid>

                          </Grid>
                        </Button>


                      </Grid>
                      <Grid item xs={1}></Grid>

                    </>)}

            </>)
            : (<>
              <Grid item xs={7}>
                <Typography variant="h6" > Loading data from server... </Typography>
              </Grid>

              <Grid item xs={5}   >
                <CircularProgress></CircularProgress>
              </Grid>



            </>)
          }


        </Grid >

        <Marger size="1rem" />

      </div >
    )
  };
}
