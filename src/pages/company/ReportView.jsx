import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Button, 
  Tabs, 
  Tab, 
  Divider, 
  CircularProgress, 
  Alert,
  IconButton,
  Menu,
  MenuItem,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  Share as ShareIcon,
  Download as DownloadIcon,
  MoreVert as MoreIcon,
  DateRange as DateRangeIcon,
  Refresh as RefreshIcon,
  ContentCopy as ContentCopyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { ptBR } from 'date-fns/locale';
import { format, subDays } from 'date-fns';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import api from '../../services/authService';
import Layout from '../../components/Layout';

// Registrar componentes necessários do Chart.js
ChartJS.register(...registerables);

const ReportView = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date()
  });
  const [refreshing, setRefreshing] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  
  // Carregar dados do relatório
  useEffect(() => {
    fetchReportData();
  }, [reportId, dateRange]);
  
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar detalhes do relatório
      const response = await api.get(`/reports/${reportId}`, {
        params: {
          startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
          endDate: format(dateRange.endDate, 'yyyy-MM-dd')
        }
      });
      
      setReport(response.data.report);
      setReportData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar relatório');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchReportData().finally(() => setRefreshing(false));
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  const handleShare = () => {
    navigate(`/company/reports/share/${reportId}`);
    handleMenuClose();
  };
  
  const handleExport = (format) => {
    // Implementação futura: exportar para PDF/CSV
    alert(`Exportação para ${format} será implementada em breve`);
    handleMenuClose();
  };
  
  const handleEdit = () => {
    navigate(`/company/reports/edit/${reportId}`);
    handleMenuClose();
  };
  
  const handleDelete = () => {
    // Confirmação de exclusão seria implementada aqui
    handleMenuClose();
  };
  
  // Renderizar gráficos específicos para cada plataforma
  const renderMetaCharts = () => {
    if (!reportData?.meta) return <Alert severity="info">Sem dados do Meta Ads para exibir</Alert>;
    
    const { meta } = reportData;
    const campaigns = meta.campaigns || [];
    
    // Dados para gráfico de barras de campanhas
    const campaignData = {
      labels: campaigns.map(c => c.name),
      datasets: [
        {
          label: 'Gastos (R$)',
          data: campaigns.map(c => c.spend),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Cliques',
          data: campaigns.map(c => c.clicks),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
    
    // Dados para gráfico de pizza de distribuição de gastos
    const spendDistribution = {
      labels: campaigns.map(c => c.name),
      datasets: [
        {
          data: campaigns.map(c => c.spend),
          backgroundColor: [
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 99, 132, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Resumo Meta Ads
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Gastos Totais
                    </Typography>
                    <Typography variant="h5">
                      R$ {meta.summary.spend.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Cliques
                    </Typography>
                    <Typography variant="h5">
                      {meta.summary.clicks.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Impressões
                    </Typography>
                    <Typography variant="h5">
                      {meta.summary.impressions.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      CTR
                    </Typography>
                    <Typography variant="h5">
                      {meta.summary.ctr.toFixed(2)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Desempenho das Campanhas
            </Typography>
            <Box height={300}>
              <Bar 
                data={campaignData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }} 
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Distribuição de Gastos
            </Typography>
            <Box height={300} display="flex" justifyContent="center">
              <Doughnut 
                data={spendDistribution} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false
                }} 
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Detalhes das Campanhas
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Campanha</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Gastos (R$)</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Cliques</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Impressões</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>CTR (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign, index) => (
                    <tr key={index}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{campaign.name}</td>
                      <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>R$ {campaign.spend.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{campaign.clicks.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{campaign.impressions.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{campaign.ctr.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  };
  
  const renderGoogleCharts = () => {
    if (!reportData?.googleAnalytics) return <Alert severity="info">Sem dados do Google Analytics para exibir</Alert>;
    
    const { googleAnalytics } = reportData;
    const sources = googleAnalytics.sources || [];
    
    // Dados para gráfico de barras de fontes
    const sourcesData = {
      labels: sources.map(s => s.source),
      datasets: [
        {
          label: 'Usuários',
          data: sources.map(s => s.users),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Sessões',
          data: sources.map(s => s.sessions),
          backgroundColor: 'rgba(153, 102, 255, 0.5)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }
      ]
    };
    
    // Dados para gráfico de pizza de taxa de rejeição
    const bounceRateData = {
      labels: sources.map(s => s.source),
      datasets: [
        {
          data: sources.map(s => s.bounceRate),
          backgroundColor: [
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Resumo Google Analytics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Usuários
                    </Typography>
                    <Typography variant="h5">
                      {googleAnalytics.summary.users.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Novos Usuários
                    </Typography>
                    <Typography variant="h5">
                      {googleAnalytics.summary.newUsers.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Sessões
                    </Typography>
                    <Typography variant="h5">
                      {googleAnalytics.summary.sessions.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Taxa de Rejeição
                    </Typography>
                    <Typography variant="h5">
                      {googleAnalytics.summary.bounceRate.toFixed(1)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Usuários por Fonte
            </Typography>
            <Box height={300}>
              <Bar 
                data={sourcesData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }} 
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Taxa de Rejeição por Fonte
            </Typography>
            <Box height={300} display="flex" justifyContent="center">
              <Pie 
                data={bounceRateData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false
                }} 
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Detalhes por Fonte
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Fonte</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Usuários</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Sessões</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Taxa de Rejeição (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source, index) => (
                    <tr key={index}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{source.source}</td>
                      <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{source.users.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{source.sessions.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{source.bounceRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  };
  
  return (
    <Layout>
      {loading && !report ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : report ? (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h5" gutterBottom>
                {report.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {report.description}
              </Typography>
            </Box>
            
            <Box>
              <IconButton onClick={handleRefresh} disabled={refreshing}>
                <RefreshIcon />
              </IconButton>
              
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<ShareIcon />}
                onClick={handleShare}
                sx={{ mr: 1 }}
              >
                Compartilhar
              </Button>
              
              <IconButton onClick={handleMenuOpen}>
                <MoreIcon />
              </IconButton>
            </Box>
          </Box>
          
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <DateRangeIcon color="action" />
              </Grid>
              <Grid item xs>
                <LocalizationProvider dateAdapter={AdapterDateFns} locale={ptBR}>
                  <Box display="flex" alignItems="center">
                    <DatePicker
                      label="Data Inicial"
                      value={dateRange.startDate}
                      onChange={(newValue) => setDateRange({ ...dateRange, startDate: newValue })}
                      renderInput={(params) => <TextField {...params} size="small" sx={{ mr: 2 }} />}
                    />
                    <Typography sx={{ mx: 1 }}>até</Typography>
                    <DatePicker
                      label="Data Final"
                      value={dateRange.endDate}
                      onChange={(newValue) => setDateRange({ ...dateRange, endDate: newValue })}
                      renderInput={(params) => <TextField {...params} size="small" />}
                      maxDate={new Date()}
                    />
                  </Box>
                </LocalizationProvider>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              {report.platforms.includes('meta') && (
                <Tab label="Meta Ads" />
              )}
              {report.platforms.includes('google_analytics') && (
                <Tab label="Google Analytics" />
              )}
            </Tabs>
            <Divider />
            
            <Box p={3}>
              {loading || refreshing ? (
                <Box display="flex" justifyContent="center" my={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {activeTab === 0 && report.platforms.includes('meta') && renderMetaCharts()}
                  {activeTab === (report.platforms.includes('meta') ? 1 : 0) && report.platforms.includes('google_analytics') && renderGoogleCharts()}
                </>
              )}
            </Box>
          </Paper>
          
          {/* Menu de opções */}
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => handleExport('pdf')}>
              <DownloadIcon fontSize="small" sx={{ mr: 1 }} /> Exportar como PDF
            </MenuItem>
            <MenuItem onClick={() => handleExport('csv')}>
              <DownloadIcon fontSize="small" sx={{ mr: 1 }} /> Exportar como CSV
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleEdit}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} /> Editar Relatório
            </MenuItem>
            <MenuItem onClick={handleDelete}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Excluir Relatório
            </MenuItem>
          </Menu>
        </>
      ) : null}
    </Layout>
  );
};

export default ReportView; 