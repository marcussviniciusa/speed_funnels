import React, { useState } from 'react';
import { Box, ToggleButtonGroup, ToggleButton, useTheme } from '@mui/material';
import LineChart from '../charts/LineChart';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';

/**
 * Componente para exibir a tendência de métricas no dashboard
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Array} props.data - Dados de tendência
 * @param {boolean} props.loading - Indica se os dados estão carregando
 * @param {string} props.error - Mensagem de erro, se houver
 */
const MetricsTrend = ({ data = [], loading = false, error = null }) => {
  const theme = useTheme();
  const [selectedMetrics, setSelectedMetrics] = useState(['clicks', 'conversions']);

  // Manipula a alteração das métricas selecionadas
  const handleMetricsChange = (event, newMetrics) => {
    // Não permite desselecionar todas as métricas
    if (newMetrics.length) {
      setSelectedMetrics(newMetrics);
    }
  };

  // Processa os dados para o formato do gráfico
  const processData = () => {
    if (!data || data.length === 0) return { labels: [], datasets: [] };

    // Mapeia as métricas para os datasets
    const metricConfigs = {
      impressions: {
        label: 'Impressões',
        borderColor: theme.palette.primary.main,
        yAxisID: 'y1',
        formatter: formatNumber
      },
      clicks: {
        label: 'Cliques',
        borderColor: theme.palette.info.main,
        yAxisID: 'y1',
        formatter: formatNumber
      },
      conversions: {
        label: 'Conversões',
        borderColor: theme.palette.success.main,
        yAxisID: 'y1',
        formatter: formatNumber
      },
      revenue: {
        label: 'Receita',
        borderColor: theme.palette.warning.main,
        yAxisID: 'y2',
        formatter: formatCurrency
      },
      ctr: {
        label: 'CTR',
        borderColor: theme.palette.error.main,
        yAxisID: 'y3',
        formatter: formatPercentage
      },
      conversionRate: {
        label: 'Taxa de Conversão',
        borderColor: theme.palette.secondary.main,
        yAxisID: 'y3',
        formatter: formatPercentage
      }
    };

    // Cria os datasets para as métricas selecionadas
    const datasets = selectedMetrics.map(metric => ({
      label: metricConfigs[metric].label,
      data: data.map(item => item[metric]),
      borderColor: metricConfigs[metric].borderColor,
      yAxisID: metricConfigs[metric].yAxisID,
      formatter: metricConfigs[metric].formatter
    }));

    return {
      labels: data.map(item => item.date),
      datasets
    };
  };

  const chartData = processData();

  // Configurações adicionais do gráfico
  const chartOptions = {
    scales: {
      y1: {
        type: 'linear',
        display: selectedMetrics.some(m => ['impressions', 'clicks', 'conversions'].includes(m)),
        position: 'left',
        title: {
          display: true,
          text: 'Contagem'
        },
        grid: {
          drawOnChartArea: false
        }
      },
      y2: {
        type: 'linear',
        display: selectedMetrics.includes('revenue'),
        position: 'right',
        title: {
          display: true,
          text: 'Receita (R$)'
        },
        grid: {
          drawOnChartArea: false
        }
      },
      y3: {
        type: 'linear',
        display: selectedMetrics.some(m => ['ctr', 'conversionRate'].includes(m)),
        position: 'right',
        title: {
          display: true,
          text: 'Taxa (%)'
        },
        min: 0,
        max: 100,
        grid: {
          drawOnChartArea: false
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            const dataset = context.dataset;
            const value = context.raw;
            const formatter = dataset.formatter || (val => val);
            return `${dataset.label}: ${formatter(value)}`;
          }
        }
      }
    }
  };

  return (
    <Box sx={{ height: '100%' }}>
      <LineChart
        title="Tendência de Métricas"
        labels={chartData.labels}
        datasets={chartData.datasets}
        loading={loading}
        error={error}
        options={chartOptions}
      />
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <ToggleButtonGroup
          value={selectedMetrics}
          onChange={handleMetricsChange}
          aria-label="métricas selecionadas"
          size="small"
        >
          <ToggleButton value="impressions" aria-label="impressões">
            Impressões
          </ToggleButton>
          <ToggleButton value="clicks" aria-label="cliques">
            Cliques
          </ToggleButton>
          <ToggleButton value="conversions" aria-label="conversões">
            Conversões
          </ToggleButton>
          <ToggleButton value="revenue" aria-label="receita">
            Receita
          </ToggleButton>
          <ToggleButton value="ctr" aria-label="ctr">
            CTR
          </ToggleButton>
          <ToggleButton value="conversionRate" aria-label="taxa de conversão">
            Taxa Conv.
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
};

export default MetricsTrend;
