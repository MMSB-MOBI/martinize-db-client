import React from 'react'; 
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Link, Collapse, IconButton, Box, TableFooter, TablePagination, Checkbox, TableSortLabel } from '@material-ui/core'
import { visuallyHidden } from '@mui/utils'
import { KeyboardArrowDown, KeyboardArrowUp, LastPage, KeyboardArrowRight, FirstPage, KeyboardArrowLeft} from '@material-ui/icons'
import { useHistory } from 'react-router-dom';
import ApiHelper from '../../ApiHelper';
import { loadMartinizeFiles, downloadBlob, errorToType, notifyError } from '../../helpers'
import JSZip from 'jszip';
import { toast } from '../Toaster';
import { JobDoc, JobSettings } from '../../types/entities'
import { useTheme } from '@material-ui/core/styles';

type Order = 'asc' | 'desc';

interface EnhancedTableProps {
    numSelected: number;
    onRequestSort: (event: React.MouseEvent<unknown>, property: SortableKeys) => void;
    onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
    order: Order;
    orderBy: string;
    rowCount: number;
    onDeleteSelectionClick: () => void; 
}

interface HeadCell {
    id: SortableKeys; 
    numeric: boolean; 
    label : string; 
}

interface FormattedJob {
    id: string; 
    name: string; 
    date : string; 
    ff: string; 
    mode : string; 
    type: string; 
    settings : JobSettings; 
    manual_bonds_edition?: boolean; 
}

type SortableKeys = "id" | "name" | "date" | "ff" | "mode" | "type"; 


interface TablePaginationActionsProps {
    count: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (
      event: React.MouseEvent<HTMLButtonElement>,
      newPage: number,
    ) => void;
  }

const headCells: readonly HeadCell[] = [
    {
      id: 'id',
      numeric: false,
      label: 'Job id',
    },
    {
      id: 'name',
      numeric: false,
      label: 'Input name',
    },
    {
      id: 'date',
      numeric: false,
      label: 'Last modification date',
    },
    {
      id: 'ff',
      numeric: false,
      label: 'Force field',
    },
    {
      id: 'mode',
      numeric: false,
      label: 'Builder mode',
    },
    {
        id : 'type',
        numeric: false, 
        label : "Job type"
    }
  ];

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  }

function getComparator<Key extends SortableKeys>(
    order: Order,
    orderBy: Key,
  ): (
    a: { [key in Key]: number | string },
    b: { [key in Key]: number | string },
  ) => number {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }

function formatData(jobs : JobDoc[]): FormattedJob[] {
    return jobs.map(job => ({
        id : job.jobId, 
        name : job.name, 
        date : job.update_date ? job.update_date : job.date,
        ff : job.settings.ff, 
        mode : job.settings.builder_mode,
        type : job.type, 
        settings : job.settings,
        manual_bonds_edition : job.manual_bonds_edition
    }))
}

