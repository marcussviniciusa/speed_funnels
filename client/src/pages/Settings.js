import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  Divider,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { 
  Save as SaveIcon,
  AccountCircle as AccountIcon,
  Notifications as NotificationsIcon,
  Link as LinkIcon
} from '@mui/icons-material';

import AccountSettings from '../components/settings/AccountSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import IntegrationSettings from '../components/settings/IntegrationSettings';
import settingsService from '../services/settingsService';

const Settings = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState({
    account: false,
    notifications: false,
    integrations: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [accountSettings, setAccountSettings] = useState({});
  const [notificationSettings, setNotificationSettings] = useState({});
  const [integrations, setIntegrations] = useState({});

  const fetchSettings = async () => {
    setError('');
    
    try {
      // Carregar configurações da conta
      setLoading(prev => ({ ...prev, account: true }));
      const accountData = await settingsService.getAccountSettings();
      setAccountSettings(accountData);
      setLoading(prev => ({ ...prev, account: false }));
      
      // Carregar configurações de notificações
      setLoading(prev => ({ ...prev, notifications: true }));
      const notificationData = await settingsService.getNotificationSettings();
      setNotificationSettings(notificationData);
      setLoading(prev => ({ ...prev, notifications: false }));
      
      // Carregar integrações
      setLoading(prev => ({ ...prev, integrations: true }));
      const integrationsData = await settingsService.getIntegrations();
      setIntegrations(integrationsData);
      setLoading(prev => ({ ...prev, integrations: false }));
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      setError('Falha ao carregar as configurações. Por favor, tente novamente.');
      setLoading({
        account: false,
        notifications: false,
        integrations: false
      });
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSaveAccountSettings = async (settings) => {
    setLoading(prev => ({ ...prev, account: true }));
    setError('');
    setSuccess('');
    
    try {
      const updatedSettings = await settingsService.saveAccountSettings(settings);
      setAccountSettings(updatedSettings);
      setSuccess('Configurações da conta salvas com sucesso!');
      
      // Limpar a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
      return Promise.resolve(updatedSettings);
    } catch (err) {
      console.error('Erro ao salvar configurações da conta:', err);
      setError('Falha ao salvar as configurações da conta. Por favor, tente novamente.');
      return Promise.reject(err);
    } finally {
      setLoading(prev => ({ ...prev, account: false }));
    }
  };

  const handleSaveNotificationSettings = async (settings) => {
    setLoading(prev => ({ ...prev, notifications: true }));
    setError('');
    setSuccess('');
    
    try {
      const updatedSettings = await settingsService.saveNotificationSettings(settings);
      setNotificationSettings(updatedSettings);
      setSuccess('Configurações de notificações salvas com sucesso!');
      
      // Limpar a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Erro ao salvar configurações de notificações:', err);
      setError('Falha ao salvar as configurações de notificações. Por favor, tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }));
    }
  };

  const handleSaveIntegration = async (integrationType, integrationData) => {
    setLoading(prev => ({ ...prev, integrations: true }));
    setError('');
    setSuccess('');
    
    try {
      const updatedIntegration = await settingsService.saveIntegration(integrationType, integrationData);
      setIntegrations(prev => ({
        ...prev,
        [integrationType]: updatedIntegration
      }));
      setSuccess(`Integração ${integrationType} salva com sucesso!`);
      
      // Limpar a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error(`Erro ao salvar integração ${integrationType}:`, err);
      setError(`Falha ao salvar a integração ${integrationType}. Por favor, tente novamente.`);
    } finally {
      setLoading(prev => ({ ...prev, integrations: false }));
    }
  };

  const handleDeleteIntegration = async (integrationType) => {
    setLoading(prev => ({ ...prev, integrations: true }));
    setError('');
    setSuccess('');
    
    try {
      await settingsService.deleteIntegration(integrationType);
      setIntegrations(prev => {
        const newIntegrations = { ...prev };
        delete newIntegrations[integrationType];
        return newIntegrations;
      });
      setSuccess(`Integração ${integrationType} removida com sucesso!`);
      
      // Limpar a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error(`Erro ao remover integração ${integrationType}:`, err);
      setError(`Falha ao remover a integração ${integrationType}. Por favor, tente novamente.`);
    } finally {
      setLoading(prev => ({ ...prev, integrations: false }));
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Configurações
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 4 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="settings tabs"
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<AccountIcon />} label="Conta" iconPosition="start" />
          <Tab icon={<NotificationsIcon />} label="Notificações" iconPosition="start" />
          <Tab icon={<LinkIcon />} label="Integrações" iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {/* Tab de Conta */}
          {tabValue === 0 && (
            <AccountSettings 
              settings={accountSettings} 
              onSave={handleSaveAccountSettings}
              loading={loading.account}
            />
          )}

          {/* Tab de Notificações */}
          {tabValue === 1 && (
            <NotificationSettings 
              settings={notificationSettings}
              onSave={handleSaveNotificationSettings}
              loading={loading.notifications}
            />
          )}

          {/* Tab de Integrações */}
          {tabValue === 2 && (
            <IntegrationSettings 
              integrations={integrations}
              onSave={handleSaveIntegration}
              onDelete={handleDeleteIntegration}
              loading={loading.integrations}
            />
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Settings;
