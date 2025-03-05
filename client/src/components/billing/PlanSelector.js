import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

/**
 * Componente para seleção de planos de assinatura
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Array} props.plans - Lista de planos disponíveis
 * @param {string} props.currentPlanId - ID do plano atual
 * @param {Function} props.onSelectPlan - Função chamada ao selecionar um plano
 * @param {boolean} props.loading - Indica se o componente está carregando
 */
const PlanSelector = ({
  plans = [],
  currentPlanId = '',
  onSelectPlan,
  loading = false
}) => {
  const [billingCycle, setBillingCycle] = useState('monthly');

  // Manipula a alteração do ciclo de faturamento
  const handleBillingCycleChange = (event, newBillingCycle) => {
    if (newBillingCycle !== null) {
      setBillingCycle(newBillingCycle);
    }
  };

  // Verifica se um plano é o plano atual
  const isCurrentPlan = (planId) => {
    return planId === currentPlanId;
  };

  // Calcula o desconto anual
  const calculateAnnualDiscount = (monthlyPrice, annualPrice) => {
    const monthlyTotal = monthlyPrice * 12;
    const discount = ((monthlyTotal - annualPrice) / monthlyTotal) * 100;
    return Math.round(discount);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Planos Disponíveis
        </Typography>
        <ToggleButtonGroup
          value={billingCycle}
          exclusive
          onChange={handleBillingCycleChange}
          aria-label="ciclo de faturamento"
          size="small"
        >
          <ToggleButton value="monthly" aria-label="mensal">
            Mensal
          </ToggleButton>
          <ToggleButton value="annual" aria-label="anual">
            Anual
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {plans.map((plan) => (
          <Grid item xs={12} md={4} key={plan.id}>
            <Card 
              elevation={3} 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                position: 'relative',
                border: isCurrentPlan(plan.id) ? '2px solid' : 'none',
                borderColor: 'primary.main'
              }}
            >
              {isCurrentPlan(plan.id) && (
                <Chip
                  label="Plano Atual"
                  color="primary"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10
                  }}
                />
              )}
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  {plan.name}
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  {plan.description}
                </Typography>
                
                <Box sx={{ my: 2 }}>
                  <Typography variant="h4" color="primary" component="div">
                    {new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    }).format(billingCycle === 'monthly' ? plan.monthlyPrice / 100 : plan.annualPrice / 100)}
                    <Typography variant="caption" color="textSecondary" component="span" sx={{ ml: 1 }}>
                      /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                    </Typography>
                  </Typography>
                  
                  {billingCycle === 'annual' && (
                    <Typography variant="caption" color="success.main">
                      Economize {calculateAnnualDiscount(plan.monthlyPrice, plan.annualPrice)}% com o plano anual
                    </Typography>
                  )}
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <List dense disablePadding>
                  {plan.features.map((feature, index) => (
                    <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        {feature.included ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <CancelIcon color="disabled" fontSize="small" />
                        )}
                      </ListItemIcon>
                      <ListItemText 
                        primary={feature.text} 
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          color: feature.included ? 'textPrimary' : 'textSecondary'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button 
                  fullWidth 
                  variant={isCurrentPlan(plan.id) ? "outlined" : "contained"}
                  color={isCurrentPlan(plan.id) ? "primary" : "primary"}
                  onClick={() => onSelectPlan(plan.id, billingCycle)}
                  disabled={isCurrentPlan(plan.id)}
                >
                  {isCurrentPlan(plan.id) ? 'Plano Atual' : 'Selecionar Plano'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default PlanSelector;
