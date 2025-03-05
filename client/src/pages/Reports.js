import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../services/api';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newReportData, setNewReportData] = useState({
    name: '',
    type: 'meta',
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
    description: ''
  });

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get('/api/reports');
      // Verificar se a resposta contém os dados esperados
      if (response.data && Array.isArray(response.data)) {
        setReports(response.data);
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setReports(response.data.data);
      } else {
        // Se não tiver o formato esperado, inicializa como array vazio
        console.warn('Formato de resposta inesperado:', response.data);
        setReports([]);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Falha ao carregar os relatórios. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleCreateReport = async () => {
    setLoading(true);
    setError('');
    
    try {
      const formattedStartDate = format(newReportData.startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(newReportData.endDate, 'yyyy-MM-dd');
      
      const payload = {
        name: newReportData.name,
        type: newReportData.type,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        description: newReportData.description
      };
      
      await api.post('/api/reports', payload);
      setOpenDialog(false);
      // Resetar o formulário
      setNewReportData({
        name: '',
        type: 'meta',
        startDate: subDays(new Date(), 30),
        endDate: new Date(),
        description: ''
      });
      fetchReports();
    } catch (err) {
      console.error('Error creating report:', err);
      setError('Falha ao criar o relatório. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Tem certeza que deseja excluir este relatório?')) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await api.delete(`/api/reports/${reportId}`);
      fetchReports();
    } catch (err) {
      console.error('Error deleting report:', err);
      setError('Falha ao excluir o relatório. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (reportId) => {
    try {
      const response = await api.get(`/api/reports/${reportId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${reportId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading report:', err);
      setError('Falha ao baixar o relatório. Por favor, tente novamente.');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Relatórios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Novo Relatório
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {loading && !reports.length ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <CardHeader title="Meus Relatórios" />
          <Divider />
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Período</TableCell>
                    <TableCell>Criado em</TableCell>
                    <TableCell>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        Nenhum relatório encontrado. Crie um novo relatório para começar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>{report.name}</TableCell>
                        <TableCell>
                          {report.type === 'meta' || (report.platforms && report.platforms.includes('meta')) 
                            ? 'Meta Ads' 
                            : 'Google Analytics'}
                        </TableCell>
                        <TableCell>
                          {report.startDate && report.endDate 
                            ? `${format(new Date(report.startDate), 'dd/MM/yyyy')} - ${format(new Date(report.endDate), 'dd/MM/yyyy')}`
                            : 'Período não definido'}
                        </TableCell>
                        <TableCell>
                          {report.createdAt 
                            ? format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm')
                            : 'Data não disponível'}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Visualizar">
                            <IconButton color="primary" onClick={() => {}}>
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Baixar">
                            <IconButton color="primary" onClick={() => handleDownloadReport(report.id)}>
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir">
                            <IconButton color="error" onClick={() => handleDeleteReport(report.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Dialog para criar novo relatório */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Criar Novo Relatório</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Relatório"
                value={newReportData.name}
                onChange={(e) => setNewReportData({ ...newReportData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="report-type-label">Tipo de Relatório</InputLabel>
                <Select
                  labelId="report-type-label"
                  value={newReportData.type}
                  label="Tipo de Relatório"
                  onChange={(e) => setNewReportData({ ...newReportData, type: e.target.value })}
                >
                  <MenuItem value="meta">Meta Ads</MenuItem>
                  <MenuItem value="google">Google Analytics</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                <DatePicker
                  label="Data de Início"
                  value={newReportData.startDate}
                  onChange={(newValue) => setNewReportData({ ...newReportData, startDate: newValue })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                <DatePicker
                  label="Data de Fim"
                  value={newReportData.endDate}
                  onChange={(newValue) => setNewReportData({ ...newReportData, endDate: newValue })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Descrição (opcional)"
                value={newReportData.description}
                onChange={(e) => setNewReportData({ ...newReportData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleCreateReport} 
            variant="contained" 
            disabled={!newReportData.name || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Criar Relatório'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports;
