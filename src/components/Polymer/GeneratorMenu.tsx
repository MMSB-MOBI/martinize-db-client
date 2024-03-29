import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Grain from "@mui/material/Icon/Icon";
import { FormState } from './SimulationType'
import Typography from "@mui/material/Typography";
import CreateLink from "./Dialog/CreateLink";
import AutoFixHigh from "@mui/material/Icon/Icon";
import { FaIcon, Marger } from "../../helpers";
import { Badge, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, FormControl, FormControlLabel, FormLabel, Grid, Icon, Input, InputLabel, MenuItem, Paper, Radio, RadioGroup, Select, } from '@material-ui/core';
import { SimpleSelect } from "../../Shared";
import Link from "@mui/material/Link";
import { Link as RouterLink } from 'react-router-dom';
import { ModalMoleculeSelector } from "../Builder/MembraneBuilder/MoleculeChooser";
import { ModalHistorySelector } from "../MyHistory/MyHistory";
import Switch from '@mui/material/Switch';
import { ImportProtein } from "./Dialog/importProtein";
import ApiHelper from "../../ApiHelper";
import md5 from 'md5';


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
  version: string;
  previous: () => void;
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
  addMolecule: string;
  moleculeAdded: boolean;

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
    Menuplus: false,
    proteinImport: false,
    add_to_every_residue: "",
    addMolecule: "",
    moleculeAdded: false,
  }


  protected go_back_btn = React.createRef<any>();

  closeCreate(): void {
    //console.log(this.state)
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
    //console.log(this.go_back_btn)
    // Click on the hidden link
    this.props.clear()
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
          let sequences = [];
          let seq = ''
          for (let line of fastaContent.split('\n')) {
            if (line.startsWith('>')) {
              if (seq) sequences.push(seq);
              seq = '';
            } else {
              seq = seq + line;
            }
          }
          if (seq) sequences.push(seq); // add the last sequence

          let isValidFasta = true;
          for (let i = 0; i < sequences.length; i++) {
            if (!/^[a-zA-Z]+$/.test(sequences[i])) {
              isValidFasta = false;
              break;
            }
          }


          if (isValidFasta) {
            for (let s of sequences) this.props.addprotsequence(s);
          } else {
            this.props.warningfunction("Not a valid fasta format.");
          }
        }
        reader.readAsText(file);
      }
      else if (ext === 'itp') {
        let file = selectorFiles[0]
        let reader = new FileReader();
        reader.onload = (event: any) => {
          if (event.target.result.includes("moleculetype")) {
            console.log("Valid .itp file");
            this.props.addNEwMolFromITP(event.target.result)
            this.setState({ moleculeAdded: true })
          } else {
            console.log("Invalid file. Not a well-formed .itp file");
            this.props.warningfunction("Invalid file. Field : [ moleculetype ] is not found in the file loaded. Not a well-formed .itp file")
          }
        };

        reader.readAsText(file);
      }
      else if (ext === 'ff') {
        let reader = new FileReader();

        reader.onload = (event: any) => {
          this.props.addCustomitp(md5(event.target.result), "; Custom connexion rule \n" + event.target.result)
        }
        reader.readAsText(file);
      }
      else {
        this.props.warningfunction("File extension unknown")
      }
    }
    else {
      this.props.warningfunction("Only one files should be upload")
      //console.log(selectorFiles)
    }
  }

  nextFromMolecule = async (molecule: any) => {
    this.setState({ want_go_back: false });
    this.setState({ database_modal_chooser: false });

    //console.log(molecule)
    if ((molecule.force_field !== "martini3001") && (this.state.forcefield === "martini3")) {
      this.props.warningfunction("Wrong forcefield : " + molecule.force_field)
      return
    }
    else if ((molecule.force_field !== "martini22") && (this.state.forcefield === "martini2")) {
      this.props.warningfunction("Wrong forcefield : " + molecule.force_field)
      return
    }
    else {
      const req_itp = "molecule/get/" + molecule.force_field + "/" + molecule.alias + ".itp"
      const req_gro = "molecule/get/" + molecule.force_field + "/" + molecule.alias + ".gro"

      ApiHelper.request(req_itp, { mode: "text" })
        .then((rep: string) => {
          this.props.addNEwMolFromITP(rep)
          this.setState({ moleculeAdded: true })
        })
        .catch(e => {
          console.error(e)
          this.props.warningfunction(molecule.alias + ": Topology file not found")
        })

      ApiHelper.request(req_gro, { mode: "text" })
        .then((rep: string) => {
          this.props.addmoleculecoord(rep)
          this.setState({ moleculeAdded: true })
        })
        .catch(e => {
          console.error(e)
          this.props.warningfunction(molecule.alias + ": Coordinate file not found")
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
    //console.log(molecule)
    this.setState({ want_go_back: false });
    this.props.addmoleculecoord(molecule.gro.content)
    this.props.addNEwMolFromITP(molecule.itp)
    this.setState({ history_modal_chooser: false, moleculeAdded: true })
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
          Go back to the Explore page.
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            Your beautiful polymer will be lost.
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
          addprotcoord={(a) => { this.setState({ moleculeAdded: true }); this.props.addmoleculecoord(a) }}
          addNEwMolFromITP={this.props.addNEwMolFromITP}
          addCustomitp={this.props.addCustomitp}

        />


        <Marger size="2rem" />
        <Typography component="h1" variant="h3" align="center" style={{ fontWeight: 700, fontSize: '2.5rem', marginBottom: '1rem' }}>
          Polymer Editor
        </Typography>
        <Typography variant="subtitle1" align="center" style={{ fontSize: '0.7rem', fontStyle: 'italic', marginBottom: '1rem' }}>
          polyply version : {this.props.version}
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

          {/* Check if the data are avaible */}
          {(Object.keys(this.props.dataForceFieldMolecule).length > 1) ?
            (<>

              {((this.state.forcefield === "")) ?
                <>

                  <Grid item xs={1}></Grid>
                  <Grid item xs={5}>
                    <Typography variant="h6" > Please choose a forcefield: </Typography>
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



                </>
                :
                <>
                  <Grid item xs={1}></Grid>
                  <Grid item xs={5} style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center', }} >
                    <Typography variant="h6" > Current forcefield: </Typography>
                  </Grid>
                  <Grid item xs={5} style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center', }} >
                    <Typography variant="subtitle1" > {this.state.forcefield} </Typography>
                  </Grid>

                  <Grid item xs={1}>

                  </Grid>

                  {((this.state.moleculeAdded == false) && (this.state.addMolecule === "")) &&
                    <>

                      <Marger size="2rem" />

                      <Grid item xs={2}></Grid>
                      <Grid item xs={8}>
                        <Typography variant="h6" >Do you want to import and modify a molecule? </Typography>
                      </Grid>
                      <Grid item xs={2}></Grid>
                      <Grid item xs={4}></Grid>
                      <Grid item xs={6} style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center', }} >
                        <RadioGroup row name="scfix" value={this.state.addMolecule} onChange={e => this.setState({ addMolecule: e.target.value })}>
                          <FormControlLabel value="false" control={<Radio />} label="no" />
                          <FormControlLabel value="true" control={<Radio />} label="yes" />
                        </RadioGroup>
                      </Grid>
                      <Grid item xs={2}></Grid>
                      <Marger size="1rem" />

                    </>}

                  {(this.state.moleculeAdded == false) &&
                    <>
                      <Marger size="2rem" />

                      {(this.state.addMolecule === "true") &&
                        <>

                          <Grid item xs={2}></Grid>
                          <Grid item xs={8}>
                            <Typography variant="subtitle2">Load a molecule (protein ?) with their coordinates in order to modify it with polymers: </Typography>
                          </Grid>
                          <Grid item xs={1}></Grid>
                          <Marger size="2rem" />

                          <Grid item xs={2}></Grid>
                          <Grid item xs={6} style={{ textAlign: 'left', alignItems: 'center' }}>

                            <Typography variant="button" >
                              Upload your own molecule:
                            </Typography>
                          </Grid>


                          <Grid item xs={3} style={{ textAlign: 'left', alignItems: 'center' }}>
                            <Button variant="outlined" color="primary"
                              onClick={() => this.setState({ proteinImport: true })}
                            >
                              Load
                            </Button>
                          </Grid>
                          <Grid item xs={1}></Grid>


                          <Marger size="1rem" />
                          <Grid item xs={2}></Grid>
                          <Grid item xs={8} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >
                            <Typography variant="button" >Load from MAD:database </Typography>
                          </Grid>
                          <Grid item xs={2}></Grid>


                          <Marger size="1rem" />
                          <Grid item xs={3}></Grid>
                          <Grid item xs={6} style={{ textAlign: 'center', alignItems: 'center' }}>
                            <Button variant="outlined" color="primary" onClick={() => this.setState({ database_modal_chooser: true })}>
                              Search a molecule
                              <Badge color="secondary" >
                                <Icon className={"fas fa-" + "upload"} />
                              </Badge>
                            </Button>
                          </Grid>

                          <Grid item xs={3}> </Grid>
                          <Marger size="1rem" />
                          <Grid item xs={2}> </Grid>

                          <Grid item xs={8} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >
                            <Typography variant="button" >Load from your history </Typography>
                          </Grid>
                          <Grid item xs={2}> </Grid>

                          <Marger size="1rem" />
                          <Grid item xs={3}> </Grid>
                          <Grid item xs={6} style={{ textAlign: 'center', alignItems: 'center' }}>
                            <Button variant="outlined" color="primary"
                              onClick={() => this.setState({ history_modal_chooser: true })}>
                              Search a molecule
                              <Badge color="secondary" >
                                <Icon className={"fas fa-" + "upload"} />
                              </Badge>
                            </Button>
                          </Grid>

                          <Grid item xs={1}></Grid>


                        </>}
                    </>}

                  <Marger size="1rem" />

                  {(this.state.addMolecule == "false") &&
                    <>
                      <Grid item xs={1}></Grid>
                      <Grid item xs={10}>
                        <Typography align="justify" variant="subtitle2">
                          Welcome on MAD:Polymer Editor, powered by polyply, you can create and edit polymers.
                          You can load molecules from the Polyply database or import new martinized molecule.
                          If a particular type of link between 2 residues is not provided by Polyply, a dialog window will guide you through the
                          process of setting it up.  You can also load a previously saved polymer in .json format, a protein sequence in
                          .fasta format or the topology of a new molecule in .itp.
                        </Typography>
                      </Grid>
                      <Grid item xs={1}></Grid>
                    </>
                  }
                  {(this.state.moleculeAdded && (this.state.addMolecule == "true")) &&

                    <>
                      <Grid item xs={1}></Grid>
                      <Grid item xs={10}>
                        <Typography align="justify" variant="subtitle2">
                          Welcome on MAD:Polymer Editor, powered by polyply, you can create and edit polymers in order to modify the protein that have been loaded.
                          You can load molecules from the Polyply database or import new martinized molecule.
                          If a particular type of link between 2 residues is not provided by Polyply, a dialog window will guide you through the
                          process of setting it up. You can also load a previously saved polymer in .json format, a protein sequence in
                          .fasta format or the topology of a new molecule in .itp.
                        </Typography>
                      </Grid>
                      <Grid item xs={1}></Grid>
                    </>

                  }

                  {(this.state.moleculeAdded || (this.state.addMolecule == "false")) &&
                    <>

                      {(this.state.moleculeAdded) &&
                        <>

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

                        </>}
                      {(this.state.Menuplus) &&
                        <>
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

                          <Grid item xs={2}></Grid>
                          <Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center' }}>

                            <Typography variant="button" >
                              Import custom link file (.ff)
                            </Typography>
                          </Grid>

                          <Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center' }}>
                            <Input

                              inputProps={{ accept: ".ff" }}
                              color="secondary"
                              onChange={(e: any) => this.handleUpload(e.target.files)}
                              type="file"
                            />
                          </Grid>
                          <Grid item xs={1}></Grid>


                        </>}

                      <Marger size="2rem" />
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



                      <Marger size="1rem" />


                      <Grid item xs={1}></Grid>

                      <Grid item xs={10} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }}>
                        <Typography variant="h6" align="left">
                          Add repeat units or chain of repeat units
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

                      <Marger size="1rem" />

                      <Grid item xs={1}></Grid>
                      <Grid item xs={5}>
                        <Typography align="justify" variant={'subtitle2'} > Add a residue or a chain of residues to every residue of this type present in your current polymer:</Typography>
                      </Grid>
                      <Grid item xs={1}></Grid>
                      <Grid item xs={3}>

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
                      <Grid item xs={2}></Grid>


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


                      <Grid item xs={1}></Grid>

                      <Grid item xs={3} style={{ textAlign: 'right', alignItems: 'center', justifyContent: 'center', }} >
                        <Button
                          id="previous"
                          variant="text"
                          onClick={() => { this.props.previous() }}>
                          <Grid container component="main" >

                            <Grid item xs={10}>
                              <Typography variant="body2" align="left">
                               undo 
                              </Typography>
                            </Grid>
                            <Grid item xs={2}>
                              <Badge color="secondary" >
                                <Icon className={"fas fa-" + "arrow-left"} />
                              </Badge>
                            </Grid>

                          </Grid>
                        </Button>
                      </Grid>
                      <Grid item xs={1}></Grid>

                      <Grid item xs={4} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }}>
                        {
                          ((forcefield !== '') && (this.props.errorlink.length !== 0)) ?
                            (

                              <Button id="send" variant="contained" color="error" endIcon={<AutoFixHigh />} onClick={() => this.props.fixlinkcomponentappear()}>
                                <Typography variant="body2" align="left">
                                  Fix link
                                </Typography>

                                <Badge color="secondary" >
                                  <Icon className={"fas fa-" + "pen"} />
                                </Badge>
                              </Button>) :

                            (
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
                            )}
                      </Grid>
                      <Grid item xs={3}></Grid>




                    </>}


                </>
              }


              <Marger size="2rem" />



            </>)
            : (<>

              <Grid item xs={12} style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center', }}>
                <CircularProgress></CircularProgress>
              </Grid>

              <Grid item xs={3}   >
              </Grid>

              <Grid item xs={6} style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center', }}>
                <Typography variant="h6" > Loading data from server... </Typography>
              </Grid>
              <Grid item xs={3}   >
              </Grid>


            </>)
          }


        </Grid >

        <Marger size="1rem" />

      </div >
    )
  };
}

