import React from 'react'; 
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Link } from '@material-ui/core'
import { useHistory } from 'react-router-dom';
import ApiHelper from '../../ApiHelper';


export default function HistoryTable(props : {
    jobs : any[]
}){
    const { jobs } = props; 
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

    return (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Job id</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Job type</TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {jobs.map((job) => (
                        <TableRow key={job.id}>
                            <TableCell>{job.id}</TableCell>
                            <TableCell>{job.date}</TableCell>
                            <TableCell>{job.type}</TableCell>
                            <TableCell>
                                    <Link onClick = {() => visualizeJob(job.id)}> Visualize </Link>
                                </TableCell>
                                <TableCell>
                                    <Link onClick = {() => downloadJob(job.id)}> Download </Link>
                                </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}