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
  CircularProgress
} from '@mui/material';
import { Facebook as FacebookIcon, Code as CodeIcon } from '@mui/icons-material';
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

  // Carregar lista de empresas ao montar o componente
  useEffect(() => {
    fetchCompanies();
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

  // Buscar contas de anúncios quando a conexão for estabelecida
  useEffect(() => {
    if (connectionData && connectionData.connectionId) {
      fetchAdAccounts(connectionData.connectionId);
    }
  }, [connectionData]);

  // Buscar contas de anúncios do Meta
  const fetchAdAccounts = async (connectionId) => {
    if (!connectionId) return;
    
    try {
      setLoadingAdAccounts(true);
      const response = await integrationService.getMetaAdAccounts(connectionId);
      
      if (response.data && response.data.data) {
        setAdAccounts(response.data.data);
        console.log(`Contas de anúncios carregadas: ${response.data.data.length}`);
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

          {/* Mostrar as contas de anúncios carregadas */}
          {loadingAdAccounts ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Contas de Anúncios Disponíveis
              </Typography>
              <List sx={{ maxHeight: 300, overflow: 'auto', mb: 3, border: '1px solid #eee', borderRadius: 1 }}>
                {adAccounts.length > 0 ? (
                  adAccounts.map((account) => {
                    const isActive = account.account_status === 1 || account.account_status === 2;
                    return (
                      <ListItem key={account.id} sx={{ 
                        bgcolor: isActive ? 'transparent' : '#f5f5f5',
                        opacity: isActive ? 1 : 0.7 
                      }}>
                        <ListItemText
                          primary={account.name}
                          secondary={
                            <>
                              <Typography component="span" variant="body2">
                                ID: {account.id}
                              </Typography>
                              {account.business_name && (
                                <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                                  Empresa: {account.business_name}
                                </Typography>
                              )}
                              <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                                Status: {isActive ? 'Ativo' : 'Inativo'} | Moeda: {account.currency}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    );
                  })
                ) : (
                  <ListItem>
                    <ListItemText primary="Nenhuma conta de anúncios encontrada" />
                  </ListItem>
                )}
              </List>
            </>
          )}

          {/* Componente de seleção de conta de anúncios */}
          <CompanySyncSelector 
            connectionId={connectionData.connectionId} 
            companyId={connectionData.companyId || selectedCompany}
            adAccounts={adAccounts}
            onSyncSuccess={handleSyncSuccess}
          />

          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              setSuccess(false);
              setConnectionData(null);
              setAdAccounts([]);
            }}
            sx={{ mt: 2 }}
          >
            Nova Conexão
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default FacebookIntegration;
