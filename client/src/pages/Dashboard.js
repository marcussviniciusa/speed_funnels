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
  Alert
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

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');
      
      const endpoint = platform === 'meta' 
        ? `/api/reports/meta/dashboard?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
        : `/api/reports/google/dashboard?startDate=${formattedStartDate}&endDate=${formattedEndDate}`;
      
      const response = await api.get(endpoint);
      setData(response.data.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Falha ao carregar os dados do dashboard. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [platform]); // Fetch data when platform changes

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchDashboardData();
  };

  // Render Meta dashboard
  const renderMetaDashboard = () => {
    if (!data) return null;

    // Prepare data for charts
    const campaignData = {
      labels: data.campaigns.map(c => c.name),
      datasets: [
        {
          label: 'Gasto (R$)',
          data: data.campaigns.map(c => c.spend),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: 'Cliques',
          data: data.campaigns.map(c => c.clicks),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        }
      ]
    };

    return (
      <>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Gasto Total
                </Typography>
                <Typography variant="h4">
                  R$ {data.summary.spend.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Impressões
                </Typography>
                <Typography variant="h4">
                  {data.summary.impressions.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Cliques
                </Typography>
                <Typography variant="h4">
                  {data.summary.clicks.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  CTR
                </Typography>
                <Typography variant="h4">
                  {(data.summary.ctr * 100).toFixed(2)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ mt: 4 }}>
          <CardHeader title="Desempenho por Campanha" />
          <Divider />
          <CardContent>
            <Box sx={{ height: 300 }}>
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
          </CardContent>
        </Card>
      </>
    );
  };

  // Render Google dashboard
  const renderGoogleDashboard = () => {
    if (!data) return null;

    // Prepare data for charts
    const sourceData = {
      labels: data.data.map(d => d.dimension),
      datasets: [
        {
          label: 'Sessões',
          data: data.data.map(d => d.sessions),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
        {
          label: 'Usuários',
          data: data.data.map(d => d.users),
          backgroundColor: 'rgba(153, 102, 255, 0.5)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        }
      ]
    };

    return (
      <>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Sessões
                </Typography>
                <Typography variant="h4">
                  {data.summary.sessions.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Usuários
                </Typography>
                <Typography variant="h4">
                  {data.summary.users.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Visualizações de Página
                </Typography>
                <Typography variant="h4">
                  {data.summary.pageviews.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Duração Média da Sessão
                </Typography>
                <Typography variant="h4">
                  {Math.floor(data.summary.avgSessionDuration / 60)}m {data.summary.avgSessionDuration % 60}s
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ mt: 4 }}>
          <CardHeader title="Desempenho por Fonte" />
          <Divider />
          <CardContent>
            <Box sx={{ height: 300 }}>
              <Bar 
                data={sourceData} 
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
          </CardContent>
        </Card>
      </>
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
      </Box>

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

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        platform === 'meta' ? renderMetaDashboard() : renderGoogleDashboard()
      )}
    </Box>
  );
};

export default Dashboard;
