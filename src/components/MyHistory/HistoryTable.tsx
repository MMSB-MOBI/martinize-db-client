import React from 'react'; 
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Link, Collapse, IconButton, Typography, Box } from '@material-ui/core'
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import { useHistory } from 'react-router-dom';
import ApiHelper from '../../ApiHelper';
import { loadMartinizeFiles, downloadBlob, errorToType, notifyError } from '../../helpers'
import JSZip from 'jszip';
import { toast } from '../Toaster';
import { JobDoc, JobFiles } from '../../types/entities'

export default function HistoryTable(props : {
    jobs : any[]
    onNeedUpdate: () => void,
}){
    const { jobs } = props
    const history = useHistory();

    const downloadJob = async (jobId: string) => {
        try {
            const job : JobDoc = await ApiHelper.request(`history/get?jobId=${jobId}`)
            const martinizeFiles = await loadMartinizeFiles(job)
            const zip = new JSZip()
            zip.file(martinizeFiles.pdb.name, martinizeFiles.pdb.content)
            zip.file(martinizeFiles.top.name, martinizeFiles.top.content)
            for (const itp of martinizeFiles.itps){
                zip.file(itp.name, itp.content)
            }
            const generated = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: {
                  level: 7
                }
              });
            
            const pdbName = job.files.all_atom.name
            const zipName = pdbName.slice(0, pdbName.indexOf('.pdb')) + '-CG'
            
            downloadBlob(generated, zipName + '.zip');
            
        } catch(e){
            if (errorToType(e) === "HistoryFileNotFound") toast("Result files doesn't exist on distant server. This job will be deleted from your history after refresh.", "error"); 
            else notifyError(e); 
        }
    }


    const visualizeJob = async (jobId : string) => {
        try {
            const job : JobDoc = await ApiHelper.request(`history/get?jobId=${jobId}`)
            const [allAtomFile, martinizeFiles] = await Promise.all([loadAllAtomFile(job.files), loadMartinizeFiles(job)])
            history.push('/builder', {from : "history", allAtomFile, martinizeFiles, martinizeMode : job.settings.builder_mode})           
        } catch(e) {
            if (errorToType(e) === "HistoryFileNotFound") toast("Result files doesn't exist on distant server. This job will be deleted from your history after refresh.", "error"); 
            else notifyError(e); 
        }
    }

    const loadAllAtomFile = async (files: JobFiles) : Promise<File> => {
        return new File([files.all_atom.content], files.all_atom.name, { type: files.all_atom.type })
    }

    const deleteJob = async (jobId: string) => {
        try {
            await ApiHelper.request(`history/delete?jobId=${jobId}`)
            props.onNeedUpdate(); 
            
        }catch(e){
            notifyError(e); 
        }

    }

    const JobRow = (props : {job: any}) => {
        const [open, setOpen] = React.useState(false);
        const { job } = props; 
        return (
            <React.Fragment>
                <TableRow>
                    <TableCell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                    </TableCell>
                    <TableCell> {job.id} </TableCell>
                    <TableCell>{job.name}</TableCell>
                    <TableCell>{job.settings.builder_mode}</TableCell>
                    <TableCell>{job.date}</TableCell>
                    <TableCell>{job.type}</TableCell>
                    <TableCell> <Link onClick = {() => visualizeJob(job.id)}> Visualize </Link> </TableCell>
                    <TableCell> <Link onClick = {() => downloadJob(job.id)}> Download </Link> </TableCell>
                    <TableCell> <Link onClick = {() => deleteJob(job.id)}> Delete </Link> </TableCell>
                </TableRow>
                <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box>
                    <ul>
                        <li>Force field : {job.settings.ff}</li>
                        <li> Position restrains : {job.settings.position} </li>
                        <li>Mode : {job.settings.builder_mode} </li>
                        <li>C-terminal : {job.settings.cter} </li>
                        <li>N-terminal : {job.settings.nter} </li>
                        <li>Side-chain fix : {job.settings.sc_fix} </li>
                        <li>Cystein bridge : {job.settings.cystein_bridge} </li>
                        <li>Command line : {job.settings.commandline} </li> 
                    </ul>
                    
                    </Box>
                </Collapse>
                </TableCell>
                </TableRow>
            </React.Fragment>
    )

    }
        

    return (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell/>                        
                        <TableCell>Job id</TableCell>
                        <TableCell> Input name </TableCell>
                        <TableCell> Builder mode</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Job type</TableCell>
                        <TableCell/>
                        <TableCell/>
                        <TableCell/>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {jobs.map((job) => (
                        <JobRow key={job.id} job={job}></JobRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}