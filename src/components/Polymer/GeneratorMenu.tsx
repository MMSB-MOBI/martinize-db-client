import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Grain from "@mui/material/Icon/Icon";
import Insights from "@mui/material/Icon/Icon";
import { FormState } from './SimulationType'
import Typography from "@mui/material/Typography";
import Warning from "./Dialog/warning";
import AutoFixHigh from "@mui/material/Icon/Icon";
import { FaIcon, Marger } from "../../helpers";
import { CircularProgress, Grid, } from '@material-ui/core';
import { SimpleSelect } from "../../Shared";
import Link from "@mui/material/Link";

interface propsmenu {

  setForcefield: (ff: string) => void,
  addFromITP: (itp: string) => void,
  addnodeFromJson: (jsondata: JSON) => void,
  addnode: (arg0: FormState) => void,
  addlink: (arg1: any, arg2: any) => void,
  addprotsequence: (arg0: string) => void,
  send: () => void,
  dataForceFieldMolecule: {} | JSON,

}

interface GeneratorMenuState extends FormState {
  id1: string | undefined;
  id2: string | undefined;
  Warningmessage: string;
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
      Warningmessage: "",
    }
  }




  GetMolFField(jsonformdata: any, ff: string): string[] {
    return jsonformdata[ff];
  }


  CheckNewMolecule(): void {
    if (this.state.forcefield === '') {
      this.setState({ Warningmessage: "Field Forcefield null" })
    }
    else if (this.state.moleculeToAdd === '') {
      this.setState({ Warningmessage: "Field Molecule null" })
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
      this.setState({ Warningmessage: "Problem link : id number undefined" })
    }
    else {
      this.props.addlink(idLink1, idLink2)
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
          this.setState({ Warningmessage: event.target.result })
        }
        reader.readAsText(file);
      }
      else {
        this.setState({ Warningmessage: "Fichier inconnu" })
      }
    }
    else {
      this.setState({ Warningmessage: "Only one files should be upload" })
      console.log(selectorFiles)
    }

  }

  render() {
    let forcefield = this.state.forcefield;

    return (
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <Marger size="2rem" />
        <Typography component="h1" variant="h3" align="center" style={{ fontWeight: 700, fontSize: '2.5rem', marginBottom: '0rem' }}>
          Design your own polymer :
        </Typography>

        <Marger size="2rem" />


        <Link
          href="#!"
        // When state is initial state (main loader), don't show the confirm modal

        >
          <FaIcon home style={{ fontSize: '1rem' }} />
          <span style={{ marginLeft: '.7rem', fontSize: '1.1rem' }}>
            MAD Home
          </span>
        </Link>


        <Marger size="2rem" />


        <Grid container component="main" style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center', }} >

          <Grid item xs={6}   >
            <Typography variant="body1" align="center">
              First choose your forcefield :
            </Typography>

          </Grid>
          <Grid item xs={6}  >
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
                    this.setState({ forcefield: v })
                  }} />
              )
            }
          </Grid>


          <Marger size="2rem" />

          {(forcefield !== '') &&
            <div   >
              <div style={{ textAlign: 'left', display: 'flex', }}  >
                <Grid item xs={6} style={{ textAlign: 'left', alignItems: 'center', justifyContent: 'center', }}  >

                  <Typography component={'div'}>
                    Upload a file :
                  </Typography>
                  <Typography component={'div'}>
                    <ul>
                      <li>your previous polymer (.json)</li>
                      <li>a fasta protein sequence (.fasta)</li>
                      <li>a residue description for the forcefield (.itp/.ff)</li>
                    </ul>   </Typography>


                </Grid>

                <Grid item xs={6} style={{ textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'center', }}  >


                  <div style={{ textAlign: 'center', display: 'flex', }}>
                    <Button variant="outlined" color="primary"  >
                      Upload File
                    </Button>

                    <input
                      onChange={(e: any) => this.handleUpload(e.target.files)}
                      type="file"
                      hidden
                    />

                  </div>

                </Grid>
              </div>



              <Marger size="1rem" />
              <Typography style={{ textAlign: 'left', alignItems: 'center', }}> Add your molecule (in chain) : </Typography>

              <SimpleSelect
                //formControlClass={this.props.classes.ff_select}
                required
                label="Molecule"
                variant="standard"
                values={this.GetMolFField(this.props.dataForceFieldMolecule, forcefield).map(e => ({ id: e, name: e }))}
                id="ff"
                value={this.state.moleculeToAdd}
                onChange={v => this.setState({ moleculeToAdd: v })}

              />


              <TextField
                label="numberToAdd"
                type="number"
                InputProps={{ inputProps: { min: 1, max: 100 } }}
                value={this.state.numberToAdd}
                onChange={v => this.setState({ numberToAdd: Number(v.target.value) })}
                variant="standard"

              />

              <Button
                endIcon={<Grain />}
                id="addmol"
                variant="outlined"
                onClick={() => this.CheckNewMolecule()}>
                add
              </Button>

              <Marger size="1rem" />
              <Typography>Add a new link : </Typography>



              <TextField
                label="id1"
                type="number"
                InputProps={{ inputProps: { min: 0, max: 100 } }}
                value={this.state.id1}
                onChange={v => this.setState({ id1: v.target.value })}
                variant="standard"
              />

              <TextField
                label="id2"
                type="number"
                InputProps={{ inputProps: { min: 0, max: 100 } }}
                value={this.state.id2}
                onChange={v => this.setState({ id2: v.target.value })}
                variant="standard"
              />

              <Button
                endIcon={<Insights />}
                id="addlink"
                variant="contained"
                onClick={() => this.CheckNewLink(this.state.id1, this.state.id2)}>
                Add link
              </Button>

              <Marger size="2rem" />

              <Button id="send" variant="contained" color="success" endIcon={<AutoFixHigh />} onClick={() => this.props.send()}>
                Polyply That !!
              </Button>

            </div>
          }
          <Marger size="1rem" />

        </Grid>
        <Warning message={this.state.Warningmessage} close={() => { this.setState({ Warningmessage: "" }) }}></Warning>

      </div>
    )
  };
}
