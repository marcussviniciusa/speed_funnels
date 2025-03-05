import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { DataArray as DataArrayIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';

/**
 * Componente para exibir quando não há dados disponíveis
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} props.title - Título do placeholder
 * @param {string} props.message - Mensagem explicativa
 * @param {React.ReactNode} props.icon - Ícone personalizado
 */
const NoDataPlaceholder = ({ title, message, icon }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: 300,
        bgcolor: 'background.default'
      }}
    >
      <Box sx={{ color: 'text.disabled', mb: 2 }}>
        {icon || <DataArrayIcon sx={{ fontSize: 64 }} />}
      </Box>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500 }}>
        {message}
      </Typography>
    </Paper>
  );
};

NoDataPlaceholder.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  icon: PropTypes.node
};

export default NoDataPlaceholder;
