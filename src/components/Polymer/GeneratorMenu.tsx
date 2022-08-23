import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Grain from "@mui/material/Icon/Icon";
import { FormState } from './SimulationType'
import Typography from "@mui/material/Typography";
import CreateLink from "./Dialog/CreateLink";
import AutoFixHigh from "@mui/material/Icon/Icon";
import { FaIcon, Marger } from "../../helpers";
import { CircularProgress, Grid, Input, } from '@material-ui/core';
import { SimpleSelect } from "../../Shared";
import Link from "@mui/material/Link";
import HistoryBuild from "../Builder/HistoryBuild";
import { Link as RouterLink, RouteComponentProps } from 'react-router-dom';

interface propsmenu {
  warningfunction: (arg: any) => void;
  setForcefield: (ff: string) => void,
  addFromITP: (itp: string) => void,
  addNEwMolFromITP: (itp: string) => void,
  addnodeFromJson: (jsondata: JSON) => void,
  addnode: (arg0: FormState) => void,
  addlink: (arg1: any, arg2: any) => void,
  addprotsequence: (arg0: string) => void,
  send: () => void,
  addNEwCustomLink: (arg0: string) => void,
  dataForceFieldMolecule: {} | JSON,
}

interface GeneratorMenuState extends FormState {
  id1: string | undefined;
  id2: string | undefined;
  createLink: boolean;
}



export default class GeneratorMenu extends React.Component<propsmenu, GeneratorMenuState> {

  constructor(props: propsmenu) {
    // Required step: always call the parent class' constructor
    super(props);

    // Set the state directly. Use props if necessary.
    this.state = {
      forcefield: "",
      moleculeToAdd: "",
      numberToAdd: 1,
      id1: undefined,
      id2: undefined,
      createLink: false
    }
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

  handleUploadITP = (selectorFiles: FileList) => {
    if (selectorFiles.length === 1) {
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
  }



  handleUpload = (selectorFiles: FileList) => {
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
        let reader = new FileReader();
        reader.onload = (event: any) => {
          this.props.addFromITP(event.target.result)
        }
        reader.readAsText(file);
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


  render() {
    let forcefield = this.state.forcefield;

    return (
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <CreateLink
          close={() => { this.setState({ createLink: false }) }}
          addthisRule={(s: string) => this.props.addNEwCustomLink(s)}
          showCreate={this.state.createLink}
        >

        </CreateLink>

        <Marger size="2rem" />
        <Typography component="h1" align="center" style={{ fontWeight: 700, fontSize: '2.5rem', marginBottom: '0rem' }}>
          Design your own polymer:
        </Typography>

        <Marger size="1rem" />
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <Link
            href="#!"
            // When state is initial state (main loader), don't show the confirm modal
            onClick={this.onGoBack}
          >
            <FaIcon home style={{ fontSize: '1rem' }} />
            <span style={{ marginLeft: '.7rem', fontSize: '1.1rem' }}>
              MAD Home
            </span>
          </Link>

          <RouterLink ref={this.go_back_btn} to="/" style={{ display: 'none' }} />
        </div>

        <Marger size="2rem" />


        <Grid container component="main" style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }}>

          <Grid item xs={6}>
            <Typography variant="h6" >
              First choose your forcefield:
            </Typography>

          </Grid>
          <Grid item xs={4}>
            {Object.keys(this.props.dataForceFieldMolecule).length === 0 ? (
              <CircularProgress />
            ) :
              (
                <SimpleSelect
                  //formControlClass={this.props.classes.ff_select}
                  required
                  label="Used forcefield : "
                  variant="standard"
                  values={Object.keys(this.props.dataForceFieldMolecule).map(e => ({ id: e, name: e }))}
                  id="ff"
                  value={this.state.forcefield}
                  onChange={v => {
                    this.props.setForcefield(v);
                    this.setState({ forcefield: v });
                  }} />
              )}
          </Grid>

          <Marger size="2rem" />
          <Grid item xs={6}>
            <Typography variant="h6" >
              (BETA) Design your own itp link file:
            </Typography>

          </Grid>
          <Grid item xs={4}>

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
            <Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center' }}>

              <Typography variant="h6" >
              (BETA) Add my own molecule (.itp):
              </Typography>
            </Grid>
          }
          {(forcefield !== '') &&
            <Grid item xs={5} style={{ textAlign: 'left', alignItems: 'center' }}>
              <Input

                color="primary"
                onChange={(e: any) => this.handleUploadITP(e.target.files)}
                type="file"
              />
            </Grid>
          }


          {(forcefield !== '') &&
            <Grid item xs={10} style={{ textAlign: 'left', alignItems: 'center' }}>

              <Typography component={'div'}>
                <ul>
                  <li>Your previous polymer (.json)</li>
                  <li>Fasta protein sequence (.fasta)</li>
                  <li>Topology of a polymer (.itp)</li>
                </ul>   </Typography>

            </Grid>

          }

          <Marger size="1rem" />

          {
            (forcefield !== '') &&
            <Grid item xs={10} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }}>
              <Typography variant="h6" align="left">
                Add your molecule (in chain):
              </Typography>
            </Grid>
          }
          {
            (forcefield !== '') &&
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
          }
          {
            (forcefield !== '') &&
            <Grid item xs={2} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >

              <TextField
                label="numberToAdd"
                type="number"
                InputProps={{ inputProps: { min: 1, max: 100 } }}
                value={this.state.numberToAdd}
                onChange={v => this.setState({ numberToAdd: Number(v.target.value) })}
                variant="standard" />
            </Grid>
          }
          {
            (forcefield !== '') &&
            <Grid item xs={3} style={{ textAlign: 'right', alignItems: 'center', justifyContent: 'center', }} >
              <Button
                endIcon={<Grain />}
                id="addmol"
                variant="outlined"
                onClick={() => this.CheckNewMolecule()}>
                add
              </Button>
            </Grid>
          }

