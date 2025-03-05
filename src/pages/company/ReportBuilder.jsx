import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Checkbox, 
  FormControlLabel, 
  FormGroup, 
  Divider, 
  Stepper, 
  Step, 
  StepLabel,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  FormHelperText
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  Clear as ClearIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import api from '../../services/authService';
import Layout from '../../components/Layout';

const steps = [
  'Informações Básicas',
  'Selecionar Plataformas',
  'Configurar Métricas',
  'Visualização e Finalização'
];

// Configurações disponíveis para cada plataforma
const platformOptions = {
  meta: {
    name: 'Meta Ads',
    metrics: [
      { id: 'spend', name: 'Gastos', checked: true },
      { id: 'clicks', name: 'Cliques', checked: true },
      { id: 'impressions', name: 'Impressões', checked: true },
      { id: 'ctr', name: 'CTR', checked: true },
      { id: 'cpc', name: 'CPC', checked: false },
      { id: 'reach', name: 'Alcance', checked: false },
      { id: 'frequency', name: 'Frequência', checked: false },
      { id: 'conversions', name: 'Conversões', checked: false },
      { id: 'cost_per_conversion', name: 'Custo por Conversão', checked: false }
    ],
    dimensions: [
      { id: 'campaign_name', name: 'Campanha', checked: true },
      { id: 'adset_name', name: 'Conjunto de Anúncios', checked: false },
      { id: 'ad_name', name: 'Anúncio', checked: false },
      { id: 'age', name: 'Idade', checked: false },
      { id: 'gender', name: 'Gênero', checked: false },
      { id: 'country', name: 'País', checked: false },
      { id: 'placement', name: 'Posicionamento', checked: false }
    ]
  },
  google_analytics: {
    name: 'Google Analytics',
    metrics: [
      { id: 'users', name: 'Usuários', checked: true },
      { id: 'newUsers', name: 'Novos Usuários', checked: true },
      { id: 'sessions', name: 'Sessões', checked: true },
      { id: 'bounceRate', name: 'Taxa de Rejeição', checked: true },
      { id: 'avgSessionDuration', name: 'Duração Média da Sessão', checked: true },
      { id: 'pageviews', name: 'Visualizações de Página', checked: false },
      { id: 'pagesPerSession', name: 'Páginas por Sessão', checked: false },
      { id: 'goalCompletions', name: 'Conclusões de Objetivo', checked: false },
      { id: 'goalConversionRate', name: 'Taxa de Conversão', checked: false }
    ],
    dimensions: [
      { id: 'date', name: 'Data', checked: true },
      { id: 'deviceCategory', name: 'Dispositivo', checked: false },
      { id: 'source', name: 'Fonte', checked: true },
      { id: 'medium', name: 'Meio', checked: false },
      { id: 'campaign', name: 'Campanha', checked: false },
      { id: 'country', name: 'País', checked: false },
      { id: 'city', name: 'Cidade', checked: false }
    ]
  }
};

