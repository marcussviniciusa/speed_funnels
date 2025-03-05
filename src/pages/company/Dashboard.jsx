import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Divider,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  MoreVert as MoreIcon,
  Visibility as VisibilityIcon,
  GetApp as DownloadIcon,
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import DatePicker from '@mui/lab/DatePicker';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import ptBR from 'date-fns/locale/pt-BR';
import api from '../../services/authService';
import Layout from '../../components/Layout';

// Registrar componentes necessários do Chart.js
ChartJS.register(...registerables);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metaData, setMetaData] = useState(null);
  const [googleData, setGoogleData] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
    endDate: new Date()
  });
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar dados do Meta Ads
      const metaResponse = await api.get('/reports/meta/dashboard', {
        params: {
          startDate: dateRange.startDate.toISOString().split('T')[0],
          endDate: dateRange.endDate.toISOString().split('T')[0]
        }
      });
      
      // Buscar dados do Google Analytics
      const googleResponse = await api.get('/reports/google/dashboard', {
        params: {
          startDate: dateRange.startDate.toISOString().split('T')[0],
          endDate: dateRange.endDate.toISOString().split('T')[0]
        }
      });
      
      setMetaData(metaResponse.data);
      setGoogleData(googleResponse.data);
    } catch (err) {
      console.error('Erro ao buscar dados do dashboard:', err);
      setError('Não foi possível carregar os dados do dashboard. Verifique se suas integrações estão configuradas corretamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleExportPDF = () => {
    handleMenuClose();
    // Implementar exportação para PDF
    alert('Exportação para PDF será implementada em breve');
  };

  const handleExportCSV = () => {
    handleMenuClose();
    // Implementar exportação para CSV
    alert('Exportação para CSV será implementada em breve');
  };

  if (loading && !refreshing) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  // Configuração de dados para o gráfico de linha (Meta Ads)
  const metaChartData = {
    labels: metaData?.dailyData?.map(d => d.date) || [],
    datasets: [
      {
        label: 'Gastos (R$)',
        data: metaData?.dailyData?.map(d => d.spend) || [],
        borderColor: 'rgba(33, 150, 243, 0.8)',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Cliques',
        data: metaData?.dailyData?.map(d => d.clicks) || [],
        borderColor: 'rgba(76, 175, 80, 0.8)',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      }
    ]
  };

  // Configuração de dados para o gráfico de barras (Google Analytics)
  const googleChartData = {
    labels: googleData?.dailyData?.map(d => d.date) || [],
    datasets: [
      {
        label: 'Usuários Ativos',
        data: googleData?.dailyData?.map(d => d.activeUsers) || [],
        backgroundColor: 'rgba(33, 150, 243, 0.7)',
      },
      {
        label: 'Novos Usuários',
        data: googleData?.dailyData?.map(d => d.newUsers) || [],
        backgroundColor: 'rgba(76, 175, 80, 0.7)',
      }
    ]
  };

  return (
    <Layout>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Dashboard da Empresa
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            startIcon={<DateRangeIcon />}
            variant="outlined"
            // Aqui seria implementado o seletor de período
            onClick={() => alert('Seletor de período será implementado')}
          >
            {`${dateRange.startDate.toLocaleDateString('pt-BR')} - ${dateRange.endDate.toLocaleDateString('pt-BR')}`}
          </Button>
          
          <Button 
            startIcon={<RefreshIcon />} 
            variant="contained" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Atualizando...' : 'Atualizar Dados'}
          </Button>
          
          <IconButton onClick={handleMenuOpen}>
            <MoreIcon />
          </IconButton>
          
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleExportPDF}>
              <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
              Exportar como PDF
            </MenuItem>
            <MenuItem onClick={handleExportCSV}>
              <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
              Exportar como CSV
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Cards de KPIs - Meta Ads */}
      {metaData && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Gasto Total
                </Typography>
                <Typography variant="h5" component="div">
                  R$ {metaData.summary.totalSpend.toFixed(2)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {metaData.summary.spendTrend > 0 ? (
                    <TrendingUp color="success" fontSize="small" />
                  ) : (
                    <TrendingDown color="error" fontSize="small" />
                  )}
                  <Typography variant="body2" sx={{ ml: 0.5 }}>
                    {Math.abs(metaData.summary.spendTrend)}% vs. período anterior
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Cliques
                </Typography>
                <Typography variant="h5" component="div">
                  {metaData.summary.totalClicks.toLocaleString('pt-BR')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {metaData.summary.clicksTrend > 0 ? (
                    <TrendingUp color="success" fontSize="small" />
                  ) : (
                    <TrendingDown color="error" fontSize="small" />
                  )}
                  <Typography variant="body2" sx={{ ml: 0.5 }}>
                    {Math.abs(metaData.summary.clicksTrend)}% vs. período anterior
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Impressões
                </Typography>
                <Typography variant="h5" component="div">
                  {metaData.summary.totalImpressions.toLocaleString('pt-BR')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {metaData.summary.impressionsTrend > 0 ? (
                    <TrendingUp color="success" fontSize="small" />
                  ) : (
                    <TrendingDown color="error" fontSize="small" />
                  )}
                  <Typography variant="body2" sx={{ ml: 0.5 }}>
                    {Math.abs(metaData.summary.impressionsTrend)}% vs. período anterior
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  CTR
                </Typography>
                <Typography variant="h5" component="div">
                  {metaData.summary.ctr.toFixed(2)}%
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {metaData.summary.ctrTrend > 0 ? (
                    <TrendingUp color="success" fontSize="small" />
                  ) : (
                    <TrendingDown color="error" fontSize="small" />
                  )}
                  <Typography variant="body2" sx={{ ml: 0.5 }}>
                    {Math.abs(metaData.summary.ctrTrend)}% vs. período anterior
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Gráficos */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Meta Ads" />
          <Tab label="Google Analytics" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {selectedTab === 0 && metaData && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Desempenho das Campanhas Meta
              </Typography>
              <Box sx={{ height: 300, mb: 4 }}>
                <Line 
                  data={metaChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Gastos (R$)'
                        }
                      },
                      y1: {
                        position: 'right',
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Cliques'
                        },
                        grid: {
                          drawOnChartArea: false
                        }
                      }
                    }
                  }} 
                />
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Principais Campanhas
              </Typography>
              <List>
                {metaData.topCampaigns.map((campaign, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText 
                        primary={campaign.name} 
                        secondary={`Gastos: R$ ${campaign.spend.toFixed(2)} • Cliques: ${campaign.clicks} • CTR: ${campaign.ctr.toFixed(2)}%`} 
                      />
                      <Button 
                        startIcon={<VisibilityIcon />}
                        size="small"
                        onClick={() => alert(`Ver detalhes da campanha: ${campaign.name}`)}
                      >
                        Ver Detalhes
                      </Button>
                    </ListItem>
                    {index < metaData.topCampaigns.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}
          
          {selectedTab === 1 && googleData && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Tráfego do Site
              </Typography>
              <Box sx={{ height: 300, mb: 4 }}>
                <Bar 
                  data={googleChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Usuários'
                        }
                      }
                    }
                  }} 
                />
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Principais Fontes de Tráfego
              </Typography>
              <List>
                {googleData.topSources.map((source, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText 
                        primary={source.source} 
                        secondary={`Usuários: ${source.users} • Tempo médio na página: ${source.avgSessionDuration} • Taxa de conversão: ${source.conversionRate.toFixed(2)}%`} 
                      />
                    </ListItem>
                    {index < googleData.topSources.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Recomendações e Alertas */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recomendações
              </Typography>
              <List>
                <ListItem>
                  <ListItemText primary="Otimize o orçamento da campanha 'Vendas Verão 2023'" 
                    secondary="Esta campanha tem o CPC mais alto e CTR abaixo da média" />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText primary="Melhore a landing page para tráfego móvel" 
                    secondary="A taxa de rejeição em dispositivos móveis é 45% maior que em desktop" />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText primary="Aumente o conteúdo para o público de 25-34 anos" 
                    secondary="Este segmento tem a maior taxa de conversão mas baixo volume" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Alertas
              </Typography>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Queda acentuada no CTR</strong> da campanha "Produtos Premium" nos últimos 3 dias
                </Typography>
              </Alert>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Meta Ads:</strong> Seu limite de gastos diários foi atingido para a campanha "Desconto Exclusivo"
                </Typography>
              </Alert>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Objetivo Alcançado!</strong> A campanha "Novos Clientes 2023" atingiu a meta de conversões
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default Dashboard; 