import React, { useState, useEffect } from 'react';
/*
 * MÓDULO EM DESENVOLVIMENTO
 * 
 * Este módulo de faturamento está em desenvolvimento e não está ativo no momento.
 * Quando estiver pronto para uso, remova os comentários nas rotas em App.js e
 * no item de menu em MainLayout.js.
 */
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Receipt as ReceiptIcon,
  Timeline as TimelineIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';

// Componentes
import SubscriptionDetails from '../components/billing/SubscriptionDetails';
import UsageMetrics from '../components/billing/UsageMetrics';
import InvoiceHistory from '../components/billing/InvoiceHistory';
import PlanSelector from '../components/billing/PlanSelector';
import PaymentMethodForm from '../components/billing/PaymentMethodForm';
import CancellationDialog from '../components/billing/CancellationDialog';

// Serviços
import billingService from '../services/billingService';

/**
 * Página de faturamento e assinaturas
 */
const Billing = () => {
  // Estados para os dados
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [usageData, setUsageData] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Estados para controle de UI
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState({
    subscription: false,
    plans: false,
    invoices: false,
    usage: false,
    action: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados para os diálogos
  const [planSelectorOpen, setPlanSelectorOpen] = useState(false);
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(false);
  const [cancellationOpen, setCancellationOpen] = useState(false);
  const [invoiceDetailsOpen, setInvoiceDetailsOpen] = useState(false);

  // Carrega os dados iniciais
  const fetchInitialData = async () => {
    setLoading(prev => ({ ...prev, subscription: true }));
    setError('');
    
    try {
      const subscriptionData = await billingService.getCurrentSubscription();
      setSubscription(subscriptionData);
    } catch (err) {
      console.error('Erro ao carregar dados da assinatura:', err);
      setError('Falha ao carregar os dados da assinatura. Por favor, tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, subscription: false }));
    }
  };

  // Carrega os planos disponíveis
  const fetchPlans = async () => {
    setLoading(prev => ({ ...prev, plans: true }));
    
    try {
      const plansData = await billingService.getAvailablePlans();
      setPlans(plansData);
    } catch (err) {
      console.error('Erro ao carregar planos disponíveis:', err);
    } finally {
      setLoading(prev => ({ ...prev, plans: false }));
    }
  };

  // Carrega o histórico de faturas
  const fetchInvoices = async () => {
    setLoading(prev => ({ ...prev, invoices: true }));
    
    try {
      const invoicesData = await billingService.getInvoiceHistory();
      setInvoices(invoicesData);
    } catch (err) {
      console.error('Erro ao carregar histórico de faturas:', err);
    } finally {
      setLoading(prev => ({ ...prev, invoices: false }));
    }
  };

  // Carrega os dados de uso
  const fetchUsageData = async () => {
    setLoading(prev => ({ ...prev, usage: true }));
    
    try {
      const usageData = await billingService.getUsageData();
      setUsageData(usageData);
    } catch (err) {
      console.error('Erro ao carregar dados de uso:', err);
    } finally {
      setLoading(prev => ({ ...prev, usage: false }));
    }
  };

  // Carrega todos os dados necessários para a tab atual
  const loadTabData = (tabIndex) => {
    switch (tabIndex) {
      case 0: // Assinatura
        fetchInitialData();
        fetchUsageData();
        break;
      case 1: // Planos
        fetchPlans();
        break;
      case 2: // Faturas
        fetchInvoices();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    loadTabData(tabValue);
  }, [tabValue]);

  // Manipula a alteração da tab
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Manipula a abertura do seletor de planos
  const handleOpenPlanSelector = () => {
    fetchPlans();
    setPlanSelectorOpen(true);
  };

  // Manipula a seleção de um plano
  const handleSelectPlan = async (planId, billingCycle) => {
    setLoading(prev => ({ ...prev, action: true }));
    setError('');
    setSuccess('');
    
    try {
      await billingService.updateSubscriptionPlan(planId);
      await fetchInitialData();
      setPlanSelectorOpen(false);
      setSuccess('Plano atualizado com sucesso!');
      
      // Limpa a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Erro ao atualizar plano:', err);
      setError('Falha ao atualizar o plano. Por favor, tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Manipula a abertura do formulário de método de pagamento
  const handleOpenPaymentMethod = () => {
    setPaymentMethodOpen(true);
  };

  // Manipula a atualização do método de pagamento
  const handleUpdatePaymentMethod = async (paymentData) => {
    setLoading(prev => ({ ...prev, action: true }));
    setError('');
    setSuccess('');
    
    try {
      await billingService.updatePaymentMethod(paymentData);
      await fetchInitialData();
      setPaymentMethodOpen(false);
      setSuccess('Método de pagamento atualizado com sucesso!');
      
      // Limpa a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Erro ao atualizar método de pagamento:', err);
      setError('Falha ao atualizar o método de pagamento. Por favor, tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Manipula a abertura do diálogo de cancelamento
  const handleOpenCancellation = () => {
    setCancellationOpen(true);
  };

  // Manipula o cancelamento da assinatura
  const handleCancelSubscription = async (data) => {
    setLoading(prev => ({ ...prev, action: true }));
    setError('');
    setSuccess('');
    
    try {
      await billingService.cancelSubscription(data);
      await fetchInitialData();
      setCancellationOpen(false);
      setSuccess('Assinatura cancelada com sucesso!');
      
      // Limpa a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Erro ao cancelar assinatura:', err);
      setError('Falha ao cancelar a assinatura. Por favor, tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Manipula a visualização de uma fatura
  const handleViewInvoice = async (invoiceId) => {
    setLoading(prev => ({ ...prev, action: true }));
    
    try {
      const invoiceDetails = await billingService.getInvoiceDetails(invoiceId);
      setSelectedInvoice(invoiceDetails);
      setInvoiceDetailsOpen(true);
    } catch (err) {
      console.error('Erro ao obter detalhes da fatura:', err);
      setError('Falha ao obter detalhes da fatura. Por favor, tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Manipula o download de uma fatura
  const handleDownloadInvoice = async (invoiceId) => {
    window.open(`${process.env.REACT_APP_API_URL}/billing/invoices/${invoiceId}/pdf`, '_blank');
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Faturamento e Assinatura
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="billing tabs"
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<AccountCircleIcon />} label="Assinatura" iconPosition="start" />
          <Tab icon={<PaymentIcon />} label="Planos" iconPosition="start" />
          <Tab icon={<ReceiptIcon />} label="Faturas" iconPosition="start" />
        </Tabs>
      </Paper>
      
      {/* Tab de Assinatura */}
      {tabValue === 0 && (
        <Box>
          <SubscriptionDetails
            subscription={subscription}
            onUpgrade={handleOpenPlanSelector}
            onCancel={handleOpenCancellation}
            onUpdatePayment={handleOpenPaymentMethod}
            loading={loading.subscription}
          />
          
          <UsageMetrics
            usage={usageData}
            loading={loading.usage}
          />
        </Box>
      )}
      
      {/* Tab de Planos */}
      {tabValue === 1 && (
        <PlanSelector
          plans={plans}
          currentPlanId={subscription?.planId}
          onSelectPlan={handleSelectPlan}
          loading={loading.plans}
        />
      )}
      
      {/* Tab de Faturas */}
      {tabValue === 2 && (
        <InvoiceHistory
          invoices={invoices}
          onViewInvoice={handleViewInvoice}
          onDownloadInvoice={handleDownloadInvoice}
          loading={loading.invoices}
        />
      )}
      
      {/* Diálogo de Seleção de Plano */}
      <Dialog
        open={planSelectorOpen}
        onClose={() => setPlanSelectorOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Escolha um Plano</DialogTitle>
        <DialogContent>
          <PlanSelector
            plans={plans}
            currentPlanId={subscription?.planId}
            onSelectPlan={handleSelectPlan}
            loading={loading.plans || loading.action}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlanSelectorOpen(false)} disabled={loading.action}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo de Método de Pagamento */}
      <Dialog
        open={paymentMethodOpen}
        onClose={() => !loading.action && setPaymentMethodOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <PaymentMethodForm
            currentPaymentMethod={subscription?.paymentMethod}
            onSubmit={handleUpdatePaymentMethod}
            onCancel={() => setPaymentMethodOpen(false)}
            loading={loading.action}
          />
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de Cancelamento */}
      <CancellationDialog
        open={cancellationOpen}
        onClose={() => setCancellationOpen(false)}
        onConfirm={handleCancelSubscription}
        loading={loading.action}
      />
      
      {/* Diálogo de Detalhes da Fatura */}
      <Dialog
        open={invoiceDetailsOpen}
        onClose={() => setInvoiceDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detalhes da Fatura</DialogTitle>
        <DialogContent>
          {selectedInvoice ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Fatura #{selectedInvoice.number}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body1">
                  <strong>Data:</strong> {new Date(selectedInvoice.date).toLocaleDateString('pt-BR')}
                </Typography>
                <Typography variant="body1">
                  <strong>Status:</strong> {selectedInvoice.status === 'paid' ? 'Pago' : selectedInvoice.status}
                </Typography>
              </Box>
              
              <Typography variant="body1" gutterBottom>
                <strong>Valor Total:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedInvoice.amount / 100)}
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                <strong>Método de Pagamento:</strong> {selectedInvoice.paymentMethod?.brand} •••• {selectedInvoice.paymentMethod?.last4}
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Itens
                </Typography>
                {selectedInvoice.items.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
                    <Typography variant="body2">
                      {item.description}
                    </Typography>
                    <Typography variant="body2">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount / 100)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => handleDownloadInvoice(selectedInvoice?.id)} 
            color="primary"
            disabled={!selectedInvoice}
          >
            Baixar PDF
          </Button>
          <Button onClick={() => setInvoiceDetailsOpen(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Billing;
