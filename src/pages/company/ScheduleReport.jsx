import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip, 
  OutlinedInput, 
  FormHelperText,
  Grid,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlayArrow as RunIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../../services/authService';
import Layout from '../../components/Layout';

const ScheduleReport = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  
  // Estado para formulário
  const [report, setReport] = useState(null);
  const [frequency, setFrequency] = useState('weekly');
  const [dayOfWeek, setDayOfWeek] = useState(1); // Segunda-feira
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [emailInput, setEmailInput] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [schedules, setSchedules] = useState([]);
  
  // Estado de UI
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  
  // Carregar dados do relatório e agendamentos existentes
  useEffect(() => {
    fetchReportAndSchedules();
  }, [reportId]);
  
  const fetchReportAndSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar relatório
      const reportResponse = await api.get(`/reports/${reportId}`);
      setReport(reportResponse.data.report);
      
      // Buscar agendamentos
      const schedulesResponse = await api.get(`/schedules/report/${reportId}`);
      setSchedules(schedulesResponse.data.schedules || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddEmail = () => {
    if (!emailInput) return;
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      setError('Email inválido');
      return;
    }
    
    // Verificar se já existe
    if (recipients.includes(emailInput)) {
      setError('Este email já foi adicionado');
      return;
    }
    
    // Adicionar email
    setRecipients([...recipients, emailInput]);
    setEmailInput('');
    setError(null);
  };
  
  const handleRemoveEmail = (email) => {
    setRecipients(recipients.filter(r => r !== email));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (recipients.length === 0) {
      setError('Adicione pelo menos um destinatário');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      
      const scheduleData = {
        reportId,
        frequency,
        recipients
      };
      
      // Adicionar dayOfWeek ou dayOfMonth dependendo da frequência
      if (frequency === 'weekly') {
        scheduleData.dayOfWeek = dayOfWeek;
      } else if (frequency === 'monthly') {
        scheduleData.dayOfMonth = dayOfMonth;
      }
      
      // Criar agendamento
      await api.post('/schedules/create', scheduleData);
      
      setSuccess('Agendamento criado com sucesso');
      setRecipients([]);
      setFrequency('weekly');
      
      // Recarregar agendamentos
      fetchReportAndSchedules();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar agendamento');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeleteClick = (schedule) => {
    setSelectedSchedule(schedule);
    setDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    try {
      setSubmitting(true);
      
      await api.delete(`/schedules/${selectedSchedule.id}`);
      
      setDeleteDialogOpen(false);
      setSuccess('Agendamento excluído com sucesso');
      
      // Atualizar lista
      setSchedules(schedules.filter(s => s.id !== selectedSchedule.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao excluir agendamento');
      console.error(err);
    } finally {
      setSubmitting(false);
      setSelectedSchedule(null);
    }
  };
  
  const handleRunManually = async (scheduleId) => {
    try {
      setSubmitting(true);
      
      await api.post(`/schedules/${scheduleId}/run`);
      
      setSuccess('Relatório enviado manualmente com sucesso');
      
      // Atualizar lista
      fetchReportAndSchedules();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao enviar relatório');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Renderizar texto de frequência para exibição
  const getFrequencyText = (schedule) => {
    switch (schedule.frequency) {
      case 'daily':
        return 'Diariamente';
      case 'weekly':
        const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const dayIndex = schedule.config?.dayOfWeek || 1;
        return `Semanalmente (${days[dayIndex]})`;
      case 'monthly':
        const dayNum = schedule.config?.dayOfMonth || 1;
        return `Mensalmente (Dia ${dayNum})`;
      default:
        return schedule.frequency;
    }
  };
  
  return (
    <Layout>
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error && !success ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : (
        <>
          {report && (
            <Box mb={4}>
              <Typography variant="h5" gutterBottom>
                Agendamento de Relatório
              </Typography>
              <Typography variant="h6" color="primary">
                {report.name}
              </Typography>
              {report.description && (
                <Typography variant="body2" color="textSecondary">
                  {report.description}
                </Typography>
              )}
            </Box>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Novo Agendamento
                </Typography>
                
                <form onSubmit={handleSubmit}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Frequência</InputLabel>
                    <Select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      label="Frequência"
                    >
                      <MenuItem value="daily">Diariamente</MenuItem>
                      <MenuItem value="weekly">Semanalmente</MenuItem>
                      <MenuItem value="monthly">Mensalmente</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {frequency === 'weekly' && (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Dia da Semana</InputLabel>
                      <Select
                        value={dayOfWeek}
                        onChange={(e) => setDayOfWeek(e.target.value)}
                        label="Dia da Semana"
                      >
                        <MenuItem value={0}>Domingo</MenuItem>
                        <MenuItem value={1}>Segunda-feira</MenuItem>
                        <MenuItem value={2}>Terça-feira</MenuItem>
                        <MenuItem value={3}>Quarta-feira</MenuItem>
                        <MenuItem value={4}>Quinta-feira</MenuItem>
                        <MenuItem value={5}>Sexta-feira</MenuItem>
                        <MenuItem value={6}>Sábado</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                  
                  {frequency === 'monthly' && (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Dia do Mês</InputLabel>
                      <Select
                        value={dayOfMonth}
                        onChange={(e) => setDayOfMonth(e.target.value)}
                        label="Dia do Mês"
                      >
                        {Array.from({ length: 31 }, (_, i) => (
                          <MenuItem key={i + 1} value={i + 1}>
                            {i + 1}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Destinatários
                    </Typography>
                    
                    <Box display="flex" alignItems="center" mb={1}>
                      <TextField
                        label="Email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        fullWidth
                        type="email"
                        sx={{ mr: 1 }}
                      />
                      <Button 
                        variant="contained" 
                        onClick={handleAddEmail}
                        startIcon={<AddIcon />}
                      >
                        Adicionar
                      </Button>
                    </Box>
                    
                    <Box sx={{ mt: 2 }}>
                      {recipients.map((email) => (
                        <Chip
                          key={email}
                          label={email}
                          onDelete={() => handleRemoveEmail(email)}
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Box>
                  </Box>
                  
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={submitting || recipients.length === 0}
                  >
                    {submitting ? 'Criando...' : 'Criar Agendamento'}
                  </Button>
                </form>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Agendamentos Existentes
                </Typography>
                
                {schedules.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    Nenhum agendamento configurado para este relatório.
                  </Typography>
                ) : (
                  <List>
                    {schedules.map((schedule) => (
                      <React.Fragment key={schedule.id}>
                        <ListItem>
                          <ListItemText
                            primary={getFrequencyText(schedule)}
                            secondary={
                              <>
                                <Typography variant="body2" component="span">
                                  Destinatários: {schedule.recipients.length}
                                </Typography>
                                <br />
                                <Typography variant="body2" component="span">
                                  Próximo envio: {format(new Date(schedule.nextRun), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </Typography>
                                {schedule.lastRun && (
                                  <>
                                    <br />
                                    <Typography variant="body2" component="span">
                                      Último envio: {format(new Date(schedule.lastRun), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </Typography>
                                  </>
                                )}
                              </>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton 
                              edge="end" 
                              aria-label="executar" 
                              onClick={() => handleRunManually(schedule.id)}
                              disabled={submitting}
                              title="Executar manualmente"
                            >
                              <RunIcon />
                            </IconButton>
                            <IconButton 
                              edge="end" 
                              aria-label="excluir" 
                              onClick={() => handleDeleteClick(schedule)}
                              disabled={submitting}
                              sx={{ ml: 1 }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>
          </Grid>
          
          {/* Diálogo de confirmação de exclusão */}
          <Dialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
          >
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
              <Button 
                onClick={handleConfirmDelete} 
                color="error" 
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : <DeleteIcon />}
              >
                {submitting ? 'Excluindo...' : 'Excluir'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Layout>
  );
};

export default ScheduleReport; 