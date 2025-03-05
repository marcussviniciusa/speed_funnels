import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardActions, 
  Divider, 
  Chip, 
  Alert, 
  CircularProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
  Facebook as FacebookIcon, 
  Google as GoogleIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import api from '../../services/authService';
import Layout from '../../components/Layout';

const IntegrationSetup = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const { companyId } = useParams();

  // Extrair parâmetros da URL
  const successParam = searchParams.get('success');
  const errorParam = searchParams.get('error');
  const platformParam = searchParams.get('platform');

  useEffect(() => {
    // Mostrar mensagem de sucesso ou erro com base nos parâmetros da URL
    if (successParam === 'true' && platformParam) {
      setSuccess(`Integração com ${platformParam === 'meta' ? 'Meta Ads' : 'Google Analytics'} configurada com sucesso!`);
    } else if (errorParam) {
      setError(`Erro ao configurar integração: ${decodeURIComponent(errorParam)}`);
    }
    
    // Buscar integrações existentes
    fetchIntegrations();
  }, [successParam, errorParam, platformParam, companyId]);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/integrations/company/${companyId}`);
      setIntegrations(response.data.integrations);
    } catch (err) {
      setError('Erro ao carregar integrações. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMetaIntegration = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/integrations/meta/auth/${companyId}`);
      // Redirecionar para URL de autorização do Meta
      window.location.href = response.data.authUrl;
    } catch (err) {
      setError('Erro ao iniciar integração com Meta Ads');
      console.error(err);
      setLoading(false);
    }
  };

  const handleGoogleIntegration = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/integrations/google/auth/${companyId}`);
      // Redirecionar para URL de autorização do Google
      window.location.href = response.data.authUrl;
    } catch (err) {
      setError('Erro ao iniciar integração com Google Analytics');
      console.error(err);
      setLoading(false);
    }
  };

  const handleDisableIntegration = async (integrationId) => {
    try {
      setLoading(true);
      await api.put(`/integrations/${integrationId}/disable`);
      setSuccess('Integração desativada com sucesso!');
      await fetchIntegrations();
    } catch (err) {
      setError('Erro ao desativar integração');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformDetails = (platform) => {
    switch(platform) {
      case 'meta':
        return {
          name: 'Meta Ads',
          icon: <FacebookIcon />,
          color: '#1877F2',
        };
      case 'google_analytics':
        return {
          name: 'Google Analytics',
          icon: <GoogleIcon />,
          color: '#4285F4',
        };
      default:
        return {
          name: platform,
          icon: null,
          color: '#757575',
        };
    }
  };

  const handleOpenDialog = (account) => {
    setSelectedAccount(account);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Configuração de Integrações
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FacebookIcon sx={{ color: '#1877F2', mr: 1 }} />
                  <Typography variant="h6">Meta Ads</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Conecte sua conta do Meta Ads para importar métricas de campanhas, desempenho de anúncios e outras informações relevantes para seus relatórios.
                </Typography>
              </CardContent>
              <Divider />
              <CardActions>
                <Button 
                  variant="contained" 
                  onClick={handleMetaIntegration}
                  disabled={loading}
                  startIcon={<FacebookIcon />}
                  sx={{ bgcolor: '#1877F2', '&:hover': { bgcolor: '#166FE5' } }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Conectar Meta Ads'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <GoogleIcon sx={{ color: '#4285F4', mr: 1 }} />
                  <Typography variant="h6">Google Analytics</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Conecte sua conta do Google Analytics para importar dados de tráfego, comportamento dos usuários, conversões e outros insights para seus relatórios.
                </Typography>
              </CardContent>
              <Divider />
              <CardActions>
                <Button 
                  variant="contained" 
                  onClick={handleGoogleIntegration}
                  disabled={loading}
                  startIcon={<GoogleIcon />}
                  sx={{ bgcolor: '#4285F4', '&:hover': { bgcolor: '#3367D6' } }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Conectar Google Analytics'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
        
        <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
          Integrações Configuradas
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : integrations.length > 0 ? (
          <Grid container spacing={3}>
            {integrations.map((integration) => {
              const platform = getPlatformDetails(integration.platform);
              return (
                <Grid item xs={12} md={6} key={integration.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {platform.icon}
                          <Typography variant="h6" sx={{ ml: 1 }}>
                            {platform.name}
                          </Typography>
                        </Box>
                        <Chip 
                          label={integration.isActive ? 'Ativo' : 'Inativo'} 
                          color={integration.isActive ? 'success' : 'default'}
                          icon={integration.isActive ? <CheckIcon /> : <ErrorIcon />}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        ID da Conta: {integration.accountId}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        Conectado em: {new Date(integration.createdAt).toLocaleDateString('pt-BR')}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        Última atualização: {new Date(integration.updatedAt).toLocaleDateString('pt-BR')}
                      </Typography>
                    </CardContent>
                    <Divider />
                    <CardActions>
                      {integration.isActive ? (
                        <Button 
                          size="small" 
                          color="error" 
                          onClick={() => handleOpenDialog(integration)}
                        >
                          Desativar
                        </Button>
                      ) : (
                        <Button 
                          size="small" 
                          color="primary" 
                          startIcon={<SyncIcon />}
                          onClick={() => platform.name === 'Meta Ads' ? handleMetaIntegration() : handleGoogleIntegration()}
                        >
                          Reconectar
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Alert severity="info">
            Nenhuma integração configurada ainda. Conecte suas contas de plataformas acima.
          </Alert>
        )}
      </Box>
      
      {/* Diálogo de confirmação para desativar integração */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Confirmar Desativação</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja desativar a integração com {selectedAccount?.platform === 'meta' ? 'Meta Ads' : 'Google Analytics'}?
            Os relatórios associados a esta integração não poderão mais atualizar dados.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={() => {
              handleDisableIntegration(selectedAccount.id);
              handleCloseDialog();
            }} 
            color="error"
          >
            Desativar
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default IntegrationSetup; 