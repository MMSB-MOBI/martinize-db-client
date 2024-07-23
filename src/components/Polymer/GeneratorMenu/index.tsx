import * as React from "react";

import TextField from "@mui/material/TextField";
import Grain from "@mui/material/Icon/Icon";
import { FormState } from '../SimulationType'
import Typography from "@mui/material/Typography";
import CreateLink from "../Dialog/CreateLink";
import AutoFixHigh from "@mui/material/Icon/Icon";
import { FaIcon, Marger } from "../../../helpers";
import { Button, CircularProgress, Divider, FormControl, FormControlLabel, FormLabel, Grid, Icon, Input, InputLabel, MenuItem, Paper, Radio, RadioGroup, Select, ButtonGroup } from '@material-ui/core';
import { TooltipedSelect } from "../../../ShareTT";
import { SimpleSelect } from '../../../Shared';
import Link from "@mui/material/Link";
import { Link as RouterLink } from 'react-router-dom';
import { ModalMoleculeSelector } from "../../Builder/MembraneBuilder/MoleculeChooser";
import { ModalHistorySelector } from "../../MyHistory/MyHistory";
import Switch from '@mui/material/Switch';
import { ImportProtein } from "../Dialog/importProtein";
import ApiHelper from "../../../ApiHelper";
import md5 from 'md5';
import { getID } from "../GeneratorManager";
import PolymerSource from "./PolymerSource";
import ForceFieldChooser from './ForceFieldChooser';
import Alert from '@mui/material/Alert';
import Box from "@mui/material/Box";
import UploaderSwitch from "./UploaderSwitch";
import PolyplyDisclaimer from "./PolyplyDisclaimer";
import MailerSwitch from "./MailerSwitch";
import LinkCreator from './LinkCreator';
import MoleculeAdder from "./MoleculeAdder";
import PolyplyControls from "./PolyplyControls";
//import Chip from '@mui/material/Chip';
import ModalBackToDb from "./ModalBackToDb";
import HomeIcon from '@mui/icons-material/Home';
import RepeatOnIcon from '@mui/icons-material/RepeatOn';
import { Stack } from "@mui/material";

// Accordeon section attempt

import Accordion from '@mui/material/Accordion';
import AccordionActions from '@mui/material/AccordionActions';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandCircleDownIcon from '@mui/icons-material/ExpandCircleDown';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import {CustomMoleculeUploader, CustomLinkUploader} from './AdvancedUploaders';
import { makeStyles } from "@material-ui/core/styles";

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
  dataForceFieldMolecule: { [forcefield: string]: Record<string, [string,string]> };
  errorlink: any[];
  fixlinkcomponentappear: () => void;
  clear: () => void;
  version: string;
  previous: () => void;
  doSendMail: (maybeSend: boolean) => void;
  listSimulationMolecule:()=>string[];
  onNodeHighlight:(index:number, up:boolean)=>void;
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
  basicUploadedMoleculeChoice: boolean |undefined;
  basicUploadedMoleculeDone:boolean;
  expertUploadedMolecule: boolean;
  send_mail:boolean;
  hasForceField:boolean;
  readyToGo:boolean;
}

