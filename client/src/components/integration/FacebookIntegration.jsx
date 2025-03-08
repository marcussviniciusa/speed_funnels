import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tab,
  Tabs,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip
} from '@mui/material';
import { Facebook as FacebookIcon, Code as CodeIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon } from '@mui/icons-material';
import DirectMetaConnect from './DirectMetaConnect';
import FacebookLoginButton from './FacebookLoginButton';
import CompanySyncSelector from './CompanySyncSelector';
import integrationService from '../../services/integrationService';

/**
 * Componente principal para integração com Meta Ads
 * Oferece múltiplas opções de integração (SDK ou token direto)
 */
const FacebookIntegration = ({ onIntegrationSuccess }) => {
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [connectionData, setConnectionData] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [adAccounts, setAdAccounts] = useState([]);
  const [loadingAdAccounts, setLoadingAdAccounts] = useState(false);
  const [ads, setAds] = useState([]);
  const [loadingAds, setLoadingAds] = useState(false);

  // Carregar lista de empresas ao montar o componente
  useEffect(() => {
    fetchCompanies();
    
    // Verificar os parâmetros da URL para detectar sucesso/erro na integração
    const urlParams = new URLSearchParams(window.location.search);
    const successMessage = urlParams.get('success');
    const errorMessage = urlParams.get('error');
    
    if (successMessage) {
      setSuccess(true);
      // Buscar as contas de anúncios após uma integração bem-sucedida
      setTimeout(() => {
        // Após o redirecionamento bem-sucedido, buscamos as empresas e dados
        fetchCompanies();
      }, 1000);
    }
    
    if (errorMessage) {
      setError(decodeURIComponent(errorMessage));
    }
  }, []);

  // Buscar empresas da API
  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const response = await integrationService.getCompanies();
      setCompanies(response.data.data || []);
      
      // Se houver apenas uma empresa, seleciona automaticamente
      if (response.data.data && response.data.data.length === 1) {
        setSelectedCompany(response.data.data[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar empresas:', err);
      setError('Não foi possível carregar a lista de empresas. Por favor, tente novamente.');
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Buscar contas de anúncios quando uma empresa é selecionada
  useEffect(() => {
    if (selectedCompany) {
      fetchAdAccounts(selectedCompany);
    }
  }, [selectedCompany]);

  // Buscar contas de anúncios do Meta
  const fetchAdAccounts = async (companyId) => {
    if (!companyId) return;
    
    try {
      setLoadingAdAccounts(true);
      console.log(`Buscando contas de anúncios para a empresa ${companyId}...`);
      const response = await integrationService.getMetaAdAccounts(companyId);
      
      if (response.data && response.data.success) {
        const accounts = response.data.data.accounts || [];
        setAdAccounts(accounts);
        console.log(`Contas de anúncios carregadas: ${accounts.length}`);
        
        // Se tiver uma conexão ativa, atualizar os dados de conexão
        if (response.data.data.activeConnection) {
          setConnectionData({
            connectionId: response.data.data.activeConnection.id,
            accountId: response.data.data.activeConnection.accountId,
            accountName: response.data.data.activeConnection.accountName
          });
          setSuccess(true);
          
          // Se tiver uma conta selecionada, buscar anúncios automaticamente
          if (response.data.data.activeConnection.accountId) {
            fetchAds(response.data.data.activeConnection.accountId);
          }
        }
      } else {
        console.log('Resposta recebida sem contas de anúncios:', response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar contas de anúncios:', err);
      setError('Não foi possível carregar as contas de anúncios. Por favor, tente novamente.');
    } finally {
      setLoadingAdAccounts(false);
    }
  };

  // Manipular mudança de abas
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
  };

  // Manipular mudança na seleção de empresa
  const handleCompanyChange = (event) => {
    setSelectedCompany(event.target.value);
    setError('');
  };

  // Manipular sucesso no login com Facebook
  const handleLoginSuccess = (data) => {
    setSuccess(true);
    setConnectionData(data);
    setError('');
    
    if (typeof onIntegrationSuccess === 'function') {
      onIntegrationSuccess(data);
    }
  };

  // Manipular erro no login com Facebook
  const handleLoginFailure = (errorMessage) => {
    setError(errorMessage);
    setSuccess(false);
  };

  // Manipular sucesso na conexão direta com token
  const handleDirectConnectSuccess = (data) => {
    setSuccess(true);
    setConnectionData(data);
    setError('');
    
    if (typeof onIntegrationSuccess === 'function') {
      onIntegrationSuccess(data);
    }
  };

  // Manipular sucesso na sincronização de conta
  const handleSyncSuccess = (syncData) => {
    console.log('Sincronização realizada com sucesso:', syncData);
    // Pode adicionar lógica adicional aqui se necessário
  };

  // Manipular mudança na seleção de conta de anúncios
  const handleAdAccountChange = (event) => {
    const newAccountId = event.target.value;
    const selectedAccount = adAccounts.find(account => account.id === newAccountId);
    
    if (selectedAccount) {
      setConnectionData(prev => ({
        ...prev,
        accountId: newAccountId,
        accountName: selectedAccount.name
      }));
      
      console.log(`Conta de anúncios selecionada: ${selectedAccount.name} (${newAccountId})`);
      
      // Buscar anúncios da conta selecionada
      fetchAds(newAccountId);
    }
  };
  
  // Buscar anúncios de uma conta específica
  const fetchAds = async (accountId) => {
    if (!accountId) return;
    
    try {
      setLoadingAds(true);
      setAds([]);
      console.log(`Buscando anúncios da conta ${accountId}...`);
      const response = await integrationService.getMetaAds(accountId);
      
      if (response.data && response.data.success) {
        const adsData = response.data.data.data || [];
        setAds(adsData);
        console.log(`Anúncios carregados: ${adsData.length}`);
      } else {
        console.log('Resposta recebida sem anúncios:', response.data);
        setError(response.data?.error || 'Erro ao buscar anúncios');
      }
    } catch (err) {
      console.error('Erro ao carregar anúncios:', err);
      setError('Não foi possível carregar os anúncios. Por favor, tente novamente.');
    } finally {
      setLoadingAds(false);
    }
  };

  // Manipular sincronização de conta
  const handleSyncAccount = async (accountId) => {
    if (!accountId || !selectedCompany) return;
    
    try {
      setError('');
      console.log(`Sincronizando conta ${accountId} para empresa ${selectedCompany}`);
      
      // Mostrar indicador de carregamento enquanto sincroniza
      setLoadingAds(true);
      
      const response = await integrationService.syncMetaAdAccount(selectedCompany, accountId);
      
      if (response.data && response.data.success) {
        setSuccess(true);
        
        // Buscar anúncios atualizados após a sincronização
        fetchAds(accountId);
        
        // Notificar o usuário do sucesso
        alert('Dados sincronizados com sucesso!');
      } else {
        setError(response.data?.error || 'Erro ao sincronizar dados');
        setLoadingAds(false);
      }
    } catch (err) {
      console.error('Erro ao sincronizar conta:', err);
      setError(err.response?.data?.error || 'Erro ao sincronizar dados da conta');
      setLoadingAds(false);
    }
  };

  // Manipular reconexão
  const handleReconnect = () => {
    setSuccess(false);
    setConnectionData(null);
    setAdAccounts([]);
    setAds([]); // Limpar anúncios ao reconectar
    setError('');
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Integração com Meta Ads
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Conexão com Meta Ads realizada com sucesso!
        </Alert>
      )}

      {!success ? (
        <>
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="company-select-label">Empresa</InputLabel>
              <Select
                labelId="company-select-label"
                id="company-select"
                value={selectedCompany}
                label="Empresa"
                onChange={handleCompanyChange}
                disabled={loadingCompanies}
              >
                {loadingCompanies ? (
                  <MenuItem value="" disabled>
                    Carregando empresas...
                  </MenuItem>
                ) : companies.length === 0 ? (
                  <MenuItem value="" disabled>
                    Nenhuma empresa encontrada
                  </MenuItem>
                ) : (
                  companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Box>

          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="fullWidth" 
            sx={{ mb: 3 }}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab icon={<FacebookIcon />} label="Login com Facebook" />
            <Tab icon={<CodeIcon />} label="Token de Acesso" />
          </Tabs>

          {tabValue === 0 && (
            <Box sx={{ py: 2 }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                Essa é a maneira recomendada para se conectar ao Meta Ads. Clique no botão abaixo para iniciar o processo de autorização.
              </Typography>
              
              <FacebookLoginButton 
                onLoginSuccess={handleLoginSuccess}
                onLoginFailure={handleLoginFailure}
                companyId={selectedCompany}
                disabled={!selectedCompany || loadingCompanies}
              />
            </Box>
          )}
          
          {tabValue === 1 && (
            <DirectMetaConnect 
              companyId={selectedCompany}
              onSuccess={handleDirectConnectSuccess}
              disabled={!selectedCompany || loadingCompanies}
            />
          )}
        </>
      ) : connectionData && (
        <Box sx={{ mt: 2 }}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            Detalhes da Conexão
          </Typography>
          <List>
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: '#4267B2' }}>
                  <FacebookIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={connectionData.accountName}
                secondary={`ID da conta: ${connectionData.accountId}`}
              />
            </ListItem>
          </List>

          {/* Sempre exibir esta seção se houver contas de anúncios, independente da conexão */}
          {loadingAdAccounts ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <Typography variant="body2" sx={{ mr: 1 }}>Carregando contas de anúncios</Typography>
              <CircularProgress size={24} />
            </Box>
          ) : adAccounts.length > 0 ? (
            <>
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                Contas de Anúncios Disponíveis ({adAccounts.length})
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="ad-account-select-label">Selecionar Conta de Anúncios</InputLabel>
                <Select
                  labelId="ad-account-select-label"
                  id="ad-account-select"
                  value={connectionData.accountId || ''}
                  label="Selecionar Conta de Anúncios"
                  onChange={handleAdAccountChange}
                >
                  {adAccounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name} ({account.id})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => handleSyncAccount(connectionData.accountId)}
                disabled={!connectionData.accountId || loadingAdAccounts}
                sx={{ mr: 1 }}
              >
                Sincronizar Dados
              </Button>
              
              {/* Exibir anúncios quando estiverem carregados */}
              {loadingAds ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>Carregando anúncios</Typography>
                  <CircularProgress size={24} />
                </Box>
              ) : ads.length > 0 ? (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">
                      Anúncios da Conta ({ads.length})
                    </Typography>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => {
                        // Preparar dados para exportação
                        const exportData = ads.map(ad => ({
                          id: ad.id,
                          name: ad.name,
                          status: ad.status || ad.effectiveStatus,
                          createdTime: ad.createdTime,
                          updatedTime: ad.updatedTime,
                          title: ad.creative?.title || '',
                          body: ad.creative?.body || '',
                          impressions: ad.insights?.impressions || 0,
                          clicks: ad.insights?.clicks || 0,
                          spend: ad.insights?.spend || 0
                        }));
                        
                        // Criar o blob JSON para download
                        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `meta-ads-${connectionData.accountId}-${new Date().toISOString().slice(0, 10)}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Exportar Anúncios
                    </Button>
                  </Box>
                  <Grid container spacing={2}>
                    {ads.map(ad => (
                      <Grid item xs={12} md={6} key={ad.id}>
                        <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                          <CardContent>
                            <Typography variant="h6" component="div">
                              {ad.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Chip 
                                icon={ad.status === 'ACTIVE' ? <CheckCircleIcon /> : <CancelIcon />}
                                label={ad.status || ad.effectiveStatus}
                                color={ad.status === 'ACTIVE' ? 'success' : 'default'}
                                size="small"
                                sx={{ mr: 1 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                ID: {ad.id}
                              </Typography>
                            </Box>
                            
                            {ad.creative && ad.creative.imageUrl && (
                              <CardMedia
                                component="img"
                                sx={{ height: 140, objectFit: 'contain', mb: 1 }}
                                image={ad.creative.imageUrl}
                                alt={ad.name}
                              />
                            )}
                            
                            {ad.creative && ad.creative.title && (
                              <Typography variant="subtitle2" gutterBottom>
                                {ad.creative.title}
                              </Typography>
                            )}
                            
                            {ad.creative && ad.creative.body && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {ad.creative.body}
                              </Typography>
                            )}
                            
                            {ad.insights && (
                              <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #eee' }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Performance:
                                </Typography>
                                <Grid container spacing={1}>
                                  <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">
                                      Impressões
                                    </Typography>
                                    <Typography variant="body2">
                                      {ad.insights.impressions || 0}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">
                                      Cliques
                                    </Typography>
                                    <Typography variant="body2">
                                      {ad.insights.clicks || 0}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">
                                      Custo
                                    </Typography>
                                    <Typography variant="body2">
                                      {ad.insights.spend || 0}
                                    </Typography>
                                  </Grid>
                                </Grid>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : connectionData.accountId && !loadingAds ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Nenhum anúncio encontrado para esta conta. Pode ser que não existam anúncios ativos ou que haja uma restrição de acesso.
                </Alert>
              ) : null}
            </>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              Não foram encontradas contas de anúncios disponíveis. Certifique-se de que sua conta do Meta Ads possui contas de anúncios configuradas.
            </Alert>
          )}

          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={handleReconnect}
            sx={{ mt: 2 }}
          >
            Reconectar
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default FacebookIntegration;
