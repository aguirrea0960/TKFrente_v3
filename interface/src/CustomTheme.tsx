import { FC, createContext, useContext, useState, useMemo } from 'react';
import { CssBaseline } from '@mui/material';
import { createTheme, responsiveFontSizes, ThemeProvider } from '@mui/material/styles';
import { RequiredChildrenProps } from './utils';

type ThemeMode = 'dark' | 'light';

interface ThemeModeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

export const ThemeModeContext = createContext<ThemeModeContextType>({
  mode: 'dark',
  toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeModeContext);

const CustomTheme: FC<RequiredChildrenProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('appThemeMode');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('appThemeMode', next);
      return next;
    });
  };

  const theme = useMemo(() => {
    const isDark = mode === 'dark';
    return responsiveFontSizes(
      createTheme({
        palette: {
          mode,
          background: {
            default: isDark ? '#0a0f1d' : '#f1f5f9',
            paper: isDark ? '#111827' : '#ffffff',
          },
          primary: {
            main: '#0284c7', // Sky / Cyan
            light: '#38bdf8',
            dark: '#0369a1',
          },
          secondary: {
            main: '#10b981', // Emerald
          },
          info: {
            main: '#0ea5e9',
          },
          warning: {
            main: '#f59e0b',
          },
          error: {
            main: '#ef4444',
          },
          success: {
            main: '#10b981',
          },
          text: {
            primary: isDark ? '#f8fafc' : '#0f172a',
            secondary: isDark ? '#94a3b8' : '#64748b',
          },
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          button: {
            textTransform: 'none',
            fontWeight: 700,
          },
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
              },
            },
          },
        },
      })
    );
  }, [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export default CustomTheme;
