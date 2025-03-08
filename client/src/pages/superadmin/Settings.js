import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Divider,
  Switch,
  FormControlLabel,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Backup as BackupIcon,
} from '@mui/icons-material';
import SuperadminSidebar from '../../components/superadmin/SuperadminSidebar';
import api from '../../services/api';
import { useSnackbar } from 'notistack';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [loadingBackup, setLoadingBackup] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  
  const [settings, setSettings] = useState({
    enableUserRegistration: true,
    requireEmailVerification: true,
    maxCompaniesPerUser: 5,
    maxUsersPerCompany: 20,
    sessionTimeout: 60, // minutos
    defaultUserRole: 'user',
    auditLogEnabled: true,
    auditLogRetention: 90, // dias
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      // Simulando uma chamada de API, já que não implementamos o endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      enqueueSnackbar('Configurações salvas com sucesso', { variant: 'success' });
    } catch (error) {
      console.error('Error saving settings:', error);
      enqueueSnackbar('Erro ao salvar configurações', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setLoadingBackup(true);
      // Simulando uma chamada de API para backup
      await new Promise(resolve => setTimeout(resolve, 2000));
      enqueueSnackbar('Backup criado com sucesso', { variant: 'success' });
    } catch (error) {
      console.error('Error creating backup:', error);
      enqueueSnackbar('Erro ao criar backup', { variant: 'error' });
    } finally {
      setLoadingBackup(false);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <SuperadminSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h1" gutterBottom>
            Configurações do Sistema
          </Typography>
          <Typography variant="subtitle1" gutterBottom color="text.secondary">
            Configurações avançadas disponíveis apenas para superadmins
          </Typography>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SecurityIcon sx={{ mr: 2 }} color="primary" />
                  <Typography variant="h6">Segurança e Acesso</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.enableUserRegistration}
                          onChange={handleChange}
                          name="enableUserRegistration"
                          color="primary"
                        />
                      }
                      label="Permitir auto-registro de usuários"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.requireEmailVerification}
                          onChange={handleChange}
                          name="requireEmailVerification"
                          color="primary"
                        />
                      }
                      label="Exigir verificação de email"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="sessionTimeout"
                      label="Tempo de sessão (minutos)"
                      type="number"
                      fullWidth
                      value={settings.sessionTimeout}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="defaultUserRole"
                      label="Papel padrão para novos usuários"
                      select
                      fullWidth
                      value={settings.defaultUserRole}
                      onChange={handleChange}
                      SelectProps={{
                        native: true,
                      }}
                    >
                      <option value="user">Usuário Regular</option>
                      <option value="admin">Admin</option>
                    </TextField>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <StorageIcon sx={{ mr: 2 }} color="primary" />
                  <Typography variant="h6">Limites e Cotas</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="maxCompaniesPerUser"
                      label="Máximo de empresas por usuário"
                      type="number"
                      fullWidth
                      value={settings.maxCompaniesPerUser}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="maxUsersPerCompany"
                      label="Máximo de usuários por empresa"
                      type="number"
                      fullWidth
                      value={settings.maxUsersPerCompany}
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BackupIcon sx={{ mr: 2 }} color="primary" />
                  <Typography variant="h6">Auditoria e Backup</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.auditLogEnabled}
                          onChange={handleChange}
                          name="auditLogEnabled"
                          color="primary"
                        />
                      }
                      label="Ativar logs de auditoria"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="auditLogRetention"
                      label="Retenção de logs (dias)"
                      type="number"
                      fullWidth
                      value={settings.auditLogRetention}
                      onChange={handleChange}
                      disabled={!settings.auditLogEnabled}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={loadingBackup ? <CircularProgress size={20} /> : <BackupIcon />}
                      onClick={handleCreateBackup}
                      disabled={loadingBackup}
                      sx={{ mt: 2 }}
                    >
                      {loadingBackup ? 'Criando backup...' : 'Criar backup do banco de dados'}
                    </Button>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSaveSettings}
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Settings;