const ReportBuilder = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Informações básicas
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportNameError, setReportNameError] = useState('');
  
  // Configuração de plataformas
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [availableConnections, setAvailableConnections] = useState([]);
  
  // Configuração de métricas
  const [metricsConfig, setMetricsConfig] = useState({
    meta: { ...platformOptions.meta },
    google_analytics: { ...platformOptions.google_analytics }
  });
  
  // Configuração de compartilhamento
  const [isPublicShare, setIsPublicShare] = useState(false);
  const [expirationDays, setExpirationDays] = useState(30);
  
  // Carregar integrações disponíveis
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obter companyId do usuário ou da URL
        // Para este exemplo, vamos assumir que está no localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        const companyId = user.companyId;
        
        const response = await api.get(`/integrations/company/${companyId}`);
        setAvailableConnections(response.data.integrations || []);
      } catch (err) {
        setError('Erro ao carregar integrações. Verifique se você tem conexões ativas.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConnections();
  }, []);
  
  const handleNext = () => {
    if (activeStep === 0) {
      // Validar nome do relatório
      if (!reportName.trim()) {
        setReportNameError('O nome do relatório é obrigatório');
        return;
      }
      setReportNameError('');
    } else if (activeStep === 1) {
      // Validar seleção de plataformas
      if (selectedPlatforms.length === 0) {
        setError('Selecione pelo menos uma plataforma');
        return;
      }
      setError(null);
    }
    
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  const handlePlatformToggle = (platform) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platform)) {
        return prev.filter(p => p !== platform);
      } else {
        return [...prev, platform];
      }
    });
  };
  
  const handleMetricToggle = (platform, category, metricId) => {
    setMetricsConfig(prev => {
      const updatedConfig = { ...prev };
      const metrics = [...updatedConfig[platform][category]];
      const index = metrics.findIndex(m => m.id === metricId);
      
      if (index !== -1) {
        metrics[index] = { 
          ...metrics[index], 
          checked: !metrics[index].checked 
        };
      }
      
      updatedConfig[platform] = {
        ...updatedConfig[platform],
        [category]: metrics
      };
      
      return updatedConfig;
    });
  };
  
  const handleCreateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Preparar dados do relatório
      const reportData = {
        name: reportName,
        description: reportDescription,
        platforms: selectedPlatforms,
        config: {
          metrics: selectedPlatforms.reduce((acc, platform) => {
            acc[platform] = {
              metrics: metricsConfig[platform].metrics
                .filter(m => m.checked)
                .map(m => m.id),
              dimensions: metricsConfig[platform].dimensions
                .filter(d => d.checked)
                .map(d => d.id)
            };
            return acc;
          }, {}),
          isPublic: isPublicShare,
          expirationDays: isPublicShare ? expirationDays : null
        }
      };
      
      // Enviar para API
      const response = await api.post('/reports/create', reportData);
      
      setSuccess(true);
      
      // Criar link público se solicitado
      if (isPublicShare && response.data.report.id) {
        await api.post(`/reports/${response.data.report.id}/share`, {
          expirationDays
        });
      }
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/company/reports/library');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar relatório');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Informações Básicas do Relatório
            </Typography>
            
            <TextField
              fullWidth
              label="Nome do Relatório *"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              margin="normal"
              error={!!reportNameError}
              helperText={reportNameError}
              required
            />
            
            <TextField
              fullWidth
              label="Descrição (opcional)"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              margin="normal"
              multiline
              rows={4}
            />
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Selecionar Plataformas
            </Typography>
            
            <Typography variant="body2" color="textSecondary" paragraph>
              Selecione as plataformas que deseja incluir neste relatório.
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            ) : (
              <Grid container spacing={3}>
                {availableConnections.length > 0 ? (
                  availableConnections.map((connection) => (
                    <Grid item xs={12} sm={6} md={4} key={connection.id}>
                      <Card 
                        sx={{ 
                          height: '100%',
                          border: selectedPlatforms.includes(connection.platform) 
                            ? '2px solid #2196f3' 
                            : '1px solid #e0e0e0'
                        }}
                      >
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {connection.platform === 'meta' ? 'Meta Ads' : 'Google Analytics'}
                          </Typography>
                          
                          <Typography variant="body2" color="textSecondary">
                            Conta: {connection.accountId}
                          </Typography>
                          
                          <Button
                            variant={selectedPlatforms.includes(connection.platform) ? "contained" : "outlined"}
                            color="primary"
                            onClick={() => handlePlatformToggle(connection.platform)}
                            sx={{ mt: 2 }}
                            fullWidth
                          >
                            {selectedPlatforms.includes(connection.platform) ? "Selecionado" : "Selecionar"}
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Alert severity="warning">
                      Você não tem integrações configuradas. Vá para a página de integrações para conectar suas contas.
                    </Alert>
                  </Grid>
                )}
              </Grid>
            )}
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configurar Métricas
            </Typography>
            
            <Typography variant="body2" color="textSecondary" paragraph>
              Selecione as métricas e dimensões que deseja incluir no relatório para cada plataforma.
            </Typography>
            
            {selectedPlatforms.length === 0 ? (
              <Alert severity="warning">
                Nenhuma plataforma selecionada. Volte ao passo anterior e selecione pelo menos uma plataforma.
              </Alert>
            ) : (
              <Box>
                {selectedPlatforms.map((platform) => (
                  <Paper key={platform} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      {platformOptions[platform].name}
                    </Typography>
                    
                    <Typography variant="subtitle1" sx={{ mt: 2 }}>
                      Métricas
                    </Typography>
                    <FormGroup row>
                      {metricsConfig[platform].metrics.map((metric) => (
                        <FormControlLabel
                          key={metric.id}
                          control={
                            <Checkbox
                              checked={metric.checked}
                              onChange={() => handleMetricToggle(platform, 'metrics', metric.id)}
                              name={metric.id}
                            />
                          }
                          label={metric.name}
                          sx={{ width: '33%', mb: 1 }}
                        />
                      ))}
                    </FormGroup>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle1">
                      Dimensões
                    </Typography>
                    <FormGroup row>
                      {metricsConfig[platform].dimensions.map((dimension) => (
                        <FormControlLabel
                          key={dimension.id}
                          control={
                            <Checkbox
                              checked={dimension.checked}
                              onChange={() => handleMetricToggle(platform, 'dimensions', dimension.id)}
                              name={dimension.id}
                            />
                          }
                          label={dimension.name}
                          sx={{ width: '33%', mb: 1 }}
                        />
                      ))}
                    </FormGroup>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        );
      
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Revisar e Finalizar
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Resumo do Relatório
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Nome:</strong> {reportName}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Plataformas:</strong> {selectedPlatforms.map(p => 
                      p === 'meta' ? 'Meta Ads' : 'Google Analytics'
                    ).join(', ')}
                  </Typography>
                </Grid>
                
                {reportDescription && (
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Descrição:</strong> {reportDescription}
                    </Typography>
                  </Grid>
                )}
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Métricas Selecionadas
              </Typography>
              
              {selectedPlatforms.map(platform => (
                <Box key={platform} sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {platform === 'meta' ? 'Meta Ads' : 'Google Analytics'}:
                  </Typography>
                  <Typography variant="body2">
                    <strong>Métricas:</strong> {metricsConfig[platform].metrics
                      .filter(m => m.checked)
                      .map(m => m.name)
                      .join(', ')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Dimensões:</strong> {metricsConfig[platform].dimensions
                      .filter(d => d.checked)
                      .map(d => d.name)
                      .join(', ')}
                  </Typography>
                </Box>
              ))}
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Opções de Compartilhamento
              </Typography>
              
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={isPublicShare} 
                    onChange={(e) => setIsPublicShare(e.target.checked)} 
                  />
                }
                label="Criar link de compartilhamento público"
              />
              
              {isPublicShare && (
                <Box mt={2}>
                  <FormControl fullWidth>
                    <InputLabel id="expiration-label">Expiração do Link</InputLabel>
                    <Select
                      labelId="expiration-label"
                      value={expirationDays}
                      onChange={(e) => setExpirationDays(e.target.value)}
                      label="Expiração do Link"
                    >
                      <MenuItem value={7}>7 dias</MenuItem>
                      <MenuItem value={30}>30 dias</MenuItem>
                      <MenuItem value={90}>90 dias</MenuItem>
                      <MenuItem value={365}>1 ano</MenuItem>
                      <MenuItem value={0}>Sem expiração</MenuItem>
                    </Select>
                    <FormHelperText>
                      Definir quando o link de compartilhamento expira
                    </FormHelperText>
                  </FormControl>
                </Box>
              )}
            </Paper>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>Relatório criado com sucesso!</Alert>}
          </Box>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <Layout>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Criar Novo Relatório
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ my: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box mt={4}>
          {renderStepContent(activeStep)}
        </Box>
        
        <Box mt={4} display="flex" justifyContent="space-between">
          <Button
            variant="outlined"
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
          >
            Voltar
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateReport}
              disabled={loading}
              startIcon={<SaveIcon />}
            >
              {loading ? 'Criando...' : 'Criar Relatório'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
              endIcon={<ArrowForwardIcon />}
            >
              Próximo
            </Button>
          )}
        </Box>
      </Paper>
    </Layout>
  );
};

export default ReportBuilder;
