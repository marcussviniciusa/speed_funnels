import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  LinearProgress,
  Grid,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Info as InfoIcon
} from '@mui/icons-material';

/**
 * Componente para exibir métricas de uso
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.usage - Dados de uso
 * @param {boolean} props.loading - Indica se o componente está carregando
 */
const UsageMetrics = ({
  usage = {},
  loading = false
}) => {
  // Calcula a porcentagem de uso
  const calculatePercentage = (used, limit) => {
    if (!limit) return 0;
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  // Determina a cor da barra de progresso com base na porcentagem
  const getProgressColor = (percentage) => {
    if (percentage < 70) return 'success';
    if (percentage < 90) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Paper elevation={0} sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Uso Atual
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {/* Relatórios */}
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1">
                Relatórios
              </Typography>
              <Tooltip title="Número de relatórios gerados no ciclo atual">
                <InfoIcon fontSize="small" color="action" sx={{ ml: 1 }} />
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="textSecondary">
                {usage.reports?.used || 0} de {usage.reports?.limit || 0} relatórios
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {calculatePercentage(usage.reports?.used || 0, usage.reports?.limit || 0)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={calculatePercentage(usage.reports?.used || 0, usage.reports?.limit || 0)}
              color={getProgressColor(calculatePercentage(usage.reports?.used || 0, usage.reports?.limit || 0))}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </Grid>

        {/* Integrações */}
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1">
                Integrações
              </Typography>
              <Tooltip title="Número de integrações ativas">
                <InfoIcon fontSize="small" color="action" sx={{ ml: 1 }} />
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="textSecondary">
                {usage.integrations?.used || 0} de {usage.integrations?.limit || 0} integrações
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {calculatePercentage(usage.integrations?.used || 0, usage.integrations?.limit || 0)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={calculatePercentage(usage.integrations?.used || 0, usage.integrations?.limit || 0)}
              color={getProgressColor(calculatePercentage(usage.integrations?.used || 0, usage.integrations?.limit || 0))}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </Grid>

        {/* Usuários */}
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1">
                Usuários
              </Typography>
              <Tooltip title="Número de usuários na sua conta">
                <InfoIcon fontSize="small" color="action" sx={{ ml: 1 }} />
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="textSecondary">
                {usage.users?.used || 0} de {usage.users?.limit || 0} usuários
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {calculatePercentage(usage.users?.used || 0, usage.users?.limit || 0)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={calculatePercentage(usage.users?.used || 0, usage.users?.limit || 0)}
              color={getProgressColor(calculatePercentage(usage.users?.used || 0, usage.users?.limit || 0))}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </Grid>

        {/* Armazenamento */}
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1">
                Armazenamento
              </Typography>
              <Tooltip title="Espaço de armazenamento utilizado">
                <InfoIcon fontSize="small" color="action" sx={{ ml: 1 }} />
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="textSecondary">
                {(usage.storage?.used / 1024 / 1024).toFixed(2) || 0} MB de {(usage.storage?.limit / 1024 / 1024).toFixed(2) || 0} MB
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {calculatePercentage(usage.storage?.used || 0, usage.storage?.limit || 0)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={calculatePercentage(usage.storage?.used || 0, usage.storage?.limit || 0)}
              color={getProgressColor(calculatePercentage(usage.storage?.used || 0, usage.storage?.limit || 0))}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="textSecondary">
          Período atual: {usage.currentPeriodStart ? new Date(usage.currentPeriodStart).toLocaleDateString('pt-BR') : ''} a {usage.currentPeriodEnd ? new Date(usage.currentPeriodEnd).toLocaleDateString('pt-BR') : ''}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Os limites serão renovados no próximo ciclo de faturamento.
        </Typography>
      </Box>
    </Paper>
  );
};

export default UsageMetrics;
