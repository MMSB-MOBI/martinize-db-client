import React from 'react';
import { WaitForLoginFinish } from '../LoginWaiter/LoginWaiter';
import RouterCmpt from '../Router';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import Settings from '../../Settings';
import { useMediaQuery, CssBaseline } from '@material-ui/core';

const Root = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: prefersDarkMode ? 'dark' : 'light',
          background: {
            default: prefersDarkMode ? '#303030' : '#fafafa',
          },
        },
      }),
    [prefersDarkMode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WaitForLoginFinish component={RouterCmpt} wait={[Settings.login_promise, Settings.martinize_variables_promise]} />
    </ThemeProvider>
  );
}

export default Root;
