import React from 'react';
import { Box, Paper, Typography, Avatar } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * Card para exibir uma métrica individual
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} props.title - Título da métrica
 * @param {string|number} props.value - Valor da métrica
 * @param {React.ReactNode} props.icon - Ícone da métrica
 * @param {string} props.color - Cor do card
 * @param {string} props.subtitle - Subtítulo opcional
 */
const MetricCard = ({ title, value, icon, color, subtitle }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        borderLeft: `4px solid ${color}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h5" component="div" fontWeight="bold">
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Avatar
          sx={{
            bgcolor: `${color}20`,
            color: color,
            width: 48,
            height: 48
          }}
        >
          {icon}
        </Avatar>
      </Box>
    </Paper>
  );
};

MetricCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.node.isRequired,
  color: PropTypes.string,
  subtitle: PropTypes.string
};

MetricCard.defaultProps = {
  color: '#4e73df',
  subtitle: ''
};

export default MetricCard;
