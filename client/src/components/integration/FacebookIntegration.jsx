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
  Button
} from '@mui/material';
import { Facebook as FacebookIcon, Code as CodeIcon } from '@mui/icons-material';
import DirectMetaConnect from './DirectMetaConnect';
import FacebookLoginButton from './FacebookLoginButton';

/**
 * Componente principal para integração com Meta Ads
 * Oferece múltiplas opções de integração (SDK ou token direto)
 */
const FacebookIntegration = ({ companyId = '1', onIntegrationSuccess }) => {
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [connectionData, setConnectionData] = useState(null);

  // Manipular mudança de abas
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
                companyId={companyId}
              />
            </Box>
          )}
          
          {tabValue === 1 && (
            <DirectMetaConnect 
              companyId={companyId}
              onSuccess={handleDirectConnectSuccess}
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

          {connectionData.adAccounts && connectionData.adAccounts.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Contas de Anúncios Disponíveis
              </Typography>
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {connectionData.adAccounts.map((account) => (
                  <ListItem key={account.id}>
                    <ListItemText
                      primary={account.name}
                      secondary={`ID: ${account.id} | Status: ${account.account_status === 1 ? 'Ativo' : 'Inativo'}`}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}

          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              setSuccess(false);
              setConnectionData(null);
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
