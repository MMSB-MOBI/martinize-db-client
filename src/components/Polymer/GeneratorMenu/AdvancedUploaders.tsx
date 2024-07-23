import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import BuildIcon from '@mui/icons-material/Build';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import { Button,  Grid, ButtonGroup, Typography } from '@material-ui/core';
import { styled } from '@mui/material/styles';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import { Stack } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';

export const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
  });

export interface CMUProps {
    handleUpload:(f:FileList)=>void
}
export function CustomMoleculeUploader(props:CMUProps) {
    return (
        <Grid container
            direction={"row"}
            alignItems="center"
            style={{ paddingBottom:'1.5em'}}
        >
            <Grid item
                xs={12}
                style={{paddingBottom:'0.5em'}}
            >
                <Typography variant="button" align="center" style={{color:"steelblue"}}>
                    Upload your polymer files
                </Typography>   
            </Grid>
            <Grid item
                xs={6}
            >
                <Button 
                component="label"
                style={{ paddingLeft:'2em', paddingRight:'2em'}} color="primary" variant="outlined" startIcon={<BuildCircleIcon style={{fontSize:'35px'}} />}>
                    <Stack direction={'column'}>
                        <Typography variant="button">Complex</Typography>
                        <Typography variant="caption">(.json)</Typography>
                    </Stack>
                    <VisuallyHiddenInput 
                        type="file"
                        accept=".json"
                        onChange={(e: any) => props.handleUpload(e.target.files)}
                    />                
                </Button>
            </Grid>
            <Grid item
                xs={6}
                alignItems='center'
            >
                <Button 
                    component="label"
                    style={{paddingLeft:'2em', paddingRight:'2em'}}
                    variant="outlined" color="primary" startIcon={<StickyNote2Icon style={{fontSize:'35px'}} />}>
                    <Stack direction={'column'}>
                        <Typography variant="button">Sequence</Typography>
                        <Typography variant="caption">(.fasta)</Typography>
                                   
                    <VisuallyHiddenInput 
                        type="file"
                        accept=".fasta"
                        onChange={(e: any) => props.handleUpload(e.target.files)}
                    />
                    </Stack>     
                </Button>
            </Grid>
        </Grid>
    );
}

export interface CLUProps {
    handleUpload:(f:FileList)=>void;
};
export function CustomLinkUploader (props:CLUProps) {
    return ( 
        <Grid container
            direction="row"
            style={{ padding : '1em', textAlign:'center'}}
            spacing={2}
        >
            <Grid item
                xs={12}
            >
                <Typography variant="button" align="center" style={{width:'100%', color:"steelblue"}} >
                    Upload the definition of several cutoms links 
                </Typography>
            </Grid>             
            <Grid item
                xs={12}
            >
                <Button 
                    component="label"
                    style={{ paddingLeft:'2em', paddingRight:'2em'}} color="primary" variant="outlined" startIcon={<ShareIcon style={{fontSize:'35px'}} />}
                >
                    <Stack direction={'column'}>
                        <Typography variant="button">Complex</Typography>
                        <Typography variant="caption">(.itp)</Typography>
                    </Stack>
                    <VisuallyHiddenInput 
                        type="file"
                        accept=".json"
                        onChange={(e: any) => props.handleUpload(e.target.files)}
                    />                
                </Button>
            </Grid>
        </Grid>
    );
}