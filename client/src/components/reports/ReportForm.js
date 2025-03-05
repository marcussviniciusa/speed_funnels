import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
  Paper,
  Divider,
  CircularProgress
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ptBR } from 'date-fns/locale';
import { REPORT_STATUSES } from '../../utils/constants';

/**
 * Componente de formulário para criação e edição de relatórios
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.initialData - Dados iniciais do relatório
 * @param {Function} props.onSubmit - Função chamada ao enviar o formulário
 * @param {boolean} props.loading - Indica se o formulário está carregando
 * @param {string} props.submitButtonText - Texto do botão de envio
 * @param {Function} props.onCancel - Função chamada ao cancelar
 */
const ReportForm = ({
  initialData = {},
  onSubmit,
  loading = false,
  submitButtonText = 'Salvar',
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'facebook',
    status: REPORT_STATUSES.DRAFT,
    startDate: null,
    endDate: null,
    ...initialData
  });

  const [errors, setErrors] = useState({});

  // Atualiza o formulário quando os dados iniciais mudam
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: '',
        description: '',
        type: 'facebook',
        status: REPORT_STATUSES.DRAFT,
        startDate: null,
        endDate: null,
        ...initialData
      });
    }
  }, [initialData]);

  // Manipula a alteração dos campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpa o erro do campo quando ele é alterado
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Manipula a alteração das datas
  const handleDateChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpa o erro do campo quando ele é alterado
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Valida o formulário antes de enviar
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'O nome é obrigatório';
    }

    if (!formData.type) {
      newErrors.type = 'O tipo é obrigatório';
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.startDate = 'A data de início não pode ser posterior à data de fim';
      newErrors.endDate = 'A data de fim não pode ser anterior à data de início';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manipula o envio do formulário
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Typography variant="h6" gutterBottom>
          Informações do Relatório
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="name"
              name="name"
              label="Nome do Relatório"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="description"
              name="description"
              label="Descrição"
              multiline
              rows={3}
              value={formData.description || ''}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.type} disabled={loading}>
              <InputLabel id="type-label">Tipo de Relatório</InputLabel>
              <Select
                labelId="type-label"
                id="type"
                name="type"
                value={formData.type}
                label="Tipo de Relatório"
                onChange={handleChange}
              >
                <MenuItem value="facebook">Facebook Ads</MenuItem>
                <MenuItem value="google">Google Ads</MenuItem>
                <MenuItem value="instagram">Instagram Ads</MenuItem>
                <MenuItem value="analytics">Google Analytics</MenuItem>
                <MenuItem value="custom">Personalizado</MenuItem>
              </Select>
              {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                id="status"
                name="status"
                value={formData.status}
                label="Status"
                onChange={handleChange}
              >
                <MenuItem value={REPORT_STATUSES.DRAFT}>Rascunho</MenuItem>
                <MenuItem value={REPORT_STATUSES.PENDING}>Pendente</MenuItem>
                <MenuItem value={REPORT_STATUSES.PROCESSING}>Processando</MenuItem>
                <MenuItem value={REPORT_STATUSES.COMPLETED}>Concluído</MenuItem>
                <MenuItem value={REPORT_STATUSES.ERROR}>Erro</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <DatePicker
                label="Data de Início"
                value={formData.startDate}
                onChange={(newValue) => handleDateChange('startDate', newValue)}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    error: !!errors.startDate,
                    helperText: errors.startDate,
                    disabled: loading
                  } 
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <DatePicker
                label="Data de Fim"
                value={formData.endDate}
                onChange={(newValue) => handleDateChange('endDate', newValue)}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    error: !!errors.endDate,
                    helperText: errors.endDate,
                    disabled: loading
                  } 
                }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          {onCancel && (
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
          >
            {loading ? 'Salvando...' : submitButtonText}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default ReportForm;
