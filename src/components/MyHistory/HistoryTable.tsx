import React from 'react'; 
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Link, Collapse, IconButton, Typography, Box } from '@material-ui/core'
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import { useHistory } from 'react-router-dom';
import ApiHelper from '../../ApiHelper';


export default function HistoryTable(props : {
    jobs : any[]
}){
    const { jobs } = props
    const history = useHistory();

    const downloadJob = (jobId: string) => {
        console.log("download job")
        console.log(jobId)
        ApiHelper.request(`history/get?jobId=${jobId}`)
            .then((res) => console.log(res))
            .catch(e => console.log("error", e))
    }

    const visualizeJob = async (jobId : string) => {
        try {
            history.push('/builder', {from: "history", jobId: jobId})
        } catch(e) {
            console.error(e)
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
                    <TableCell>Visualize</TableCell>
                    <TableCell>Download</TableCell>
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