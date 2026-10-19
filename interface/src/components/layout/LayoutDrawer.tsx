import { FC, useState, useEffect } from 'react';
import { Box, Divider, Drawer, Toolbar, Typography } from '@mui/material';
import { Waves } from 'lucide-react';

import LayoutMenu from './LayoutMenu';
import { DRAWER_WIDTH } from './Layout';
import * as DemoApi from '../../project/api';

interface LayoutDrawerProps {
  mobileOpen: boolean;
  onClose: () => void;
}

const LayoutDrawer: FC<LayoutDrawerProps> = ({ mobileOpen, onClose }) => {
  const [tankName, setTankName] = useState(() => localStorage.getItem('tank_device_name') || 'Tanque Frente');

  useEffect(() => {
    DemoApi.readBrokerSettings()
      .then(res => {
        if (res.data?.name) {
          setTankName(res.data.name);
          localStorage.setItem('tank_device_name', res.data.name);
        }
      })
      .catch(() => {});
  }, []);

  const drawer = (
    <>
      <Toolbar disableGutters sx={{ minHeight: '64px !important', px: 2 }}>
        <Box display="flex" alignItems="center" gap={1.5} width="100%">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
              flexShrink: 0
            }}
          >
            <Waves size={22} />
          </Box>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 800, 
                lineHeight: 1.2, 
                color: 'text.primary',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden'
              }}
            >
              {tankName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.5 }}>
              SCADA v3.0
            </Typography>
          </Box>
        </Box>
        <Divider absolute />
      </Toolbar>
      <Divider />
      <LayoutMenu />
    </>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default LayoutDrawer;
