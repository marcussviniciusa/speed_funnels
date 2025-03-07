import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import { Facebook as FacebookIcon } from '@mui/icons-material';

/**
 * Componente de botão para login com Facebook
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Function} props.onClick - Função a ser chamada quando o botão for clicado
 * @param {boolean} props.loading - Indica se está carregando
 * @param {boolean} props.disabled - Indica se o botão está desabilitado
 * @param {string} props.variant - Variante do botão (contained, outlined, text)
 * @param {Object} props.sx - Estilos adicionais
 * @param {string} props.label - Texto do botão
 */
const FacebookLoginButton = ({ 
  onClick, 
  loading = false, 
  disabled = false, 
  variant = 'contained', 
  sx = {}, 
  label = 'Conectar com Facebook'
}) => {
  return (
    <Button
      variant={variant}
      startIcon={loading ? null : <FacebookIcon />}
      onClick={onClick}
      disabled={loading || disabled}
      sx={{ 
        backgroundColor: variant === 'contained' ? '#1877F2' : 'transparent',
        color: variant === 'contained' ? 'white' : '#1877F2',
        '&:hover': {
          backgroundColor: variant === 'contained' ? '#166FE5' : 'rgba(24, 119, 242, 0.04)',
        },
        ...sx
      }}
    >
      {loading ? <CircularProgress size={24} color="inherit" /> : label}
    </Button>
  );
};

export default FacebookLoginButton;
