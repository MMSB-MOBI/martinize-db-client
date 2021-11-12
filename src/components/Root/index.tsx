import React from 'react';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import { CssBaseline } from '@material-ui/core';
import Toaster from '../Toaster';
import RouterCmpt from '../Router';

const Root = () => {
  const prefersDarkMode = false; // useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(
    () =>
      createTheme({
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
