import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  FormGroup,
  FormControl,
  FormLabel
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

/**
 * Componente para configurações de notificações
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.settings - Configurações de notificações
 * @param {Function} props.onSave - Função chamada ao salvar as configurações
 * @param {boolean} props.loading - Indica se o componente está carregando
 */
const NotificationSettings = ({ 
  settings = {}, 
  onSave,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    email: {
      enabled: true,
      reportCompleted: true,
      reportError: true,
      weeklyDigest: true,
      ...settings.email
    },
    push: {
      enabled: true,
      reportCompleted: true,
      reportError: true,
      ...settings.push
    }
  });

  // Manipula a alteração dos campos do formulário
  const handleChange = (channel, field, value) => {
    setFormData(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [field]: value
      }
    }));
  };

  // Manipula o envio do formulário
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Typography variant="h6" gutterBottom>
          Configurações de Notificações
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ mb: 4 }}>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend" sx={{ fontWeight: 'bold' }}>
              Notificações por Email
            </FormLabel>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.email.enabled}
                    onChange={(e) => handleChange('email', 'enabled', e.target.checked)}
                    disabled={loading}
                  />
                }
                label="Ativar notificações por email"
              />
            </FormGroup>
          </FormControl>
          
          <List disablePadding>
            <ListItem sx={{ pl: 4 }}>
              <ListItemText 
                primary="Relatório concluído" 
                secondary="Receba um email quando um relatório for concluído"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  checked={formData.email.reportCompleted}
                  onChange={(e) => handleChange('email', 'reportCompleted', e.target.checked)}
                  disabled={loading || !formData.email.enabled}
                />
              </ListItemSecondaryAction>
            </ListItem>
            
            <ListItem sx={{ pl: 4 }}>
              <ListItemText 
                primary="Erro no relatório" 
                secondary="Receba um email quando ocorrer um erro na geração de um relatório"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  checked={formData.email.reportError}
                  onChange={(e) => handleChange('email', 'reportError', e.target.checked)}
                  disabled={loading || !formData.email.enabled}
                />
              </ListItemSecondaryAction>
            </ListItem>
            
            <ListItem sx={{ pl: 4 }}>
              <ListItemText 
                primary="Resumo semanal" 
                secondary="Receba um resumo semanal das métricas e relatórios"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  checked={formData.email.weeklyDigest}
                  onChange={(e) => handleChange('email', 'weeklyDigest', e.target.checked)}
                  disabled={loading || !formData.email.enabled}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend" sx={{ fontWeight: 'bold' }}>
              Notificações Push
            </FormLabel>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.push.enabled}
                    onChange={(e) => handleChange('push', 'enabled', e.target.checked)}
                    disabled={loading}
                  />
                }
                label="Ativar notificações push"
              />
            </FormGroup>
          </FormControl>
          
          <List disablePadding>
            <ListItem sx={{ pl: 4 }}>
              <ListItemText 
                primary="Relatório concluído" 
                secondary="Receba uma notificação quando um relatório for concluído"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  checked={formData.push.reportCompleted}
                  onChange={(e) => handleChange('push', 'reportCompleted', e.target.checked)}
                  disabled={loading || !formData.push.enabled}
                />
              </ListItemSecondaryAction>
            </ListItem>
            
            <ListItem sx={{ pl: 4 }}>
              <ListItemText 
                primary="Erro no relatório" 
                secondary="Receba uma notificação quando ocorrer um erro na geração de um relatório"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  checked={formData.push.reportError}
                  onChange={(e) => handleChange('push', 'reportError', e.target.checked)}
                  disabled={loading || !formData.push.enabled}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </Box>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          >
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default NotificationSettings;
