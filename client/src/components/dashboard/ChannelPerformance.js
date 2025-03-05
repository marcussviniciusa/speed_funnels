import React from 'react';
import { Box, useTheme } from '@mui/material';
import BarChart from '../charts/BarChart';
import { formatCurrency, formatNumber } from '../../utils/formatters';

/**
 * Componente para exibir o desempenho por canal no dashboard
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Array} props.data - Dados de desempenho por canal
 * @param {boolean} props.loading - Indica se os dados estão carregando
 * @param {string} props.error - Mensagem de erro, se houver
 * @param {string} props.metric - Métrica a ser exibida (impressions, clicks, conversions, revenue)
 */
const ChannelPerformance = ({ 
  data = [], 
  loading = false, 
  error = null,
  metric = 'conversions'
}) => {
  const theme = useTheme();

  // Processa os dados para o formato do gráfico
  const processData = () => {
    if (!data || data.length === 0) return { labels: [], datasets: [] };

    // Ordena os dados pela métrica selecionada em ordem decrescente
    const sortedData = [...data].sort((a, b) => b[metric] - a[metric]);

    // Limita a 5 canais para melhor visualização
    const topChannels = sortedData.slice(0, 5);

    // Cores para cada canal
    const channelColors = {
      'facebook': theme.palette.primary.main,
      'instagram': theme.palette.secondary.main,
      'google': theme.palette.success.main,
      'youtube': theme.palette.error.main,
      'tiktok': theme.palette.warning.main,
      'linkedin': theme.palette.info.main,
      'twitter': theme.palette.grey[700],
      'email': theme.palette.grey[500],
      'organic': theme.palette.grey[400],
      'direct': theme.palette.grey[300],
    };

    return {
      labels: topChannels.map(item => item.channel),
      datasets: [
        {
          label: getMetricLabel(metric),
          data: topChannels.map(item => item[metric]),
          backgroundColor: topChannels.map(item => 
            channelColors[item.channel.toLowerCase()] || theme.palette.primary.main
          ),
          borderRadius: 4
        }
      ]
    };
  };

  // Retorna o rótulo da métrica
  const getMetricLabel = (metric) => {
    switch (metric) {
      case 'impressions':
        return 'Impressões';
      case 'clicks':
        return 'Cliques';
      case 'conversions':
        return 'Conversões';
      case 'revenue':
        return 'Receita';
      default:
        return 'Valor';
    }
  };

  // Configurações adicionais do gráfico
  const chartOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw;
            if (metric === 'revenue') {
              return `${getMetricLabel(metric)}: ${formatCurrency(value)}`;
            } else {
              return `${getMetricLabel(metric)}: ${formatNumber(value)}`;
            }
          }
        }
      }
    }
  };

  const chartData = processData();

  return (
    <BarChart
      title={`Desempenho por Canal (${getMetricLabel(metric)})`}
      labels={chartData.labels}
      datasets={chartData.datasets}
      loading={loading}
      error={error}
      options={chartOptions}
      horizontal={true}
    />
  );
};

export default ChannelPerformance;
