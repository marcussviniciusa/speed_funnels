import React from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Paper,
  Typography
} from '@mui/material';
import { 
  Facebook as FacebookIcon,
  Google as GoogleIcon,
  Settings as SettingsIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

const IntegrationsMenu = () => {
  const location = useLocation();
  
  // Lista de integrações disponíveis
  const integrations = [
    {
      name: 'Facebook Ads',
      icon: <FacebookIcon color="primary" />,
      path: '/settings/integrations/facebook',
      description: 'Conecte-se ao Facebook Ads para analisar suas campanhas'
    },
    {
      name: 'Google Analytics',
      icon: <GoogleIcon style={{ color: '#4285F4' }} />,
      path: '/settings/integrations/google',
      description: 'Conecte-se ao Google Analytics para monitorar seu site'
    }
  ];
  
  return (
    <Paper elevation={2} sx={{ mb: 3 }}>
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <SettingsIcon sx={{ mr: 1 }} />
          Integrações Disponíveis
        </Typography>
      </Box>
      <List>
        {integrations.map((integration, index) => (
          <React.Fragment key={integration.path}>
            <ListItem 
              button
              component={Link}
              to={integration.path}
              selected={location.pathname === integration.path}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'action.selected',
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  }
                }
              }}
            >
              <ListItemIcon>
                {integration.icon}
              </ListItemIcon>
              <ListItemText 
                primary={integration.name} 
                secondary={integration.description}
              />
              <ArrowForwardIcon fontSize="small" color="action" />
            </ListItem>
            {index < integrations.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default IntegrationsMenu;
