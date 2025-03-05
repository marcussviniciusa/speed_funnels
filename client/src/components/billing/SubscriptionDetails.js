import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  CreditCard as CreditCardIcon,
  CalendarToday as CalendarTodayIcon,
  ArrowUpward as ArrowUpwardIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { formatCurrency, formatDate, formatCreditCard, formatBillingPeriod } from '../../utils/formatters';

/**
 * Componente para exibir detalhes da assinatura
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.subscription - Dados da assinatura
 * @param {Function} props.onUpgrade - Função chamada ao clicar em atualizar plano
 * @param {Function} props.onCancel - Função chamada ao clicar em cancelar assinatura
 * @param {Function} props.onUpdatePayment - Função chamada ao clicar em atualizar método de pagamento
 * @param {boolean} props.loading - Indica se o componente está carregando
 */
const SubscriptionDetails = ({
  subscription = {},
  onUpgrade,
  onCancel,
  onUpdatePayment,
  loading = false
}) => {
  // Renderiza o status da assinatura
  const renderStatus = (status) => {
    switch (status) {
      case 'active':
        return <Chip label="Ativa" color="success" />;
      case 'canceled':
        return <Chip label="Cancelada" color="error" />;
      case 'past_due':
        return <Chip label="Pagamento Pendente" color="warning" />;
      case 'trialing':
        return <Chip label="Período de Teste" color="info" />;
      default:
        return <Chip label={status} />;
    }
  };

  if (loading) {
    return (
      <Paper elevation={0} sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Detalhes da Assinatura
        </Typography>
        {renderStatus(subscription.status)}
      </Box>
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Plano Atual
          </Typography>
          <Typography variant="h5" color="primary" gutterBottom>
            {subscription.planName || 'Plano não encontrado'}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {subscription.planDescription || 'Sem descrição disponível'}
          </Typography>

          <Box sx={{ mt: 2, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Recursos Incluídos:
            </Typography>
            <List dense disablePadding>
              {(subscription.features || []).map((feature, index) => (
                <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={feature} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Informações de Pagamento
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CreditCardIcon sx={{ mr: 1 }} color="action" />
              <Typography variant="body1">
                {formatCreditCard(subscription.paymentMethod)}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={onUpdatePayment}
              sx={{ mt: 1 }}
            >
              Atualizar Método de Pagamento
            </Button>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Ciclo de Faturamento
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CalendarTodayIcon sx={{ mr: 1 }} color="action" />
              <Typography variant="body1">
                {subscription.interval === 'month' ? 'Mensal' : 'Anual'} - Próxima cobrança em {formatDate(subscription.currentPeriodEnd)}
              </Typography>
            </Box>
            <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
              {formatCurrency(subscription.amount / 100)} / {subscription.interval === 'month' ? 'mês' : 'ano'}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<CancelIcon />}
          onClick={onCancel}
          disabled={subscription.status === 'canceled'}
        >
          Cancelar Assinatura
        </Button>
        <Button
          variant="contained"
          startIcon={<ArrowUpwardIcon />}
          onClick={onUpgrade}
        >
          Atualizar Plano
        </Button>
      </Box>
    </Paper>
  );
};

export default SubscriptionDetails;
