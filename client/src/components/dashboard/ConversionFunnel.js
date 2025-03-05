import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import FunnelChart from '../charts/FunnelChart';
import { formatNumber, formatPercentage } from '../../utils/formatters';

/**
 * Componente para exibir o funil de conversão no dashboard
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.data - Dados do funil de conversão
 * @param {boolean} props.loading - Indica se os dados estão carregando
 * @param {string} props.error - Mensagem de erro, se houver
 */
const ConversionFunnel = ({ data = {}, loading = false, error = null }) => {
  const theme = useTheme();

  // Processa os dados para o formato do gráfico
  const processData = () => {
    if (!data || !data.steps || data.steps.length === 0) return [];

    return data.steps.map(step => ({
      label: step.name,
      value: step.count
    }));
  };

  // Calcula as taxas de conversão entre as etapas
  const calculateRates = () => {
    if (!data || !data.steps || data.steps.length < 2) return [];

    const rates = [];
    for (let i = 0; i < data.steps.length - 1; i++) {
      const currentStep = data.steps[i];
      const nextStep = data.steps[i + 1];
      
      const rate = currentStep.count > 0 
        ? (nextStep.count / currentStep.count) * 100 
        : 0;
      
      rates.push({
        from: currentStep.name,
        to: nextStep.name,
        rate
      });
    }

    return rates;
  };

  const chartData = processData();
  const conversionRates = calculateRates();

  return (
    <Box sx={{ height: '100%' }}>
      <FunnelChart
        title="Funil de Conversão"
        data={chartData}
        loading={loading}
        error={error}
      />
      
      {!loading && !error && conversionRates.length > 0 && (
        <Box sx={{ mt: 2, px: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Taxas de Conversão
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {conversionRates.map((rate, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1,
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider'
                }}
              >
                <Typography variant="body2">
                  {rate.from} → {rate.to}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: rate.rate >= 10 ? 'success.main' : 
                           rate.rate >= 5 ? 'warning.main' : 'error.main'
                  }}
                >
                  {formatPercentage(rate.rate)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ConversionFunnel;
