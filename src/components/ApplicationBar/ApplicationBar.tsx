import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuIcon from '@material-ui/icons/Menu';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles, useTheme, Theme, createStyles } from '@material-ui/core/styles';
import { RouteComponentProps, Link } from 'react-router-dom';
import { DrawerContentRouter } from '../Router';
import { Icon, Dialog, DialogTitle, DialogContent, DialogActions, Button, DialogContentText, ListItemAvatar, Avatar } from '@material-ui/core';
import Settings, { LoginStatus } from '../../Settings';
import { Badge } from '@material-ui/core';
import PersonIcon from '@material-ui/icons/Person';
import ApiHelper from '../../ApiHelper';
import { toast } from '../Toaster';
import { errorToText } from '../../helpers';
import { Citation, TutorialShow } from '../../Shared';
import Box from '@mui/system/Box';

//import { WarnBeta } from '../WarnBeta';

const drawerWidth = 240;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
    },
    drawer: {
      [theme.breakpoints.up('sm')]: {
        width: drawerWidth,
        flexShrink: 0,
      },
    },
    menuButton: {
      marginRight: theme.spacing(2),
      [theme.breakpoints.up('sm')]: {
        display: 'none',
      },
    },
    appBar: { // The logo section, top banner
      zIndex: theme.zIndex.drawer + 1,
      backgroundColor: '#e4ebf2', //'#dae4f5',//"#e8ecf3",
      color: 'black',
      //minHeight:75,
      justifyContent:"space-between"
    },
    toolbar: { ...theme.mixins.toolbar, 
      marginTop:120}, // The tutorial banner
    drawerPaper: { // The left panel
      marginTop:'-60px',
      backgroundColor: 'whitesmoke',
      width: drawerWidth,
      borderRight: 'none',
    },
    content: {
      flexGrow: 1,
    },
    ppHeader: {

    },/*
    logo: {
      maxWidth: 40,
      marginRight: '10px'
    },
    title: {
      flexGrow: 1,
      textAlign: "center"
    },*/
  }),
);

interface DrawerElement {
  static?:boolean;
  path?: string;
  link?: boolean;
  icon?: string;
  text?: string;
  condition?: boolean;
  count?: Countable;
  font?: number | "-moz-initial" | "inherit" | "initial" | "revert" | "unset" | "normal" | "bold" | "bolder" | "lighter";
  render?: () => JSX.Element;
  children?: React.ReactNode;
}

type Countable = "molecules" | "users"

function BadgedIcon(props: {
  icon: string | undefined,
  toCount: Countable
}) {
  const [count, setCount] = React.useState(0);


  React.useEffect(() => {
    const request_url = props.toCount === "molecules" ? 'moderation/list' : 'user/list/waiting'
    ApiHelper.request(request_url)
      .then(answer => {
        setCount(answer.length)
      })
      .catch(e => {
        console.error(e)
        toast(errorToText(e));
      })
  }, [])

  return (
    <Badge overlap="rectangular" badgeContent={count} color="secondary" >
      <Icon className={"fas fa-" + props.icon} />
    </Badge>)
}

function DrawerElements(props: RouteComponentProps) {

  const elements: DrawerElement[][] = [
    [
      {
        path: '/explore',
        link: true,
        icon: "compass",
        text: "Explore",
        font: "bold"
      },
      {
        path: '/builder',
        link: true,
        icon: 'atom',
        text: 'Molecule builder',
        //condition: !!Settings.logged,
        font: "bold"
      },
      {
        path: '/membrane_builder',
        link: true,
        icon: 'virus',
        text: 'System builder',
        //condition: !!Settings.logged,
        font: "bold"
      },
      {
        path: '/force_fields',
        link: true,
        icon: "download",
        text: "Force fields",
        font: "bold"
      },
      {
        path: '/polymer',
        link: true,
        icon: 'draw-polygon',
        text: 'Polymer Editor',
        condition: Settings.logged === LoginStatus.Admin || Settings.logged === LoginStatus.Dev,
        font: "bold"
      },
      {
        /*path: '/tutorial/',
        link: true,*/
        static: true,
        icon: "graduation-cap",
        text: "Tutorials",
        font: "bold"
      },
    ],
    [
      {
        path: '/submissions',
        link: true,
        icon: "file-import",
        text: "My submissions",
        condition: !!Settings.logged,
      },
      {
        path: '/history',
        link: true,
        icon: "history",
        text: "My builder history",
        condition: !!Settings.logged
      },
      {
        path: '/settings',
        link: true,
        icon: "cog",
        text: "Settings",
        condition: !!Settings.logged,
      },
      {
        path: '/moderation',
        link: true,
        icon: "inbox",
        text: `Moderation`,
        condition: Settings.logged === LoginStatus.Admin,
        count: "molecules"
      },
      {
        path: '/users',
        link: true,
        icon: "user",
        text: "Users",
        condition: Settings.logged === LoginStatus.Admin,
        count: "users"
      },
    ],
    [
      {
        render: LogOutDialog,
        condition: !!Settings.logged,
      },
      {
        path: '/login',
        link: true,
        icon: "sign-in-alt",
        text: "Login",
        condition: !Settings.logged,
      },
    ],
    [
      {
        path: '/contact',
        link: true,
        icon: "envelope",
        text: "Contact"
      },
      {
        path: '/citation',
        link: true,
        icon: "book",
        text: "Citation"
      },
    ],
  ];

  let compiled: JSX.Element[] = [];
  let i = 0;
  for (const list of elements) {
    const list_elements: JSX.Element[] = [];

    for (const e of list) {
      if (typeof e.condition === "boolean" && !e.condition)
        continue;

      if (e.render) {
        list_elements.push(<e.render key={i} />);
        i++;
        continue;
      }
      console.log("ADDIN G KEY", i);
      list_elements.push(
          e.static ? 
          <a style={{ all:'unset'}} href="/tutorial">
          <ListItem
           button
            key={i}
            selected={props.location.pathname === e.path}
            style={{ fontWeight: 600 }}
          >
            <ListItemIcon>
          <Icon className={"fas fa-" + e.icon} style={{ color: e.font ? 'black' : '' }} />
      
        </ListItemIcon>
        <ListItemText primary={<Typography style={{ fontWeight: e.font ? e.font : 'normal' }}>{e.text}</Typography>} />
      </ListItem>
         </a>
          :
        <ListItem
          button
          key={i}
          component={e.link ? Link : "div"}
          to={e.path}
          selected={props.location.pathname === e.path}
          style={{ fontWeight: 600 }}

        >
          <ListItemIcon>
            {e.count ?
              <BadgedIcon icon={e.icon} toCount={e.count} /> :
              <Icon className={"fas fa-" + e.icon} style={{ color: e.font ? 'black' : '' }} />
            }
          </ListItemIcon>
          <ListItemText primary={<Typography style={{ fontWeight: e.font ? e.font : 'normal' }}>{e.text}</Typography>} />
        </ListItem>
      );
      i++;
    }

    if (list_elements.length) {
      compiled.push(...list_elements, <Divider key={i} />);
      i++;
    }
  }

  compiled.pop();

  return <React.Fragment>
    {compiled}
  </React.Fragment>;
}

