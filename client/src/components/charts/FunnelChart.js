import React, { useRef, useEffect } from 'react';
import { Box, useTheme } from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import ChartCard from './ChartCard';

// Registra os componentes necessários do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * Componente de gráfico de funil
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} props.title - Título do gráfico
 * @param {Array} props.data - Dados do funil
 * @param {boolean} props.loading - Indica se o gráfico está carregando
 * @param {string} props.error - Mensagem de erro, se houver
 */
const FunnelChart = ({ title, data = [], loading = false, error = null }) => {
  const theme = useTheme();
  const chartRef = useRef(null);

  // Processa os dados para o formato do Chart.js
  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        data: data.map(item => item.value),
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.primary.light,
          theme.palette.secondary.main,
          theme.palette.secondary.light,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main,
        ],
        borderColor: theme.palette.background.paper,
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };

  // Opções do gráfico
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.formattedValue;
            const percentage = context.raw / context.dataset.data.reduce((a, b) => a + b, 0) * 100;
            return `${label}: ${value} (${percentage.toFixed(1)}%)`;
          }
        }
      },
    },
  };

  // Adiciona o plugin para mostrar o total no centro
  const plugins = [
    {
      id: 'centerText',
      beforeDraw: function(chart) {
        if (chart.config.type === 'doughnut') {
          // Calcula o total
          const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
          
          // Configura o texto
          const width = chart.width;
          const height = chart.height;
          const ctx = chart.ctx;
          
          ctx.restore();
          ctx.font = '16px Arial';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = theme.palette.text.primary;
          
          // Texto do total
          const text = `Total`;
          const textX = Math.round((width - ctx.measureText(text).width) / 2);
          const textY = height / 2 - 15;
          ctx.fillText(text, textX, textY);
          
          // Valor do total
          ctx.font = 'bold 24px Arial';
          const value = total.toLocaleString();
          const valueX = Math.round((width - ctx.measureText(value).width) / 2);
          const valueY = height / 2 + 15;
          ctx.fillText(value, valueX, valueY);
          
          ctx.save();
        }
      }
    }
  ];

  return (
    <ChartCard title={title} loading={loading} error={error}>
      <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
        <Doughnut 
          data={chartData} 
          options={options} 
          plugins={plugins}
          ref={chartRef}
        />
      </Box>
    </ChartCard>
  );
};

export default FunnelChart;
