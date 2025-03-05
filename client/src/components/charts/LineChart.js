import React from 'react';
import { Box, useTheme } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import ChartCard from './ChartCard';

// Registra os componentes necessários do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Componente de gráfico de linha
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} props.title - Título do gráfico
 * @param {Array} props.labels - Rótulos do eixo X
 * @param {Array} props.datasets - Conjuntos de dados
 * @param {boolean} props.loading - Indica se o gráfico está carregando
 * @param {string} props.error - Mensagem de erro, se houver
 * @param {Object} props.options - Opções adicionais para o gráfico
 */
const LineChart = ({ 
  title, 
  labels = [], 
  datasets = [], 
  loading = false, 
  error = null,
  options = {}
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
    borderColor: dataset.borderColor || defaultColors[index % defaultColors.length],
    backgroundColor: dataset.backgroundColor || 
      `${defaultColors[index % defaultColors.length]}20`, // Adiciona transparência
    borderWidth: dataset.borderWidth || 2,
    pointRadius: dataset.pointRadius || 3,
    pointBackgroundColor: dataset.pointBackgroundColor || 
      defaultColors[index % defaultColors.length],
    tension: dataset.tension || 0.4,
    fill: dataset.fill !== undefined ? dataset.fill : false,
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
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
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
        <Line data={chartData} options={chartOptions} />
      </Box>
    </ChartCard>
  );
};

export default LineChart;
