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
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { 
  Facebook as FacebookIcon, 
  Check as CheckIcon,
  Error as ErrorIcon,
  Sync as SyncIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/authService';
import Layout from '../../components/Layout';
import IntegrationsMenu from '../../components/IntegrationsMenu';
import FacebookSDK from '../../components/FacebookSDK';
import FacebookLoginButton from '../../components/FacebookLoginButton';

// Componente para exibir informações sobre as permissões do Facebook
const FacebookPermissionsInfo = () => (
  <Box sx={{ mt: 2, mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
    <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
      <InfoIcon sx={{ mr: 1 }} />
      Permissões necessárias para integração com Facebook Ads
    </Typography>
    <Typography variant="body2">
      Ao conectar sua conta do Facebook, você concederá as seguintes permissões:
    </Typography>
    <Box component="ul" sx={{ pl: 2 }}>
      <Typography component="li" variant="body2">
        <strong>ads_management</strong>: Permite gerenciar campanhas publicitárias
      </Typography>
      <Typography component="li" variant="body2">
        <strong>ads_read</strong>: Permite ler dados de anúncios e campanhas
      </Typography>
      <Typography component="li" variant="body2">
        <strong>business_management</strong>: Permite acessar contas de negócios
      </Typography>
      <Typography component="li" variant="body2">
        <strong>public_profile</strong>: Acesso básico ao perfil público
      </Typography>
    </Box>
    <Typography variant="body2" sx={{ mt: 1 }}>
      Estas permissões são necessárias para que possamos analisar o desempenho de suas campanhas e fornecer insights valiosos.
    </Typography>
  </Box>
);

// Componente principal da página de integração com Facebook
const FacebookIntegration = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [fbSDKLoaded, setFbSDKLoaded] = useState(false);
  const [metaAppId, setMetaAppId] = useState('');

  // Extrair parâmetros da URL
  const successParam = searchParams.get('success');
  const errorParam = searchParams.get('error');

  useEffect(() => {
    // Buscar o APP ID do Meta das configurações
    const fetchMetaAppId = async () => {
      try {
        // Em um ambiente real, você buscaria isso do backend
        // Por enquanto, vamos usar um valor fixo ou do localStorage
        const appId = localStorage.getItem('META_APP_ID') || process.env.REACT_APP_META_APP_ID || '1082403447223274';
        setMetaAppId(appId);
      } catch (err) {
        console.error('Erro ao buscar META_APP_ID:', err);
      }
    };

    fetchMetaAppId();
    
    // Mostrar mensagem de sucesso ou erro com base nos parâmetros da URL
    if (successParam === 'true') {
      setSuccess('Integração com Facebook Ads configurada com sucesso!');
    } else if (errorParam) {
      setError(`Erro ao configurar integração: ${decodeURIComponent(errorParam)}`);
    }
    
    // Buscar integrações existentes e empresas disponíveis
    fetchIntegrations();
    fetchCompanies();
  }, [successParam, errorParam]);

  const handleFBSDKLoad = (FB) => {
    console.log('Facebook SDK carregado com sucesso');
    setFbSDKLoaded(true);
  };

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings/integrations');
      if (response.data.success) {
        setIntegrations(response.data.data.meta || []);
      } else {
        setError('Erro ao carregar integrações');
      }
    } catch (err) {
      setError('Erro ao carregar integrações. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      if (response.data.success) {
        setCompanies(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedCompany(response.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar empresas:', err);
    }
  };

  // Método tradicional de login com redirecionamento para o Facebook
  const handleFacebookLogin = async () => {
    if (!selectedCompany) {
      setError('Selecione uma empresa para continuar');
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.get(`/integrations/meta/auth/${selectedCompany}`);
      // Redirecionar para URL de autorização do Facebook
      window.location.href = response.data.authUrl;
    } catch (err) {
      setError('Erro ao iniciar integração com Facebook Ads');
      console.error(err);
      setLoading(false);
    }
  };

  const handleFacebookLoginWithSDK = () => {
    if (!selectedCompany) {
      setError('Selecione uma empresa para continuar');
      return;
    }
    
    if (!fbSDKLoaded || !window.FB) {
      setError('SDK do Facebook não carregado. Tente novamente.');
      return;
    }
    
    setLoading(true);
    
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;
          console.log('Token obtido:', accessToken);
          
          // Enviar o token para o backend
          api.post(`/integrations/meta/connect/${selectedCompany}`, {
            accessToken: accessToken
          })
          .then(res => {
            setSuccess('Integração com Facebook Ads configurada com sucesso!');
            fetchIntegrations();
          })
          .catch(err => {
            setError(err.response?.data?.error || 'Erro ao conectar com Facebook Ads');
            console.error(err);
          })
          .finally(() => {
            setLoading(false);
          });
        } else {
          console.log('Usuário cancelou o login ou não autorizou o aplicativo.');
          setError('Login cancelado pelo usuário');
          setLoading(false);
        }
      },
      {
        scope: 'ads_management,ads_read,business_management,public_profile',
        return_scopes: true
      }
    );
  };

  const handleOpenManualDialog = () => {
    setOpenDialog(true);
    setManualToken('');
    setTokenError('');
  };

  const handleCloseManualDialog = () => {
    setOpenDialog(false);
  };

  const handleManualTokenChange = (e) => {
    setManualToken(e.target.value);
    if (e.target.value.length > 0) {
      setTokenError('');
    }
  };

  const handleManualConnect = async () => {
    if (!manualToken) {
      setTokenError('O token de acesso é obrigatório');
      return;
    }
    
    if (!selectedCompany) {
      setTokenError('Selecione uma empresa para continuar');
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.post(`/integrations/meta/connect/${selectedCompany}`, {
        accessToken: manualToken
      });
      
      if (response.data.success) {
        setSuccess('Integração com Facebook Ads configurada com sucesso!');
        fetchIntegrations();
        handleCloseManualDialog();
      } else {
        setTokenError(response.data.error || 'Erro ao conectar com Facebook Ads');
      }
    } catch (err) {
      setTokenError(err.response?.data?.error || 'Erro ao conectar com Facebook Ads');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableIntegration = async (integrationId) => {
    try {
      setLoading(true);
      await api.put(`/integrations/${integrationId}/disable`);
      setSuccess('Integração desativada com sucesso!');
      fetchIntegrations();
    } catch (err) {
      setError('Erro ao desativar integração');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      {/* Carregar o SDK do Facebook */}
      {metaAppId && <FacebookSDK appId={metaAppId} onLoad={handleFBSDKLoad} />}
      
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Integração com Facebook Ads
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <IntegrationsMenu />
          </Grid>
          <Grid item xs={12} md={9}>
            {success && (
              <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            
            <FacebookPermissionsInfo />
            
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Conectar nova conta
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="company-select-label">Empresa</InputLabel>
                    <Select
                      labelId="company-select-label"
                      value={selectedCompany}
                      label="Empresa"
                      onChange={(e) => setSelectedCompany(e.target.value)}
                      disabled={loading || companies.length === 0}
                    >
                      {companies.map((company) => (
                        <MenuItem key={company.id} value={company.id}>
                          {company.name}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>Selecione a empresa para associar à conta do Facebook</FormHelperText>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FacebookLoginButton 
                      onClick={fbSDKLoaded ? handleFacebookLoginWithSDK : handleFacebookLogin}
                      loading={loading}
                      disabled={!selectedCompany}
                      sx={{ flex: 1 }}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleOpenManualDialog}
                      disabled={loading || !selectedCompany}
                    >
                      Token Manual
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
            
            <Typography variant="h6" gutterBottom>
              Integrações Ativas
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : integrations.length > 0 ? (
              <Grid container spacing={3}>
                {integrations.map((integration) => (
                  <Grid item xs={12} md={6} key={integration.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <FacebookIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="h6">
                            {integration.accountName || 'Conta Facebook Ads'}
                          </Typography>
                          <Chip 
                            label={integration.isActive ? 'Ativo' : 'Inativo'} 
                            color={integration.isActive ? 'success' : 'default'}
                            size="small"
                            sx={{ ml: 'auto' }}
                          />
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Empresa:</strong> {integration.companyName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>ID da Conta:</strong> {integration.accountId}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Conectado em:</strong> {formatDate(integration.connectedAt)}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          color="error"
                          onClick={() => handleDisableIntegration(integration.id)}
                          disabled={!integration.isActive}
                        >
                          Desativar
                        </Button>
                        <Button 
                          size="small" 
                          startIcon={<SyncIcon />}
                          onClick={() => handleFacebookLogin()}
                        >
                          Reconectar
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                Nenhuma integração com Facebook Ads encontrada. Conecte sua primeira conta usando o botão acima.
              </Alert>
            )}
          </Grid>
        </Grid>
        
        {/* Diálogo para conexão manual com token */}
        <Dialog open={openDialog} onClose={handleCloseManualDialog}>
          <DialogTitle>Conectar com Token de Acesso</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Insira um token de acesso do Facebook Ads válido para conectar diretamente sem passar pelo fluxo de autorização.
              Você pode obter um token através do <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer">Graph API Explorer</a>.
            </DialogContentText>
            
            {tokenError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {tokenError}
              </Alert>
            )}
            
            <TextField
              autoFocus
              margin="dense"
              id="token"
              label="Token de Acesso"
              type="text"
              fullWidth
              variant="outlined"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              error={!!tokenError}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth>
              <InputLabel id="company-select-label">Empresa</InputLabel>
              <Select
                labelId="company-select-label"
                id="company-select"
                value={selectedCompany}
                label="Empresa"
                onChange={(e) => setSelectedCompany(e.target.value)}
              >
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseManualDialog}>Cancelar</Button>
            <Button 
              onClick={handleManualConnect} 
              variant="contained" 
              disabled={!manualToken || !selectedCompany || loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Conectar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default FacebookIntegration;
