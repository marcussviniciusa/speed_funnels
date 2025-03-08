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
import FacebookIntegration from '../components/integration/FacebookIntegration';
import FacebookSDK from '../components/integration/FacebookSDK';
import CompanySyncSelector from '../components/integration/CompanySyncSelector';
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
    
    // Verificar parâmetros da URL para mensagens de sucesso ou erro
    const queryParams = new URLSearchParams(window.location.search);
    const successParam = queryParams.get('success');
    const errorParam = queryParams.get('error');
    
    if (successParam) {
      setSuccess(decodeURIComponent(successParam));
      
      // Remover parâmetros da URL sem recarregar a página
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // Recarregar integrações para mostrar a nova conexão
      fetchIntegrations();
    }
    
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      
      // Remover parâmetros da URL sem recarregar a página
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
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

  // Manipular sucesso na sincronização de dados
  const handleSyncSuccess = (data) => {
    setSuccess('Sincronização de dados iniciada com sucesso. Os dados serão atualizados em segundo plano.');
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
                <Tab label="Sincronização de Dados" />
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
            ) : activeTab === 1 ? (
              <Box>
                <FacebookIntegration 
                  onIntegrationSuccess={handleDirectMetaSuccess} 
                />
              </Box>
            ) : (
              <Box>
                <CompanySyncSelector 
                  onSyncSuccess={handleSyncSuccess}
                />
              </Box>
            )}
          </>
        )}

        <Snackbar 
          open={error !== null || success !== null} 
          autoHideDuration={6000} 
          onClose={handleCloseAlert}
        >
          <Alert 
            onClose={handleCloseAlert} 
            severity={error !== null ? 'error' : 'success'} 
            sx={{ width: '100%' }}
          >
            {error || success}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default Integrations;
