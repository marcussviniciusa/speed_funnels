import React from 'react';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';

/**
 * Componente de cartão para exibir estatísticas
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} props.title - Título da estatística
 * @param {string|number} props.value - Valor da estatística
 * @param {React.ReactNode} props.icon - Ícone para a estatística
 * @param {string} props.color - Cor do ícone (primary, secondary, success, error, warning, info)
 * @param {boolean} props.loading - Indica se a estatística está carregando
 * @param {Object} props.sx - Estilos adicionais para o Card
 */
const StatCard = ({ 
  title, 
  value, 
  icon, 
  color = 'primary', 
  loading = false,
  sx = {} 
}) => {
  return (
    <Card sx={{ height: '100%', ...sx }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <Typography variant="h4" component="div">
                {value}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box 
              sx={{ 
                backgroundColor: `${color}.light`,
                borderRadius: 1,
                p: 1,
                color: `${color}.main`
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;