          {/* <HistoryBuild
            onSelect={async (uuid: string) => {
              console.log(uuid)
              //   const job: ReadedJobDoc = await ApiHelper.request(`history/get?jobId=${uuid}`)
              //   const martinizeFiles = await loadMartinizeFiles(job)

              //   this.setState({
              //     pdb: martinizeFiles.pdb.content,
              //     top: martinizeFiles.top.content,
              //     itps: martinizeFiles.itps.map(itp => itp.content),
              //     ff: job.settings.ff,
              //     builder_mode: job.settings.builder_mode
              //   }, this.nextFromFiles)
            }}

          /> */}
          <Marger size="1rem" />

          {
            (forcefield !== '') &&

            <Grid item xs={10} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >
              <Typography variant="h6" >Add a new link: </Typography>
            </Grid>
          }
          {
            (forcefield !== '') &&
            <Grid item xs={3} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >
              <TextField
                label="id1"
                type="number"
                InputProps={{ inputProps: { min: 0, max: 100 } }}
                value={this.state.id1}
                onChange={v => this.setState({ id1: v.target.value })}
                variant="standard" />
            </Grid>
          }
          {
            (forcefield !== '') &&
            <Grid item xs={3} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }} >
              <TextField
                label="id2"
                type="number"
                InputProps={{ inputProps: { min: 0, max: 100 } }}
                value={this.state.id2}
                onChange={v => this.setState({ id2: v.target.value })}
                variant="standard" />
            </Grid>
          }

          {
            (forcefield !== '') &&
            <Grid item xs={3} style={{ textAlign: 'right', alignItems: 'center', justifyContent: 'center', }} >
              <Button
                id="addlink"
                variant="contained"
                onClick={() => this.CheckNewLink(this.state.id1, this.state.id2)}>
                Add link

              </Button>

            </Grid>
          }
          <Marger size="2rem" />
          {
            (forcefield !== '') &&

            <Grid item xs={6} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }}>

              <Button id="send" variant="contained" color="success" endIcon={<AutoFixHigh />} onClick={() => this.props.send()}>
                Polyply That!
              </Button>
            </Grid>
          }
          <Marger size="1rem" />

        </Grid >
      </div >
    )
  };
}