export default function ApplicationDrawer(props: RouteComponentProps) {
  const classes = useStyles();
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <div className={classes.toolbar} />
      {Settings.user && <ListItem className={classes.ppHeader}>
        <ListItemAvatar>
          <Avatar>
            <PersonIcon />
          </Avatar>
        </ListItemAvatar>
        {/* FAIRE UNE ONE LIGNE DEGEUE AVEC PLUSIEUR IF JUSTE POUR AFFICHER UNE MAJUSCULE !! J'ADORE MON TTRAVAIL !! Ca va prendre 2h pour rien */}
        <ListItemText primary={Settings.user.name} secondary={Settings.user.role} />
      </ListItem>}

      <DrawerElements {...props} />
    </div>
  );

  const styles = {
    customizeToolbar: {
      minHeight: "100px",
      //marginBottom:"-50px"
    }
  };
  const leftStyle = [

  ]
  

  return (
    <div className={classes.root}>
      {/* App bar */}
      <AppBar position="fixed" className={classes.appBar} elevation={0}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            className={classes.menuButton}
          >
          
          <MenuIcon />
          </IconButton>
          <AppBarContent />
         
        </Toolbar>
      </AppBar>
      {/* Drawer */}
      <nav className={classes.drawer}>
        <Hidden smUp implementation="css">
          <Drawer
            variant="temporary"
            anchor={theme.direction === 'rtl' ? 'right' : 'left'}
            open={mobileOpen}
            onClose={handleDrawerToggle}
            classes={{
              paper: classes.drawerPaper,
            }}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
          >
            {drawer}
          </Drawer>
        </Hidden>
        <Hidden xsDown implementation="css">
          <Drawer
            classes={{
              paper: classes.drawerPaper,
            }}
            variant="permanent"
            open
          >
            {drawer}
          </Drawer>
        </Hidden>
      </nav>

      {/* Main content */}
      <main className={classes.content}>
        <div className={classes.toolbar} />
      {/*     <TutorialShow />   */}
        <DrawerContentRouter {...props} />
      </main>
    </div>
  );
}

function AppBarContent() {
  const [title, setTitle] = React.useState('MArtini Database');

  function onTitleChange(e: CustomEvent<string>) {
    setTitle(e.detail);
  }

  React.useEffect(() => {
    // @ts-ignore
    window.addEventListener('app-bar.title-change', onTitleChange);

    return function () {
      // @ts-ignore
      window.removeEventListener('app-bar.title-change', onTitleChange);
    };
    }, []);
   
 return (
  <Typography variant="h6" style={{ marginLeft:'200px' }}>
    <img src="/assets/logo-large.png" alt="MAD LOGO" style={{ height :'110px'}}/>
  </Typography>
 )
}

  /*
  return  (
    <Box
    component="img"
  sx={{
    height: 100,
   }}
  alt="The house from the offer."
  src="/assets/logo.png"
/>
  )*/

function LogOutDialog() {
  const [open, setOpen] = React.useState(false);

  return (
    <React.Fragment>
      <ListItem button onClick={() => setOpen(true)}>
        <ListItemIcon>
          <Icon className={"fas fa-sign-out-alt"} />
        </ListItemIcon>
        <ListItemText primary="Logout" />
      </ListItem>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>
          Logout ?
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            You will be logged out and you must login again to see your submissions and send new molecules. Do you want to continue ?
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button color="primary" autoFocus onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button color="secondary" onClick={async () => { await Settings.unlog(); setOpen(false); window.location.pathname = "/"; }}>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
