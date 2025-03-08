import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Chip
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import ReplayIcon from '@mui/icons-material/Replay';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import integrationService from '../../services/integrationService';

/**
 * Componente para seleção de conta de anúncio do Meta para sincronização de dados
 * Este componente deve ser exibido após a conexão com o Meta ter sido estabelecida
 */
const CompanySyncSelector = ({ onSyncSuccess, connectionId, companyId, adAccounts: initialAdAccounts = [] }) => {
  const [adAccounts, setAdAccounts] = useState(initialAdAccounts);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingAccounts, setFetchingAccounts] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Verificar se existe uma conexão ativa com o Meta e usar as contas iniciais se fornecidas
  useEffect(() => {
    if (connectionId) {
      setIsConnected(true);
      
      // Se já temos contas de anúncios, usamos elas
      if (initialAdAccounts && initialAdAccounts.length > 0) {
        processAdAccounts(initialAdAccounts);
      } else {
        // Caso contrário, buscamos da API
        fetchMetaAdAccounts();
      }
    } else {
      setIsConnected(false);
      setError('É necessário conectar-se ao Meta antes de sincronizar dados.');
    }
  }, [connectionId, initialAdAccounts]);

  // Atualizar adAccounts quando initialAdAccounts mudar
  useEffect(() => {
    if (initialAdAccounts && initialAdAccounts.length > 0) {
      processAdAccounts(initialAdAccounts);
    }
  }, [initialAdAccounts]);

  // Processar as contas de anúncios recebidas
  const processAdAccounts = (accounts) => {
    // Filtrar apenas contas ativas (account_status = 1 ou account_status = 2)
    const activeAccounts = accounts.filter(account => 
      account.account_status === 1 || account.account_status === 2
    );
    
    setAdAccounts(activeAccounts);
    console.log(`Processadas ${activeAccounts.length} contas de anúncios ativas de ${accounts.length} total`);
    
    // Se houver apenas uma conta ativa, seleciona automaticamente
    if (activeAccounts.length === 1) {
      setSelectedAccount(activeAccounts[0].id);
    }
  };

  // Buscar contas de anúncios do Meta
  const fetchMetaAdAccounts = async () => {
    if (!connectionId) {
      setError('É necessário conectar-se ao Meta antes de buscar contas de anúncios.');
      return;
    }

    try {
      setFetchingAccounts(true);
      setError(null);
      
      // Chamar a API para buscar as contas do Meta
      const response = await integrationService.getMetaAdAccounts(connectionId);
      
      // Processar a resposta
      if (response.data && Array.isArray(response.data.data)) {
        processAdAccounts(response.data.data);
      } else {
        console.error('Formato inesperado de resposta ao buscar contas de anúncio:', response);
        setError('Não foi possível processar a lista de contas de anúncios. Formato inesperado de resposta.');
      }
    } catch (err) {
      console.error('Erro ao carregar contas de anúncios:', err);
      setError('Não foi possível carregar a lista de contas de anúncios do Meta. Por favor, tente novamente.');
    } finally {
      setFetchingAccounts(false);
    }
  };

  // Manipular mudança na seleção de conta
  const handleAccountChange = (event) => {
    setSelectedAccount(event.target.value);
    setError(null);
    setSuccess(null);
  };

  // Obter status da conta formatado
  const getAccountStatusInfo = (status) => {
    switch (status) {
      case 1:
        return { label: 'Ativa', color: 'success' };
      case 2:
        return { label: 'Ativa', color: 'success' };
      case 3:
        return { label: 'Desativada', color: 'error' };
      case 101:
        return { label: 'Pendente', color: 'warning' };
      default:
        return { label: 'Desconhecido', color: 'default' };
    }
  };

  // Iniciar sincronização para a conta selecionada
  const handleSync = async () => {
    if (!selectedAccount) {
      setError('Por favor, selecione uma conta de anúncios para sincronizar.');
      return;
    }

    if (!companyId) {
      setError('ID da empresa não fornecido. Não é possível realizar a sincronização.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Chamar o endpoint para sincronizar os dados da conta de anúncios selecionada
      const response = await integrationService.syncMetaAdAccount(companyId, selectedAccount);
      
      setSuccess(`Sincronização iniciada com sucesso para a conta de anúncios "${
        adAccounts.find(acc => acc.id === selectedAccount)?.name || selectedAccount
      }". Os dados serão atualizados em segundo plano.`);
      
      if (typeof onSyncSuccess === 'function') {
        onSyncSuccess({
          companyId,
          connectionId,
          accountId: selectedAccount
        });
      }
    } catch (err) {
      console.error('Erro ao sincronizar dados:', err);
      setError('Não foi possível iniciar a sincronização. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Se não houver conexão, não exibir o seletor
  if (!isConnected) {
    return (
      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sincronização de Dados do Meta
        </Typography>
        
        <Alert severity="info" sx={{ mt: 2 }}>
          É necessário conectar-se ao Meta Ads antes de sincronizar dados.
          Por favor, utilize a opção de conexão acima.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Sincronização de Dados do Meta
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Selecione uma conta de anúncios do Meta para sincronizar os dados. 
        Isso irá buscar campanhas, conjuntos de anúncios e insights atualizados.
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            {fetchingAccounts 
              ? 'Carregando contas de anúncios...' 
              : `${adAccounts.length} contas de anúncios disponíveis`}
          </Typography>
          
          <Button
            size="small"
            startIcon={<ReplayIcon />}
            onClick={fetchMetaAdAccounts}
            disabled={fetchingAccounts}
          >
            Atualizar
          </Button>
        </Box>
        
        <FormControl fullWidth>
          <InputLabel id="account-select-label">Conta de Anúncios</InputLabel>
          <Select
            labelId="account-select-label"
            id="account-select"
            value={selectedAccount}
            label="Conta de Anúncios"
            onChange={handleAccountChange}
            disabled={fetchingAccounts || loading || adAccounts.length === 0}
            sx={{ mb: 2 }}
          >
            {fetchingAccounts ? (
              <MenuItem value="" disabled>
                Carregando contas de anúncios...
              </MenuItem>
            ) : adAccounts.length === 0 ? (
              <MenuItem value="" disabled>
                Nenhuma conta de anúncios encontrada
              </MenuItem>
            ) : (
              adAccounts.map((account) => {
                const statusInfo = getAccountStatusInfo(account.account_status);
                return (
                  <MenuItem key={account.id} value={account.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <Box>
                        <Typography>
                          {account.name}
                        </Typography>
                        {account.business_name && (
                          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                            {account.business_name}
                          </Typography>
                        )}
                      </Box>
                      <Chip 
                        label={statusInfo.label} 
                        color={statusInfo.color} 
                        size="small" 
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  </MenuItem>
                );
              })
            )}
          </Select>
        </FormControl>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
          onClick={handleSync}
          disabled={!selectedAccount || loading || fetchingAccounts}
          fullWidth
        >
          {loading ? 'Sincronizando...' : 'Sincronizar Dados'}
        </Button>
      </Box>
    </Paper>
  );
};

export default CompanySyncSelector;
