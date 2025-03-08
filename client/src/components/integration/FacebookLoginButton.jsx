import React, { useState, useEffect } from 'react';
import { Button, CircularProgress, Typography, Box, Tooltip, Alert, Collapse } from '@mui/material';
import { Facebook as FacebookIcon, InfoOutlined } from '@mui/icons-material';
import api from '../../services/api';

/**
 * Botão de login com Facebook que utiliza o SDK do Facebook
 * para autenticação e obtenção de permissões de anúncios
 */
const FacebookLoginButton = ({ onLoginSuccess, onLoginFailure, companyId, disabled = false }) => {
  const [loading, setLoading] = useState(false);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [loginStatus, setLoginStatus] = useState(null); // Para mostrar mensagens de status
  const [showInfo, setShowInfo] = useState(false); // Controla a exibição das informações sobre permissões

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

  // Limpar mensagens de status após um tempo
  useEffect(() => {
    if (loginStatus) {
      const timer = setTimeout(() => {
        setLoginStatus(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [loginStatus]);

  // Função para iniciar o fluxo de autorização
  const handleFacebookLogin = async () => {
    if (!companyId) {
      setLoginStatus({
        type: 'error',
        message: 'Por favor, selecione uma empresa antes de continuar'
      });
      if (typeof onLoginFailure === 'function') {
        onLoginFailure('Por favor, selecione uma empresa antes de continuar');
      }
      return;
    }
    
    setLoading(true);
    setLoginStatus({
      type: 'info',
      message: 'Iniciando o processo de autenticação do Meta...'
    });
    
    try {
      // Chamar a API para iniciar o processo de autorização do Meta
      const response = await api.get(`/api/integrations/meta/auth/${companyId}`);
      
      if (response.data.success && response.data.authUrl) {
        setLoginStatus({
          type: 'info',
          message: 'Redirecionando para a página de autenticação do Meta...'
        });
        
        // Pequeno atraso para garantir que o usuário veja a mensagem de status
        setTimeout(() => {
          // Redirecionar para a URL de autorização
          window.location.href = response.data.authUrl;
        }, 1000);
      } else {
        setLoginStatus({
          type: 'error',
          message: 'Não foi possível iniciar o processo de autorização'
        });
        if (typeof onLoginFailure === 'function') {
          onLoginFailure('Não foi possível iniciar o processo de autorização');
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro ao iniciar autorização com Meta:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao iniciar autorização com Meta';
      setLoginStatus({
        type: 'error',
        message: errorMessage
      });
      if (typeof onLoginFailure === 'function') {
        onLoginFailure(errorMessage);
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
    
    if (!companyId) {
      if (typeof onLoginFailure === 'function') {
        onLoginFailure('Por favor, selecione uma empresa antes de continuar');
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

  // Renderiza informações sobre as permissões solicitadas
  const renderPermissionInfo = () => (
    <Box sx={{ mt: 1, mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
      <Typography variant="subtitle2" gutterBottom>
        Permissões solicitadas durante a autenticação:
      </Typography>
      <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
        <li><Typography variant="body2">Gerenciamento de anúncios</Typography></li>
        <li><Typography variant="body2">Leitura de anúncios</Typography></li>
        <li><Typography variant="body2">Gerenciamento empresarial</Typography></li>
      </ul>
      <Typography variant="caption" color="textSecondary">
        Estas permissões são necessárias para sincronizar dados de campanhas e contas de anúncios.
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ my: 2 }}>
      {loginStatus && (
        <Collapse in={!!loginStatus}>
          <Alert severity={loginStatus.type} sx={{ mb: 2 }}>
            {loginStatus.message}
          </Alert>
        </Collapse>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ mr: 1 }}>
            Meta Ads Integration
          </Typography>
          <Tooltip title="Clique para ver informações sobre as permissões">
            <InfoOutlined 
              fontSize="small" 
              color="action" 
              onClick={() => setShowInfo(!showInfo)}
              sx={{ cursor: 'pointer' }}
            />
          </Tooltip>
        </Box>
        
        {showInfo && renderPermissionInfo()}
        
        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FacebookIcon />}
          onClick={handleFacebookLogin}
          disabled={loading || disabled || !companyId}
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
        
        {!companyId && !disabled && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            Selecione uma empresa antes de continuar
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default FacebookLoginButton;
