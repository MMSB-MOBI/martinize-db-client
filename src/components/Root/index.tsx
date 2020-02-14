import React from 'react';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { useMediaQuery, CssBaseline } from '@material-ui/core';
import Toaster from '../Toaster';
import RouterCmpt from '../Router';

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
      <RouterCmpt />
      <Toaster />
    </ThemeProvider>
  );
}

export default Root;
