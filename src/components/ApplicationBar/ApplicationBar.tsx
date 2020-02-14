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
import { Icon, Dialog, DialogTitle, DialogContent, DialogActions, Button, DialogContentText } from '@material-ui/core';
import Settings, { LoginStatus } from '../../Settings';

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
    appBar: {
      zIndex: theme.zIndex.drawer + 1,
      backgroundColor: "#e8ecf3",
      color: 'black',
    },
    toolbar: theme.mixins.toolbar,
    drawerPaper: {
      width: drawerWidth,
      borderRight: 'none',
    },
    content: {
      flexGrow: 1,
    },
  }),
);

interface DrawerElement {
  path?: string;
  link?: boolean;
  icon?: string;
  text?: string;
  condition?: boolean;
  render?: () => JSX.Element;
}

function DrawerElements(props: RouteComponentProps) {
  const elements: DrawerElement[][] = [
    [
      {
        path: '/explore',
        link: true,
        icon: "compass",
        text: "Explore",
      },
      {
        path: '/submissions',
        link: true,
        icon: "file-import",
        text: "My submissions",
        condition: !!Settings.logged,
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
        text: "Moderation",
        condition: Settings.logged === LoginStatus.Admin,
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
      }
    ]
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

      list_elements.push(
        <ListItem 
          button 
          key={i} 
          component={e.link ? Link : "div"} 
          to={e.path}
          selected={props.location.pathname === e.path}
        >
          <ListItemIcon>
            <Icon className={"fas fa-" + e.icon} />
          </ListItemIcon>
          <ListItemText primary={e.text} />
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

  return <React.Fragment>{compiled}</React.Fragment>;
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
      <DrawerElements {...props} />
    </div>
  );

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
        
        <DrawerContentRouter {...props} />
      </main>
    </div>
  );
}

function AppBarContent() {
  const [title, setTitle] = React.useState('Martinize Database');

  function onTitleChange(e: CustomEvent<string>) {
    setTitle(e.detail);
  }
  
  React.useEffect(() => {
    // @ts-ignore
    window.addEventListener('app-bar.title-change', onTitleChange);

    return function() {
      // @ts-ignore
      window.removeEventListener('app-bar.title-change', onTitleChange);
    };
  }, []);

  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <Typography variant="h6" noWrap style={{ fontWeight: 200, fontSize: '1.7rem' }}>
        {title}
      </Typography>
    </div>
  );
}

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

      <Dialog open={open}>
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
          <Button color="secondary" onClick={() => { Settings.unlog(); setOpen(false); window.location.pathname = "/"; }}>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
