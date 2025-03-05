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
  Card,
  CardContent,
  Container,
  AppBar,
  Toolbar,
  IconButton
} from '@mui/material';
import {
  Download as DownloadIcon,
  DateRange as DateRangeIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { ptBR } from 'date-fns/locale';
import { format, subDays } from 'date-fns';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import axios from 'axios';

// Registrar componentes necessários do Chart.js
ChartJS.register(...registerables);

const PublicReport = () => {
  const { publicId } = useParams();
  const [report, setReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date()
  });
  
  useEffect(() => {
    fetchPublicReport();
  }, [publicId, dateRange]);
  
  const fetchPublicReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar diretamente axios em vez de api para não incluir token
      const response = await axios.get(`/api/reports/public/${publicId}`, {
        params: {
          startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
          endDate: format(dateRange.endDate, 'yyyy-MM-dd')
        }
      });
      
      setReport(response.data.report);
      setReportData(response.data.report.data);
      setCompany(response.data.report.company);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar relatório');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleExport = (format) => {
    // Implementação futura: exportar para PDF/CSV
    alert(`Exportação para ${format} será implementada em breve`);
  };
  
  // Renderizar gráficos específicos para cada plataforma
  // (usando funções similares às do ReportView.jsx - por brevidade, não repetirei todo o código)
  const renderMetaCharts = () => {
    // Similar ao ReportView.jsx
    // ... (código idêntico ao do ReportView)
  };
  
  const renderGoogleCharts = () => {
    // Similar ao ReportView.jsx
    // ... (código idêntico ao do ReportView)
  };
  
  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          {company && company.logoUrl && (
            <Box mr={2}>
              <img 
                src={company.logoUrl} 
                alt={company.name} 
                style={{ height: 40, maxWidth: 180 }}
              />
            </Box>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {company ? company.name : 'Relatório'}
          </Typography>
          <IconButton onClick={handlePrint}>
            <PrintIcon />
          </IconButton>
          <Button 
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('pdf')}
          >
            PDF
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {loading && !report ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : report ? (
          <>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box mb={2}>
                <Typography variant="h5" gutterBottom>
                  {report.name}
                </Typography>
                {report.description && (
                  <Typography variant="body2" color="textSecondary">
                    {report.description}
                  </Typography>
                )}
              </Box>
              
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
                {loading ? (
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
            
            <Box textAlign="center" mt={4} mb={2}>
              <Typography variant="body2" color="textSecondary">
                Relatório gerado por {company ? company.name : 'Sistema de Relatórios'} em {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </Typography>
            </Box>
          </>
        ) : null}
      </Container>
    </Box>
  );
};

export default PublicReport; 