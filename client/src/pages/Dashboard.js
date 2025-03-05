import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  BarElement
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import api from '../services/api';
import integrationService from '../services/integrationService';
import MetricsDashboard from '../components/dashboard/MetricsDashboard';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [platform, setPlatform] = useState('meta');
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [integrations, setIntegrations] = useState({});
  const [hasActiveIntegrations, setHasActiveIntegrations] = useState(false);
  const [dashboardTab, setDashboardTab] = useState(0);

  // Buscar dados do dashboard
  useEffect(() => {
    fetchDashboardData();
    fetchIntegrations();
  }, [platform]);

  // Buscar dados do dashboard
  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');
      
      const response = await api.get(`/api/dashboard/${platform}`, {
        params: {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        }
      });
      
      setData(response.data);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError('Não foi possível carregar os dados. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Buscar integrações
  const fetchIntegrations = async () => {
    try {
      const response = await integrationService.getIntegrations();
      const integrations = response.data.data || {};
      setIntegrations(integrations);
      
      // Verificar se há integrações ativas
      const hasActive = Object.values(integrations).some(integration => integration && integration.isActive);
      setHasActiveIntegrations(hasActive);
    } catch (err) {
      console.error('Erro ao buscar integrações:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchDashboardData();
  };

  const renderMetaDashboard = () => {
    if (!data) return null;

    const { impressions, clicks, spend, ctr, cpc, conversions } = data;

    const chartData = {
      labels: impressions.map(item => item.date),
      datasets: [
        {
          label: 'Impressões',
          data: impressions.map(item => item.value),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4
        },
        {
          label: 'Cliques',
          data: clicks.map(item => item.value),
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          tension: 0.4
        }
      ]
    };

    const conversionData = {
      labels: conversions.map(item => item.date),
      datasets: [
        {
          label: 'Conversões',
          data: conversions.map(item => item.value),
          backgroundColor: 'rgba(255, 159, 64, 0.7)',
        }
      ]
    };

    return (
      <>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Impressões Totais
                </Typography>
                <Typography variant="h4" component="div">
                  {impressions.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Cliques Totais
                </Typography>
                <Typography variant="h4" component="div">
                  {clicks.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Investimento Total
                </Typography>
                <Typography variant="h4" component="div">
                  R$ {spend.reduce((acc, curr) => acc + curr.value, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="Desempenho ao Longo do Tempo" />
              <Divider />
              <CardContent>
                <Line 
                  data={chartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                  height={300}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Conversões" />
              <Divider />
              <CardContent>
                <Bar 
                  data={conversionData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                  height={300}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </>
    );
  };

  const renderGoogleDashboard = () => {
    if (!data) return null;

    const { sessions, pageviews, users, bounceRate, avgSessionDuration, trafficSources } = data;

    const chartData = {
      labels: sessions.map(item => item.date),
      datasets: [
        {
          label: 'Sessões',
          data: sessions.map(item => item.value),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4
        },
        {
          label: 'Visualizações de Página',
          data: pageviews.map(item => item.value),
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          tension: 0.4
        }
      ]
    };

    const trafficSourcesData = {
      labels: trafficSources.map(item => item.source),
      datasets: [
        {
          label: 'Fontes de Tráfego',
          data: trafficSources.map(item => item.sessions),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
          ],
        }
      ]
    };

    return (
      <>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Usuários Totais
                </Typography>
                <Typography variant="h4" component="div">
                  {users.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Taxa de Rejeição Média
                </Typography>
                <Typography variant="h4" component="div">
                  {(bounceRate.reduce((acc, curr) => acc + curr.value, 0) / bounceRate.length).toFixed(2)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Duração Média da Sessão
                </Typography>
                <Typography variant="h4" component="div">
                  {Math.floor(avgSessionDuration.reduce((acc, curr) => acc + curr.value, 0) / avgSessionDuration.length)} seg
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="Desempenho ao Longo do Tempo" />
              <Divider />
              <CardContent>
                <Line 
                  data={chartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                  height={300}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Fontes de Tráfego" />
              <Divider />
              <CardContent>
                <Bar 
                  data={trafficSourcesData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                      x: {
                        beginAtZero: true
                      }
                    }
                  }}
                  height={300}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </>
    );
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {hasActiveIntegrations && (
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={dashboardTab}
            onChange={(event, newValue) => setDashboardTab(newValue)}
            aria-label="dashboard tabs"
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Visão Geral" />
            <Tab label="Métricas de Marketing" />
          </Tabs>
        </Paper>
      )}

      {dashboardTab === 0 || !hasActiveIntegrations ? (
        <Box>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel id="platform-select-label">Plataforma</InputLabel>
                      <Select
                        labelId="platform-select-label"
                        id="platform-select"
                        value={platform}
                        label="Plataforma"
                        onChange={(e) => setPlatform(e.target.value)}
                      >
                        <MenuItem value="meta">Meta Ads</MenuItem>
                        <MenuItem value="google">Google Analytics</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                      <DatePicker
                        label="Data de Início"
                        value={startDate}
                        onChange={(newValue) => setStartDate(newValue)}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                      <DatePicker
                        label="Data de Fim"
                        value={endDate}
                        onChange={(newValue) => setEndDate(newValue)}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={loading}
                      sx={{ height: '56px' }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Atualizar Dados'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            platform === 'meta' ? renderMetaDashboard() : renderGoogleDashboard()
          )}
        </Box>
      ) : (
        <MetricsDashboard />
      )}
    </Box>
  );
};

export default Dashboard;
