import { FC } from 'react';
import { CssBaseline } from '@mui/material';
import { createTheme, responsiveFontSizes, ThemeProvider } from '@mui/material/styles';
import { RequiredChildrenProps } from './utils';

// Tema SCADA / Cyber-Industrial v3.0
const theme = responsiveFontSizes(
  createTheme({
    palette: {
      mode: 'dark',
      background: {
        default: '#0a0f1d',
        paper: '#111827',
      },
      primary: {
        main: '#38bdf8', // Sky Blue
        light: '#7dd3fc',
        dark: '#0284c7',
      },
      secondary: {
        main: '#34d399', // Emerald
      },
      info: {
        main: '#38bdf8',
      },
      warning: {
        main: '#fbbf24',
      },
      error: {
        main: '#f87171',
      },
      success: {
        main: '#4ade80',
      },
      text: {
        primary: '#f8fafc',
        secondary: '#94a3b8',
      }
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      button: {
        textTransform: 'none',
        fontWeight: 700,
      }
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          }
        }
      }
    }
  })
);

const CustomTheme: FC<RequiredChildrenProps> = ({ children }) => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    {children}
  </ThemeProvider>
);

export default CustomTheme;