class GeneratorMenu extends React.Component<propsmenu, GeneratorMenuState> {

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
    basicUploadedMoleculeChoice: undefined,  // basic switch
    expertUploadedMolecule: false, // advanced option
    basicUploadedMoleculeDone:false,
    send_mail:false,
    hasForceField:false,
    readyToGo:false
  }

 
  protected go_back_btn = React.createRef<any>();

  closeCreate(): void {
    //console.log(this.state)
    // this.setState( {createLink : false})
  }

  handle_previous = (): void => {
    //Check how is the previous nodes list 
    //If it's emphy we should change state to go back 
    console.log(getID())
    if (Number(getID()) < 0) {
      this.setState({
        forcefield: "",
     
        id1: undefined,
        id2: undefined,
        createLink: false,
        database_modal_chooser: false,
        history_modal_chooser: false,
        builder_mode: "classic",
        want_go_back: false,
        Menuplus: false,
        proteinImport: false,
      
        basicUploadedMoleculeChoice: undefined,
        basicUploadedMoleculeDone:false,
        expertUploadedMolecule: false,
        send_mail:false
      })
    }
    else this.props.previous()
  }

  CheckNewMolecule(molecule:string, count: number, target?:string): void {
    if (this.state.forcefield === '') {
      this.props.warningfunction("Please select a forcefield")
    }
    else {

      console.log("GeneratorMenu::CheckNewMolecule");
      console.dir({
        forcefield : this.state.forcefield,
        moleculeToAdd: molecule,
        numberToAdd: count,
        add_to_every_residue : target
      });

      this.props.addnode({
        forcefield : this.state.forcefield,
        moleculeToAdd: molecule,
        numberToAdd: count,
        add_to_every_residue : target
      })
    }
  }

  CheckNewLink(idLink1: string | undefined, idLink2: string | undefined): void {
    // check undefined value : 

    //checkLink( )
    if ((typeof (idLink1) == 'undefined') || (typeof (idLink2) == 'undefined')) {
      this.props.warningfunction("Please select id for your new link.")
    }
    else {
      this.props.addlink(idLink1.split("#")[1], idLink2.split("#")[1])
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
            this.setState({ expertUploadedMolecule: true })
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
          if (event.target.result.includes("moleculetype")) {
            console.log(".ff file with molecule type");
            this.props.addNEwMolFromITP(event.target.result)
            this.setState({ expertUploadedMolecule: true })
          }
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
          this.setState({ basicUploadedMoleculeDone: true })
        })
        .catch(e => {
          console.error(e)
          this.props.warningfunction(molecule.alias + ": Topology file not found")
        })

      ApiHelper.request(req_gro, { mode: "text" })
        .then((rep: string) => {
          this.props.addmoleculecoord(rep)
          this.setState({ basicUploadedMoleculeDone: true })
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
    console.log("moleculefromhistory", molecule)
    this.setState({ want_go_back: false });
    this.props.addmoleculecoord(molecule.gro.content)
    this.props.addNEwMolFromITP(molecule.itp)
    this.setState({ history_modal_chooser: false, basicUploadedMoleculeDone: true })
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



  /*
  componentDidMount() {
    
  }
  */
  render() {
    //@ts-ignore
    const { classes } = this.props;
    let forcefield = this.state.forcefield;
    
    return (
      <div>
        <ModalBackToDb
          openStatus={!!this.state.want_go_back}
          onClose={this.onWantGoBackCancel}
          onClickCancel={this.onWantGoBackCancel}
          onClickGoBack={this.onGoBack}
        ></ModalBackToDb>
       
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
          ff={forcefield}
        />

        <ModalHistorySelector
          open={this.state.history_modal_chooser}
          onChoose={this.moleculefromhistory}
          onCancel={() => this.setState({ history_modal_chooser: false })}
          ff={ this.state.forcefield }
        />

        <ImportProtein
          open={this.state.proteinImport}
          close={() => this.setState({ proteinImport: false })}
          addprotcoord={(a) => { this.setState({ basicUploadedMoleculeDone: true }); this.props.addmoleculecoord(a) }}
          addNEwMolFromITP={this.props.addNEwMolFromITP}
          addCustomitp={this.props.addCustomitp}

        />
      <Grid container
        direction="column"
        justifyContent="center" alignItems="center" 
        >
           <Marger size="1rem" />
        <Grid item>
        <Typography component="h1" variant="h3" align="center" style={{ fontWeight: 700, fontSize: '2.5rem', marginBottom: '1rem' }}>
          Polymer Editor
        </Typography>
        </Grid>
        <Grid item>        
        <Typography variant="subtitle1" align="center" style={{ fontSize: '0.7rem', fontStyle: 'italic', marginBottom: '1rem' }}>
          polyply version : {this.props.version}
        </Typography>
        </Grid>
        <Grid item xs={7}>
        <Stack direction="row" spacing={3} >
          
          <RouterLink ref={this.go_back_btn} to="/"
          onClick={this.state.want_go_back !== true ? this.onWantGoBack : this.onGoBack}
          style={{ textDecoration:"none"}}
          >         
              <Typography
                sx={{ 
                  display: "flex", alignItems: "center", paddingLeft:1, 
                  color:"steelblue",  textDecoration:"none",
                }}
                >
                <HomeIcon color="primary"/> 
                &nbsp;MAD HOME</Typography>
          </RouterLink>


          <RouterLink  to="/polymer"
            onClick={ ()=> {
              window.location.reload();
            }}
            style={{ textDecoration:"none"}}
            >         
              <Typography
                sx={{ 
                  display: "flex", 
                  color:"steelblue",  textDecoration:"none"
                }}                
                >
                <RepeatOnIcon/> 
                &nbsp;RESET EDITOR</Typography>
          </RouterLink>

          
      </Stack>
      </Grid>
      </Grid>
        <Marger size="2rem" />
        <Divider variant='middle' />

        <Marger size="2rem" />

        <Grid container
        spacing={1}
        component="main" 
        direction="column"
        justifyContent="center"
        alignItems="center"
        >

          {/* By default we ask for forcefield choice */}
          { this.state.hasForceField ?
              <Grid item xs={11}
                style={ { justifyContent:"center", 
                          textAlign     :"center",
                          width         :'100%'
                          } }>
                <Alert severity="info">
                    Current forcefield is 
                    <Box sx={{ml:'0.5em'}} fontWeight='fontWeightBold' fontSize="1.25em" display='inline'>{this.state.forcefield} </Box>
                </Alert>                    
              </Grid> 
              :
              <Grid item
                  xs={12}
                  style={{width:'100%', paddingLeft:"2em", paddingRight:"2em"}}                  
                  >
                    <ForceFieldChooser 
                      availableForcefield= { Object.keys(this.props.dataForceFieldMolecule) }
                      onChange={ (ff) => {
                        this.props.setForcefield(ff);
                        this.setState({ forcefield: ff });
                        this.setState({ hasForceField: true });                       
                      } }
                    ></ForceFieldChooser>
                  </Grid>
          }
            
          { // We have a force field but no molecule at all, we propose the premade switch
            (  this.state.hasForceField &&
              this.state.basicUploadedMoleculeChoice == undefined) &&
                <Grid item xs={11}
                  style={{ 
                    justifyContent:"center", 
                    textAlign     :"center",
                    width         :'100%'
                  }}
                >
                  <UploaderSwitch 
                    onClick={ yesNo => this.setState({ basicUploadedMoleculeChoice: yesNo }) } 
                                        
                  >
                  </UploaderSwitch>
                </Grid>
          }
           {  
            // Premade switch was set to yes
            // We display the premade source menu
            ( this.state.hasForceField && 
              this.state.basicUploadedMoleculeChoice == true /*not undefined */ &&
              ! this.state.basicUploadedMoleculeDone ) &&                    
                <Grid item xs={11}
                  style={{
                    justifyContent: "center",
                    textAlign: "center",
                    width: '100%'
                  }}
                >
                  <PolymerSource
                    onClick={[ //basicUploadedMoleculeDone will be set to true by those 3 calls
                      () => this.setState({ proteinImport: true }),
                      () => this.setState({ database_modal_chooser: true }),
                      () => this.setState({ history_modal_chooser: true })
                    ]}
                  ></PolymerSource>
                </Grid>
          }
          { // Initial upload choice was made, display disclaimer           
            (this.state.hasForceField && 
             (this.state.basicUploadedMoleculeDone || this.state.basicUploadedMoleculeChoice == false)
            ) &&                         
              <Grid item xs={11}>
                <PolyplyDisclaimer></PolyplyDisclaimer>
                <MailerSwitch></MailerSwitch>                
              </Grid>
          }
         
          
          {/* 
              --- MAIN SECTION --
            Molecule injectors sub menus for now same conds as above 
          
            */
            (this.state.hasForceField && 
             (this.state.basicUploadedMoleculeDone || this.state.basicUploadedMoleculeChoice == false)
            ) &&    
              <>    
                { /*
                <Grid item
                  xs={11}
                >
                  <AdvancedSettings></AdvancedSettings>
                </Grid>                                                                    
                */
                }

                <Grid item
                  xs={11}
                  style={{ width:'100%', paddingTop:'1em', paddingBottom:'1em', alignItems:'stretch'}}
                >
                 
                  <Accordion defaultExpanded>
                    <AccordionSummary                      
                      style={{ color:'midnightblue' }}
                      expandIcon={<ExpandCircleDownIcon style={{ color:'midnightblue'}}/>}
                    >
                    <Typography 
                      align="center"
                      variant="h4" 
                      style={{ width:'100%', color:'midnightblue', fontWeight:'800'}}
                    >
                      Create Polymers
                    </Typography>     
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack direction={"column"} spacing={2}>                     
                      <Paper elevation={2} 
                        style={{ 
                          display: "flex", 
                          justifyContent:"center",                         
                          textAlign: "center",
                          paddingBottom:'1.5em',
                          paddingTop:'0.5em',                      
                          }}
                        >
                        <MoleculeAdder
                          type="injector"                    
                          molecules={ this.props.dataForceFieldMolecule[this.state.forcefield] }
                          onAddClick= { (molecule, count) => { 
                            this.setState({ want_go_back: false }); 
                            this.CheckNewMolecule(molecule, count, undefined) } 
                          }
                        ></MoleculeAdder>
                      </Paper>

                      <Paper elevation={2}
                       style={{ 
                        display: "flex", 
                        justifyContent:"center",  
                        alignItems: "center",
                        textAlign: "center",
                        paddingBottom:'1.5em',
                        paddingTop:'0.5em'
                        }}
                      >
                        <MoleculeAdder
                          type="attacher"                   
                          molecules={ this.props.dataForceFieldMolecule[this.state.forcefield]}
                          onAddClick={ (molecule, count, target)=> { 
                            this.setState({ want_go_back: false }); 
                            this.CheckNewMolecule(molecule, count, target); 
                          }}
                          targetLister={ () => {
                            const nodes = this.props.listSimulationMolecule();
                            return nodes.reduce( (uniq, name) => uniq.includes(name) ? uniq : 
                              uniq.concat([name]), [] as string[] );
                          }}
                        ></MoleculeAdder>  
                        </Paper>                            
                        <Paper elevation={8}
                          style={{ 
                            display: "flex", 
                            justifyContent:"center",  
                            alignItems: "center",
                            textAlign: "center",
                            paddingBottom:'0em',
                            paddingTop:'0.25em'
                            }}
                          >                                            
                        <CustomMoleculeUploader 
                          handleUpload={ this.handleUpload }
                        ></CustomMoleculeUploader>
                          </Paper>
                      </Stack>                
                    </AccordionDetails>
                  </Accordion>
                
                  <Accordion>
                    <AccordionSummary                      
                      style={{ color:'midnightblue' }}
                      expandIcon={<ExpandCircleDownIcon style={{ color:'midnightblue'}}/>}
                    >
                      <Typography 
                        align="center"
                        variant="h4" 
                        style={{ width:'100%', color:'midnightblue', fontWeight:'800'}}
                      >
                        Edit Molecular Bonds
                      </Typography>     
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack direction={"column"} spacing={4}>
                        <Paper elevation={2}>
                      <LinkCreator
                        disabled={ ! (this.props.listSimulationMolecule().length > 0) }
                        values={ () => this.props.listSimulationMolecule().map(                        
                            (n, i) =>  `${n}#${i}` )                       
                          }
                          onSelectItemEnter={ (v,b)=>{
                            console.log(`GeneratorMenu::EnterEvent ${v}, ${b}`)
                            this.props.onNodeHighlight(parseInt(v.split("#")[1]), b)
                          }}
                          onSelectItemLeave={ (v,b)=>{
                            console.log(`GeneratorMenu::LeaveEvent ${v}, ${b}`)
                            this.props.onNodeHighlight(parseInt(v.split("#")[1]), b)
                          }}
                          onSrcSelect={ (v)=>{
                            this.props.onNodeHighlight(parseInt(v.split("#")[1]), false)
                          }}
                          onTgtSelect={ (v)=>{
                            this.props.onNodeHighlight(parseInt(v.split("#")[1]), false)
                          }}
                          onAction= { (v1, v2)=>{
                            console.log("Action !" + v1 + v2); 
                            this.setState({ want_go_back: false }); this.CheckNewLink(v1, v2) 
                          }}
                      ></LinkCreator>   
                      </Paper>
                      <Paper elevation={2}>
                    
                      <CustomLinkUploader
                        handleUpload={ this.handleUpload }
                      ></CustomLinkUploader>
                        </Paper>
                      </Stack>


                </AccordionDetails>
                </Accordion>
                </Grid>

                <Grid item
                  style={{ paddingTop:'1em', paddingBottom:'1.5em'}}
                  xs={8}
                >
                  <PolyplyControls
                    onClick={ () => { console.log("GOGO")}}
                    onUndo={()=>{}}
                    onSubmit={()=>{}}
                    enabling={ ()=>this.state.readyToGo }
                    >                        
                  </PolyplyControls>
                </Grid>
              </>
            }
      </Grid>
      </div>
    )
  }
}

export default GeneratorMenu;