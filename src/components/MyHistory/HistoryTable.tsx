import React from 'react'; 
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Link } from '@material-ui/core'



export default function HistoryTable(props : {
    jobs : any[]
}){
    const { jobs } = props; 

    const downloadJob = (jobId: string) => {
        console.log("download job")
        console.log(jobId)
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
                            <TableCell>Visualize</TableCell>
                            <TableCell>
                                <Link onClick = {() => {downloadJob(job.id)}}> Download </Link>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}