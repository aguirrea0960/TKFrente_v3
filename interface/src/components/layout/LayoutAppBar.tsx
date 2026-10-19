import { FC, useContext } from 'react';
import { AppBar, Box, IconButton, Toolbar, Typography, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

import { FeaturesContext } from '../../contexts/features';
import { useThemeMode } from '../../CustomTheme';
import LayoutAuthMenu from './LayoutAuthMenu';

export const DRAWER_WIDTH = 280;

interface LayoutAppBarProps {
  title: string;
  onToggleDrawer: () => void;
}

const LayoutAppBar: FC<LayoutAppBarProps> = ({ title, onToggleDrawer }) => {
  const { features } = useContext(FeaturesContext);
  const { mode, toggleTheme } = useThemeMode();

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { md: `${DRAWER_WIDTH}px` },
        boxShadow: 'none',
        bgcolor: mode === 'dark' ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        color: mode === 'dark' ? '#f8fafc' : '#0f172a',
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onToggleDrawer}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
          {title}
        </Typography>
        <Box flexGrow={1} />

        {/* BOTÓN TOGGLE DARK / LIGHT THEME */}
        <Tooltip title={mode === 'dark' ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}>
          <IconButton
            onClick={toggleTheme}
            color="inherit"
            sx={{
              mr: 1,
              bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              '&:hover': {
                bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
              }
            }}
          >
            {mode === 'dark' ? (
              <LightModeIcon sx={{ color: '#fbbf24' }} />
            ) : (
              <DarkModeIcon sx={{ color: '#6366f1' }} />
            )}
          </IconButton>
        </Tooltip>

        {features.security && <LayoutAuthMenu />}
      </Toolbar>
    </AppBar>
  );
};

export default LayoutAppBar;
