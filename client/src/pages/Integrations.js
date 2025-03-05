import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import IntegrationSettings from '../components/settings/IntegrationSettings';
import DirectMetaConnect from '../components/integration/DirectMetaConnect';
import integrationService from '../services/integrationService';

/**
 * Página de gerenciamento de integrações
 */
const Integrations = () => {
  const [integrations, setIntegrations] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Carregar integrações existentes
  useEffect(() => {
    fetchIntegrations();
  }, []);

  // Buscar integrações da API
  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await integrationService.getIntegrations();
      setIntegrations(response.data.data);
    } catch (err) {
      console.error('Erro ao carregar integrações:', err);
      setError('Não foi possível carregar as integrações. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Iniciar processo de integração com Meta
  const handleMetaIntegration = async () => {
    try {
      setSaving(true);
      const response = await integrationService.startMetaIntegration();
      // Redirecionar para a URL de autorização do Meta
      window.location.href = response.data.authUrl;
    } catch (err) {
      console.error('Erro ao iniciar integração com Meta:', err);
      setError('Não foi possível iniciar a integração com Meta. Por favor, tente novamente.');
      setSaving(false);
    }
  };

  // Iniciar processo de integração com Google
  const handleGoogleIntegration = async () => {
    try {
      setSaving(true);
      const response = await integrationService.startGoogleIntegration();
      // Redirecionar para a URL de autorização do Google
      window.location.href = response.data.authUrl;
    } catch (err) {
      console.error('Erro ao iniciar integração com Google:', err);
      setError('Não foi possível iniciar a integração com Google. Por favor, tente novamente.');
      setSaving(false);
    }
  };

  // Salvar configurações de integração
  const handleSaveIntegration = async (platform, data) => {
    try {
      setSaving(true);
      
      // Iniciar o processo de autorização OAuth se necessário
      if (platform === 'facebook' && data.enabled) {
        await handleMetaIntegration();
        return;
      } else if (platform === 'google' && data.enabled) {
        await handleGoogleIntegration();
        return;
      }
      
      // Para desativar, chamamos a API de desativação
      if (!data.enabled) {
        await integrationService.disableIntegration(
          platform === 'facebook' ? 'meta' : platform
        );
        await fetchIntegrations();
        setSuccess(`Integração com ${platform === 'facebook' ? 'Meta' : 'Google'} desativada com sucesso.`);
      }
    } catch (err) {
      console.error(`Erro ao salvar integração ${platform}:`, err);
      setError(`Não foi possível salvar as configurações de ${platform}. Por favor, tente novamente.`);
    } finally {
      setSaving(false);
    }
  };

  // Excluir uma integração
  const handleDeleteIntegration = async (platform) => {
    try {
      setSaving(true);
      await integrationService.disableIntegration(
        platform === 'facebook' ? 'meta' : platform
      );
      await fetchIntegrations();
      setSuccess(`Integração com ${platform === 'facebook' ? 'Meta' : 'Google'} removida com sucesso.`);
    } catch (err) {
      console.error(`Erro ao excluir integração ${platform}:`, err);
      setError(`Não foi possível excluir a integração com ${platform}. Por favor, tente novamente.`);
    } finally {
      setSaving(false);
    }
  };

  // Fechar alertas
  const handleCloseAlert = () => {
    setError(null);
    setSuccess(null);
  };

  // Manipular mudança de tab
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Manipular sucesso na conexão direta com o Meta
  const handleDirectMetaSuccess = (data) => {
    setSuccess(`Conexão com Meta Ads realizada com sucesso para a conta ${data.accountName}`);
    fetchIntegrations();
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Integrações
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Configure as integrações com plataformas de marketing para importar dados e gerar relatórios.
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="integration tabs">
                <Tab label="Integrações OAuth" />
                <Tab label="Conexão Direta" />
              </Tabs>
            </Box>

            {activeTab === 0 ? (
              <Paper elevation={2} sx={{ p: 3 }}>
                <IntegrationSettings 
                  integrations={integrations}
                  onSave={handleSaveIntegration}
                  onDelete={handleDeleteIntegration}
                  loading={saving}
                />
              </Paper>
            ) : (
              <Box>
                <DirectMetaConnect 
                  companyId="1" 
                  onSuccess={handleDirectMetaSuccess}
                />
              </Box>
            )}
          </>
        )}

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            component={RouterLink} 
            to="/dashboard" 
            variant="outlined" 
            sx={{ mr: 2 }}
          >
            Voltar para Dashboard
          </Button>
        </Box>
      </Box>

      {/* Alertas */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Integrations;
