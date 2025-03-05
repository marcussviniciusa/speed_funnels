import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import { Facebook as FacebookIcon } from '@mui/icons-material';
import api from '../../services/api';

const DirectMetaConnect = ({ companyId, onSuccess }) => {
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [connectionData, setConnectionData] = useState(null);

  const handleConnect = async () => {
    if (!accessToken) {
      setError('Por favor, insira um token de acesso válido');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await api.post(`/api/integrations/meta/connect/${companyId}`, {
        accessToken
      });

      if (response.data.success) {
        setSuccess(true);
        setConnectionData(response.data.data);
        if (onSuccess) {
          onSuccess(response.data.data);
        }
      } else {
        setError('Falha ao conectar com o Meta Ads. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao conectar com Meta Ads:', err);
      setError(err.response?.data?.message || 'Falha ao conectar com o Meta Ads. Verifique o token e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasteToken = () => {
    // Token fornecido
    const metaToken = 'EAAPYcLD5sZBoBO6pw7ZC8yYEZCTINgxuGOr29GrwTo1RFLlD738Wxw2isO4x7HNXK70KXM9nTay5eOiw75AFfHl3T7yBShuitetZB8n8UJfahk6ZBFrfUc22I4wFGYQX07qh3cHp8QYLBmkBDxIuaZCvgRLSXIYjz6vM74bBmuDW0gHaWUcndFVZCpdLsA0x1xP';
    setAccessToken(metaToken);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Conectar diretamente ao Meta Ads
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Use esta opção para conectar diretamente com o Meta Ads usando um token de acesso válido.
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
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Token de Acesso do Meta Ads"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="Cole seu token de acesso aqui"
            multiline
            rows={3}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handlePasteToken}
              disabled={loading}
            >
              Usar Token Fornecido
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleConnect}
              disabled={!accessToken || loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FacebookIcon />}
            >
              {loading ? 'Conectando...' : 'Conectar ao Meta Ads'}
            </Button>
          </Box>
        </Box>
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
              setAccessToken('');
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

export default DirectMetaConnect;
