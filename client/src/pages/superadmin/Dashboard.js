import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Box
} from '@mui/material';
import { Business, People, PersonAdd, BusinessCenter } from '@mui/icons-material';
import api from '../../services/api';
import SuperadminSidebar from '../../components/superadmin/SuperadminSidebar';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/superadmin/dashboard/stats');
        setStats(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Não foi possível carregar as estatísticas do sistema.');
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <Typography variant="h6" color="error">
            {error}
          </Typography>
        </Box>
      </Container>
    );
  }

  const StatCard = ({ title, value, icon, color, secondaryText }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: '50%',
              padding: 1,
              marginRight: 2,
              display: 'flex',
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" component="div" fontWeight="bold">
          {value}
        </Typography>
        {secondaryText && (
          <Typography variant="body2" color="text.secondary" mt={1}>
            {secondaryText}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <SuperadminSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard de Superadmin
          </Typography>
          <Typography variant="subtitle1" gutterBottom color="text.secondary">
            Bem-vindo, {user?.name}. Aqui você tem uma visão geral do sistema.
          </Typography>
          
          <Grid container spacing={3} mt={2}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Empresas"
                value={stats.totalCompanies}
                icon={<Business color="primary" />}
                color="primary"
                secondaryText={`${stats.activeCompanies} ativas, ${stats.inactiveCompanies} inativas`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Usuários"
                value={stats.totalUsers}
                icon={<People color="success" />}
                color="success"
                secondaryText={`${stats.totalAdmins} administradores`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Novas Empresas"
                value={stats.newCompanies}
                icon={<BusinessCenter color="info" />}
                color="info"
                secondaryText="Nos últimos 30 dias"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Novos Usuários"
                value={stats.newUsers}
                icon={<PersonAdd color="warning" />}
                color="warning"
                secondaryText="Nos últimos 30 dias"
              />
            </Grid>
          </Grid>

          <Paper sx={{ p: 3, mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Informações do Sistema
            </Typography>
            <Typography variant="body1">
              Como superadmin, você tem acesso completo ao sistema Speed Funnels, incluindo 
              o gerenciamento de todas as empresas e usuários. Use o menu lateral para navegar 
              entre as diferentes funcionalidades disponíveis.
            </Typography>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard;
