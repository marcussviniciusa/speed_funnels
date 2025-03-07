import React, { useState, useEffect } from 'react';
import { Button, CircularProgress, Typography, Box } from '@mui/material';
import { Facebook as FacebookIcon } from '@mui/icons-material';
import api from '../../services/api';

/**
 * Botão de login com Facebook que utiliza o SDK do Facebook
 * para autenticação e obtenção de permissões de anúncios
 */
const FacebookLoginButton = ({ onLoginSuccess, onLoginFailure, companyId = '1' }) => {
  const [loading, setLoading] = useState(false);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);

  // Verificar se o SDK do Facebook está carregado
  useEffect(() => {
    const checkFbLoaded = setInterval(() => {
      if (window.FB) {
        setIsSdkLoaded(true);
        clearInterval(checkFbLoaded);
      }
    }, 300);

    return () => clearInterval(checkFbLoaded);
  }, []);

  // Função para iniciar o fluxo de autorização
  const handleFacebookLogin = async () => {
    setLoading(true);
    
    try {
      // Chamar a API para iniciar o processo de autorização do Meta
      const response = await api.get(`/api/integrations/meta/auth/${companyId}`);
      
      if (response.data.success && response.data.authUrl) {
        // Redirecionar para a URL de autorização
        window.location.href = response.data.authUrl;
      } else {
        if (typeof onLoginFailure === 'function') {
          onLoginFailure('Não foi possível iniciar o processo de autorização');
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro ao iniciar autorização com Meta:', error);
      if (typeof onLoginFailure === 'function') {
        onLoginFailure(error.response?.data?.message || 'Erro ao iniciar autorização com Meta');
      }
      setLoading(false);
    }
  };
  
  // Função alternativa que usa o SDK do Facebook diretamente (mantida como referência)
  const handleSDKLogin = () => {
    if (!window.FB) {
      if (typeof onLoginFailure === 'function') {
        onLoginFailure('SDK do Facebook não carregado');
      }
      return;
    }
    
    setLoading(true);

    window.FB.login(
      async (response) => {
        if (response.authResponse) {
          try {
            // Obter o token de acesso da resposta
            const { accessToken } = response.authResponse;
            
            // Enviar o token para o backend para finalizar a integração
            const result = await api.post(`/api/integrations/meta/connect/${companyId}`, {
              accessToken
            });

            if (result.data.success) {
              if (typeof onLoginSuccess === 'function') {
                onLoginSuccess(result.data.data);
              }
            } else {
              if (typeof onLoginFailure === 'function') {
                onLoginFailure('Falha ao conectar com o Meta Ads');
              }
            }
          } catch (error) {
            console.error('Erro ao processar o login com Facebook:', error);
            if (typeof onLoginFailure === 'function') {
              onLoginFailure(error.response?.data?.message || 'Erro ao conectar com Meta Ads');
            }
          } finally {
            setLoading(false);
          }
        } else {
          console.log('Usuário cancelou o login ou não autorizou totalmente.');
          if (typeof onLoginFailure === 'function') {
            onLoginFailure('Login com Facebook cancelado pelo usuário');
          }
          setLoading(false);
        }
      },
      {
        scope: 'public_profile,email,ads_management,ads_read,business_management',
        return_scopes: true
      }
    );
  };

  return (
    <Box sx={{ my: 2 }}>
      <Button
        variant="contained"
        color="primary"
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FacebookIcon />}
        onClick={handleFacebookLogin}
        disabled={loading}
        fullWidth
        sx={{
          backgroundColor: '#1877F2',
          '&:hover': {
            backgroundColor: '#166FE5'
          }
        }}
      >
        {loading ? 'Conectando...' : 'Conectar com Facebook'}
      </Button>
    </Box>
  );
};

export default FacebookLoginButton;
