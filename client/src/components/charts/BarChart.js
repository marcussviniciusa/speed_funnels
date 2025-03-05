import React from 'react';
import { Box, useTheme } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ChartCard from './ChartCard';

// Registra os componentes necessários do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Componente de gráfico de barras
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} props.title - Título do gráfico
 * @param {Array} props.labels - Rótulos do eixo X
 * @param {Array} props.datasets - Conjuntos de dados
 * @param {boolean} props.loading - Indica se o gráfico está carregando
 * @param {string} props.error - Mensagem de erro, se houver
 * @param {Object} props.options - Opções adicionais para o gráfico
 * @param {boolean} props.horizontal - Se verdadeiro, o gráfico será horizontal
 */
const BarChart = ({ 
  title, 
  labels = [], 
  datasets = [], 
  loading = false, 
  error = null,
  options = {},
  horizontal = false
}) => {
  const theme = useTheme();

  // Cores padrão para os datasets
  const defaultColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
  ];

  // Processa os datasets para adicionar cores e estilos
  const processedDatasets = datasets.map((dataset, index) => ({
    label: dataset.label,
    data: dataset.data,
    backgroundColor: dataset.backgroundColor || 
      (Array.isArray(dataset.data) 
        ? dataset.data.map((_, i) => defaultColors[i % defaultColors.length])
        : defaultColors[index % defaultColors.length]),
    borderColor: dataset.borderColor || 'transparent',
    borderWidth: dataset.borderWidth || 1,
    borderRadius: dataset.borderRadius || 4,
    ...dataset
  }));

  // Dados do gráfico
  const chartData = {
    labels,
    datasets: processedDatasets,
  };

  // Opções padrão do gráfico
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 10,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
      },
      y: {
        grid: {
          color: theme.palette.divider,
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
        beginAtZero: true,
      },
    },
  };

  // Mescla as opções padrão com as opções personalizadas
  const chartOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins,
    },
    scales: {
      ...defaultOptions.scales,
      ...options.scales,
    },
  };

  return (
    <ChartCard title={title} loading={loading} error={error}>
      <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
        <Bar data={chartData} options={chartOptions} />
      </Box>
    </ChartCard>
  );
};

export default BarChart;
