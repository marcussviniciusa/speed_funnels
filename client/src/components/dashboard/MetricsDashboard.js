import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab
} from '@mui/material';
import {
  DatePicker,
  LocalizationProvider
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ptBR from 'date-fns/locale/pt-BR';
import { format, subDays } from 'date-fns';
import {
  Facebook as FacebookIcon,
  Google as GoogleIcon,
  TrendingUp as TrendingUpIcon,
  MonetizationOn as MonetizationOnIcon,
  People as PeopleIcon,
  TouchApp as TouchAppIcon
} from '@mui/icons-material';

// Importar componentes de gráficos
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Importar serviços
import metricsService from '../../services/metricsService';
import integrationService from '../../services/integrationService';

// Componentes
import MetricCard from './MetricCard';
import NoDataPlaceholder from './NoDataPlaceholder';

/**
 * Dashboard de métricas das integrações
 * 
 * @param {Object} props - Propriedades do componente
 */
const MetricsDashboard = () => {
  // Estados para dados
  const [metaAccounts, setMetaAccounts] = useState([]);
  const [googleProperties, setGoogleProperties] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [chartData, setChartData] = useState(null);
  
  // Estados para seleção
  const [selectedMetaAccount, setSelectedMetaAccount] = useState('');
  const [selectedGoogleProperty, setSelectedGoogleProperty] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date()
  });
  const [tabValue, setTabValue] = useState(0);
  
  // Estados para UI
  const [loading, setLoading] = useState({
    accounts: false,
    metrics: false
  });
  const [error, setError] = useState('');
  
  // Carregar contas e propriedades
  useEffect(() => {
    fetchAccounts();
  }, []);
  
  // Buscar contas e propriedades
  const fetchAccounts = async () => {
    setLoading(prev => ({ ...prev, accounts: true }));
    setError('');
    
    try {
      // Buscar contas do Meta Ads
      const metaResponse = await metricsService.getMetaAdAccounts();
      setMetaAccounts(metaResponse.data || []);
      
      // Buscar propriedades do Google Analytics
      const googleResponse = await metricsService.getGoogleProperties();
      setGoogleProperties(googleResponse.data || []);
      
      // Selecionar a primeira conta/propriedade por padrão
      if (metaResponse.data?.length > 0) {
        setSelectedMetaAccount(metaResponse.data[0].id);
      }
      
      if (googleResponse.data?.length > 0) {
        setSelectedGoogleProperty(googleResponse.data[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar contas:', err);
      setError('Não foi possível carregar as contas. Verifique suas integrações.');
    } finally {
      setLoading(prev => ({ ...prev, accounts: false }));
    }
  };
  
  // Buscar métricas quando a seleção mudar
  useEffect(() => {
    if (selectedMetaAccount || selectedGoogleProperty) {
      fetchMetrics();
    }
  }, [selectedMetaAccount, selectedGoogleProperty, dateRange]);
  
  // Buscar métricas
  const fetchMetrics = async () => {
    setLoading(prev => ({ ...prev, metrics: true }));
    setError('');
    
    try {
      const formattedDateRange = {
        startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
        endDate: format(dateRange.endDate, 'yyyy-MM-dd')
      };
      
      let metaMetrics = null;
      let googleMetrics = null;
      
      // Buscar métricas do Meta Ads se selecionado
      if (selectedMetaAccount) {
        const metaResponse = await metricsService.getMetaMetrics(
          selectedMetaAccount,
          formattedDateRange
        );
        metaMetrics = metaResponse.data;
      }
      
      // Buscar métricas do Google Analytics se selecionado
      if (selectedGoogleProperty) {
        const googleResponse = await metricsService.getGoogleMetrics(
          selectedGoogleProperty,
          formattedDateRange
        );
        googleMetrics = googleResponse.data;
      }
      
      // Processar métricas combinadas
      const processedMetrics = metricsService.processCombinedMetrics(
        metaMetrics,
        googleMetrics
      );
      
      setMetrics(processedMetrics);
      
      // Gerar dados para gráficos
      const chartData = metricsService.generateChartData(processedMetrics);
      setChartData(chartData);
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
      setError('Não foi possível carregar as métricas. Tente novamente mais tarde.');
    } finally {
      setLoading(prev => ({ ...prev, metrics: false }));
    }
  };
  
  // Manipular mudança de tab
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Verificar se há dados para exibir
  const hasData = metrics && (
    metrics.acquisition.totalVisits > 0 ||
    metrics.acquisition.adClicks > 0 ||
    metrics.campaigns.length > 0 ||
    metrics.trafficSources.length > 0
  );
  
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Dashboard de Métricas
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Seleção de contas e período */}
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="meta-account-label">Conta do Meta Ads</InputLabel>
              <Select
                labelId="meta-account-label"
                value={selectedMetaAccount}
                label="Conta do Meta Ads"
                onChange={(e) => setSelectedMetaAccount(e.target.value)}
                disabled={loading.accounts || metaAccounts.length === 0}
                startAdornment={<FacebookIcon color="primary" sx={{ mr: 1 }} />}
              >
                {metaAccounts.length === 0 ? (
                  <MenuItem value="" disabled>
                    Nenhuma conta disponível
                  </MenuItem>
                ) : (
                  metaAccounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="google-property-label">Propriedade do Google Analytics</InputLabel>
              <Select
                labelId="google-property-label"
                value={selectedGoogleProperty}
                label="Propriedade do Google Analytics"
                onChange={(e) => setSelectedGoogleProperty(e.target.value)}
                disabled={loading.accounts || googleProperties.length === 0}
                startAdornment={<GoogleIcon color="error" sx={{ mr: 1 }} />}
              >
                {googleProperties.length === 0 ? (
                  <MenuItem value="" disabled>
                    Nenhuma propriedade disponível
                  </MenuItem>
                ) : (
                  googleProperties.map((property) => (
                    <MenuItem key={property.id} value={property.id}>
                      {property.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <DatePicker
                  label="Data inicial"
                  value={dateRange.startDate}
                  onChange={(newDate) => setDateRange(prev => ({ ...prev, startDate: newDate }))}
                  disabled={loading.metrics}
                  format="dd/MM/yyyy"
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <DatePicker
                  label="Data final"
                  value={dateRange.endDate}
                  onChange={(newDate) => setDateRange(prev => ({ ...prev, endDate: newDate }))}
                  disabled={loading.metrics}
                  format="dd/MM/yyyy"
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Box>
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={fetchMetrics}
              disabled={loading.metrics || (!selectedMetaAccount && !selectedGoogleProperty)}
              sx={{ height: '56px' }}
            >
              {loading.metrics ? <CircularProgress size={24} color="inherit" /> : 'Atualizar'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Conteúdo do dashboard */}
      {loading.metrics ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      ) : !hasData ? (
        <NoDataPlaceholder
          title="Sem dados disponíveis"
          message="Não há dados para exibir no período selecionado. Tente selecionar outro período ou verifique suas integrações."
        />
      ) : (
        <>
          {/* Cards de métricas principais */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Visitas"
                value={metrics.acquisition.totalVisits}
                icon={<PeopleIcon />}
                color="#4e73df"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Cliques em Anúncios"
                value={metrics.acquisition.adClicks}
                icon={<TouchAppIcon />}
                color="#1cc88a"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Conversões"
                value={metrics.conversion.conversions}
                icon={<TrendingUpIcon />}
                color="#36b9cc"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Gasto em Anúncios"
                value={`R$ ${metrics.cost.adSpend.toFixed(2)}`}
                icon={<MonetizationOnIcon />}
                color="#f6c23e"
              />
            </Grid>
          </Grid>
          
          {/* Tabs para diferentes visualizações */}
          <Paper elevation={0} sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="dashboard tabs"
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Visão Geral" />
              <Tab label="Campanhas" />
              <Tab label="Fontes de Tráfego" />
            </Tabs>
            
            {/* Conteúdo da tab Visão Geral */}
            {tabValue === 0 && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Card>
                      <CardHeader title="Desempenho ao Longo do Tempo" />
                      <CardContent>
                        {chartData?.campaignPerformanceChart ? (
                          <Line
                            data={chartData.campaignPerformanceChart}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'top',
                                },
                              },
                            }}
                            height={300}
                          />
                        ) : (
                          <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography color="text.secondary">Sem dados disponíveis</Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardHeader title="Fontes de Tráfego" />
                      <CardContent>
                        {chartData?.trafficSourceChart && chartData.trafficSourceChart.labels.length > 0 ? (
                          <Doughnut
                            data={chartData.trafficSourceChart}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'bottom',
                                },
                              },
                            }}
                            height={300}
                          />
                        ) : (
                          <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography color="text.secondary">Sem dados disponíveis</Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {/* Conteúdo da tab Campanhas */}
            {tabValue === 1 && (
              <Box sx={{ p: 3 }}>
                {metrics.campaigns.length > 0 ? (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Card>
                        <CardHeader title="Desempenho de Campanhas" />
                        <CardContent>
                          <Bar
                            data={{
                              labels: metrics.campaigns.map(campaign => campaign.name),
                              datasets: [
                                {
                                  label: 'Gasto (R$)',
                                  data: metrics.campaigns.map(campaign => campaign.spend),
                                  backgroundColor: '#4e73df',
                                },
                                {
                                  label: 'Cliques',
                                  data: metrics.campaigns.map(campaign => campaign.clicks),
                                  backgroundColor: '#1cc88a',
                                }
                              ]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'top',
                                },
                              },
                            }}
                            height={400}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                ) : (
                  <NoDataPlaceholder
                    title="Sem dados de campanhas"
                    message="Não há dados de campanhas disponíveis para o período selecionado."
                  />
                )}
              </Box>
            )}
            
            {/* Conteúdo da tab Fontes de Tráfego */}
            {tabValue === 2 && (
              <Box sx={{ p: 3 }}>
                {metrics.trafficSources.length > 0 ? (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardHeader title="Fontes de Tráfego" />
                        <CardContent>
                          <Pie
                            data={{
                              labels: metrics.trafficSources.map(source => source.name),
                              datasets: [{
                                label: 'Sessões',
                                data: metrics.trafficSources.map(source => source.sessions),
                                backgroundColor: [
                                  '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
                                  '#5a5c69', '#858796', '#6610f2', '#fd7e14', '#20c9a6'
                                ],
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'right',
                                },
                              },
                            }}
                            height={300}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardHeader title="Novos Usuários por Fonte" />
                        <CardContent>
                          <Bar
                            data={{
                              labels: metrics.trafficSources.map(source => source.name),
                              datasets: [{
                                label: 'Novos Usuários',
                                data: metrics.trafficSources.map(source => source.newUsers),
                                backgroundColor: '#4e73df',
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'top',
                                },
                              },
                            }}
                            height={300}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                ) : (
                  <NoDataPlaceholder
                    title="Sem dados de fontes de tráfego"
                    message="Não há dados de fontes de tráfego disponíveis para o período selecionado."
                  />
                )}
              </Box>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default MetricsDashboard;
