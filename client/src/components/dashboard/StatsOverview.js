import React from 'react';
import { Grid } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import StatCard from './StatCard';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';

/**
 * Componente para exibir as estatísticas gerais do dashboard
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.stats - Dados das estatísticas
 * @param {boolean} props.loading - Indica se os dados estão carregando
 */
const StatsOverview = ({ stats = {}, loading = false }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Impressões"
          value={loading ? '' : formatNumber(stats.impressions || 0)}
          icon={<TrendingUpIcon />}
          color="primary"
          loading={loading}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Cliques"
          value={loading ? '' : formatNumber(stats.clicks || 0)}
          icon={<PeopleIcon />}
          color="info"
          loading={loading}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Conversões"
          value={loading ? '' : formatNumber(stats.conversions || 0)}
          icon={<ShoppingCartIcon />}
          color="success"
          loading={loading}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Receita"
          value={loading ? '' : formatCurrency(stats.revenue || 0)}
          icon={<AttachMoneyIcon />}
          color="warning"
          loading={loading}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="CTR"
          value={loading ? '' : formatPercentage(stats.ctr || 0)}
          icon={<TrendingUpIcon />}
          color="primary"
          loading={loading}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Taxa de Conversão"
          value={loading ? '' : formatPercentage(stats.conversionRate || 0)}
          icon={<TrendingUpIcon />}
          color="info"
          loading={loading}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="CPC Médio"
          value={loading ? '' : formatCurrency(stats.averageCpc || 0)}
          icon={<AttachMoneyIcon />}
          color="success"
          loading={loading}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="ROAS"
          value={loading ? '' : `${stats.roas?.toFixed(2)}x` || '0.00x'}
          icon={<AttachMoneyIcon />}
          color="warning"
          loading={loading}
        />
      </Grid>
    </Grid>
  );
};

export default StatsOverview;
