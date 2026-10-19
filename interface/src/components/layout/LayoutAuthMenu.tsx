import React, { FC, useContext } from "react";
import { Box, Button, Divider, Popover, Typography, Avatar, styled, TypographyProps } from '@mui/material';
import PersonIcon from "@mui/icons-material/Person";

import { AuthenticatedContext } from "../../contexts/authentication";

const ItemTypography = styled(Typography)<TypographyProps>({
  maxWidth: '250px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const LayoutAuthMenu: FC = () => {
  const { me, signOut } = useContext(AuthenticatedContext);

  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'app-menu-popover' : undefined;

  return (
    <>
      <Box 
        display="flex" 
        alignItems="center" 
        gap={1.2} 
        sx={{ 
          cursor: 'pointer',
          py: 0.6,
          px: 1.5,
          borderRadius: 2,
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
          border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)'}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.14)',
            borderColor: 'rgba(255, 255, 255, 0.3)'
          }
        }}
        onClick={handleClick}
        id="open-auth-menu"
      >
        <Typography 
          variant="body2" 
          sx={{ 
            color: (theme) => theme.palette.mode === 'dark' ? '#f8fafc' : '#0f172a', 
            fontWeight: 700, 
            letterSpacing: '0.02em',
            userSelect: 'none'
          }}
        >
          {me?.username || 'admin'}
        </Typography>
        <Avatar 
          sx={{ 
            width: 28, 
            height: 28, 
            bgcolor: me?.admin ? '#38bdf8' : '#94a3b8',
            color: '#0f172a',
            fontWeight: 800
          }}
        >
          <PersonIcon sx={{ fontSize: 18 }} />
        </Avatar>
      </Box>

      <Popover
        id="app-menu-popover"
        sx={{ mt: 1.5 }}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box display="flex" flexDirection="row" alignItems="center" p={2} sx={{ minWidth: 220 }}>
          <Avatar sx={{ width: 52, height: 52, bgcolor: me?.admin ? '#38bdf8' : '#94a3b8', color: '#0f172a', mr: 2 }}>
            <PersonIcon fontSize="large" />
          </Avatar>
          <Box>
            <ItemTypography variant="h6" sx={{ fontWeight: 700 }}>
              {me?.username || 'admin'}
            </ItemTypography>
            <ItemTypography variant="body2" color="text.secondary">
              {me?.admin ? "Usuario Administrador" : "Usuario Estándar"}
            </ItemTypography>
          </Box>
        </Box>
        <Divider />
        <Box p={1.5}>
          <Button variant="contained" fullWidth color="primary" onClick={() => signOut(true)}>
            Cerrar Sesión
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default LayoutAuthMenu;