function EnhancedTableHead(props:EnhancedTableProps) {
    const { onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort, onDeleteSelectionClick } =
props;

    const createSortHandler =
        (property: SortableKeys) => (event: React.MouseEvent<unknown>) => {
        onRequestSort(event, property);
        };
    
    return(
        <TableHead>
            <TableRow>
                <TableCell padding="checkbox">
                    <Checkbox
                        color="primary"
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={rowCount > 0 && numSelected === rowCount}
                        onChange={onSelectAllClick}
                        inputProps={{
                            'aria-label': 'select all jobs',
                          }}
                    />
                </TableCell>
                <TableCell/>
                {headCells.map((headCell) => (
                    <TableCell
                        key={headCell.id}
                        align={headCell.numeric ? 'right' : 'left'}
                        sortDirection={orderBy === headCell.id ? order : false}
                    >
                        <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        onClick={createSortHandler(headCell.id)}
                        >
                        {headCell.label}
                        {orderBy === headCell.id ? (
                            <Box component="span" sx={visuallyHidden}>
                            {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                            </Box>
                        ) : null}
                        </TableSortLabel>
                    </TableCell>
                    ))}
                <TableCell/>
                <TableCell/>
                <TableCell> {numSelected !== 0 ? <Link onClick={onDeleteSelectionClick}>Delete selection</Link> : ""} </TableCell>
            </TableRow>
        </TableHead>
    )
}

function TablePaginationActions(props: TablePaginationActionsProps) {
    const theme = useTheme();
    const { count, page, rowsPerPage, onPageChange } = props;
  
    const handleFirstPageButtonClick = (
      event: React.MouseEvent<HTMLButtonElement>,
    ) => {
      onPageChange(event, 0);
    };
  
    const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onPageChange(event, page - 1);
    };
  
    const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onPageChange(event, page + 1);
    };
  
    const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
    };
  
    return (
      <Box sx={{ flexShrink: 0, ml: 2.5 }}>
        <IconButton
          onClick={handleFirstPageButtonClick}
          disabled={page === 0}
          aria-label="first page"
        >
          {theme.direction === 'rtl' ? <LastPage /> : <FirstPage />}
        </IconButton>
        <IconButton
          onClick={handleBackButtonClick}
          disabled={page === 0}
          aria-label="previous page"
        >
          {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
        </IconButton>
        <IconButton
          onClick={handleNextButtonClick}
          disabled={page >= Math.ceil(count / rowsPerPage) - 1}
          aria-label="next page"
        >
          {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
        </IconButton>
        <IconButton
          onClick={handleLastPageButtonClick}
          disabled={page >= Math.ceil(count / rowsPerPage) - 1}
          aria-label="last page"
        >
          {theme.direction === 'rtl' ? <FirstPage /> : <LastPage />}
        </IconButton>
      </Box>
    );
  }


export default function HistoryTable(props : {
    jobs : JobDoc[]
    onNeedUpdate: () => void,
}){
    const { jobs } = props

    const history = useHistory();

    const formattedJobs = formatData(jobs); 

    const [page, setPage] = React.useState(0); 
    const [rowsPerPage, setRowsPerPage] = React.useState(10); 
    const [order, setOrder] = React.useState<Order>('desc');
    const [orderBy, setOrderBy] = React.useState<SortableKeys>('date');
    const [selected, setSelected] = React.useState<string[]>([]);
    const [dense, setDense] = React.useState(false);

    

    const downloadJob = async (jobId: string) => {
        try {
            const job : JobDoc = await ApiHelper.request(`history/get?jobId=${jobId}`)
            const martinizeFiles = await loadMartinizeFiles(job)
            const zip = new JSZip()
            zip.file(martinizeFiles.pdb.name, martinizeFiles.pdb.content)
            zip.file(martinizeFiles.top.name, martinizeFiles.top.content)
            for (const itp of martinizeFiles.itps.flat()){
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
            const err = e as any
            if (errorToType(err) === "HistoryFileNotFound") toast("Result files doesn't exist on distant server. This job will be deleted from your history after refresh.", "error"); 
            else notifyError(err); 
        }
    }


    const visualizeJob = async (jobId : string) => {
        window.open('/builder/' + jobId);
    }

    const deleteJobs = async (jobIds: string[]) => {
        try {
            await ApiHelper.request("history/delete", { parameters: {jobIds} })
            props.onNeedUpdate(); 
            
        }catch(e){
           const err = e as any
            notifyError(err); 
        }

    }

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
      };

      const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
      };

    const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
          const newSelecteds = jobs.map((job) => job.jobId);
          setSelected(newSelecteds);
          return;
        }
        setSelected([]);
      };

    const handleRequestSort = (
        event: React.MouseEvent<unknown>,
        property: SortableKeys,
      ) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };
    
    const isSelected = (name: string) => selected.indexOf(name) !== -1;

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - jobs.length) : 0;


    const handleClick = (id: string) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected: string[] = [];
    
        if (selectedIndex === -1) {
          newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
          newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
          newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
          newSelected = newSelected.concat(
            selected.slice(0, selectedIndex),
            selected.slice(selectedIndex + 1),
          );
        }
    
        setSelected(newSelected);
      };

    const handleDeleteSelection = () => {
      deleteJobs(selected); 
    }

      const Row = (props: {job:FormattedJob, index:number}) => {
        const [open, setOpen] = React.useState(false);
        const { job, index } = props; 

        const isItemSelected = isSelected(job.id); 
        const labelId = `enhanced-table-checkbox-${index}`;

        return (
            <React.Fragment>
                <TableRow 
                    hover
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={job.id}
                    selected={isItemSelected}
                    
                >
                    <TableCell padding="checkbox">
                        <Checkbox
                            color="primary"
                            onChange={() => {handleClick(job.id)}}
                            checked={isItemSelected}
                            inputProps={{
                                'aria-labelledby': labelId,
                            }}
                        />
                    </TableCell>
                    <TableCell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                    </TableCell>
                    <TableCell  id={labelId}> {job.id} </TableCell>
                    <TableCell> {job.name} </TableCell>
                    <TableCell> {job.date} </TableCell>
                    <TableCell> {job.ff} </TableCell>
                    <TableCell> {job.mode} </TableCell>
                    <TableCell> {job.type} </TableCell>
                    <TableCell> <Link onClick={() => visualizeJob(job.id)}> Visualize </Link> </TableCell>
                    <TableCell> <Link onClick={() => downloadJob(job.id)}> Download </Link> </TableCell>
                    <TableCell> <Link onClick={() => deleteJobs([job.id])}> Delete </Link> </TableCell>
                </TableRow>
                <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box>
                    <ul>
                        <li>Force field : {job.settings.ff}</li>
                        <li> Position restrains : {job.settings.position} </li>
                        <li>Mode : {job.settings.builder_mode} {job.manual_bonds_edition ? " (with manual edition of bonds)" : ""} </li>
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
            </React.Fragment>)
    }

    return (
        <Box sx={{ width: '100%' }}>
                <TableContainer>
                    <Table>
                        <EnhancedTableHead
                            numSelected={selected.length}
                            order={order}
                            orderBy={orderBy}
                            onSelectAllClick={handleSelectAllClick}
                            onRequestSort={handleRequestSort}
                            rowCount={jobs.length}
                            onDeleteSelectionClick={handleDeleteSelection}
                        />
                        
                        <TableBody>
                            {formattedJobs.sort(getComparator(order, orderBy))
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row, index) => {
                                    return(<Row job={row} index={index}/>)
                                })}
                                {emptyRows > 0 && (
                                    <TableRow
                                    style={{
                                        height: (dense ? 33 : 53) * emptyRows,
                                    }}
                                    >
                                    <TableCell colSpan={6} />
                                    </TableRow>
                                )}
                        </TableBody>

                    </Table>
                
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={jobs.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    ActionsComponent={TablePaginationActions}
            />
    </Box>
);
}