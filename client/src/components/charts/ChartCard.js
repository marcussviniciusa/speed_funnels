import React from 'react';
import { Card, CardContent, CardHeader, Divider, Box, CircularProgress, Typography } from '@mui/material';

/**
 * Componente de cartão para exibir gráficos
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} props.title - Título do gráfico
 * @param {React.ReactNode} props.children - Conteúdo do gráfico
 * @param {boolean} props.loading - Indica se o gráfico está carregando
 * @param {string} props.error - Mensagem de erro, se houver
 * @param {Object} props.sx - Estilos adicionais para o Card
 */
const ChartCard = ({ title, children, loading = false, error = null, sx = {} }) => {
  return (
    <Card sx={{ height: '100%', ...sx }}>
      <CardHeader title={title} />
      <Divider />
      <CardContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <Box sx={{ height: 300, position: 'relative' }}>
            {children}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ChartCard;
