import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Alert
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

/**
 * Componente para configurações gerais da conta
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.settings - Configurações da conta
 * @param {Function} props.onSave - Função chamada ao salvar as configurações
 * @param {boolean} props.loading - Indica se o componente está carregando
 */
const AccountSettings = ({ 
  settings = {}, 
  onSave,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    timezone: 'America/Sao_Paulo',
    dateFormat: 'DD/MM/YYYY',
    currency: 'BRL',
    language: 'pt-BR',
    ...settings
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Manipula a alteração dos campos do formulário
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  // Manipula o envio do formulário
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.companyName.trim()) {
      setError('O nome da empresa é obrigatório');
      return;
    }
    
    setSuccess('');
    onSave(formData)
      .then(() => {
        setSuccess('Configurações salvas com sucesso!');
        setTimeout(() => setSuccess(''), 3000);
      })
      .catch(err => {
        setError(err.message || 'Erro ao salvar as configurações');
      });
  };

  // Lista de indústrias
  const industries = [
    'Tecnologia',
    'E-commerce',
    'Saúde',
    'Educação',
    'Finanças',
    'Varejo',
    'Serviços',
    'Manufatura',
    'Mídia e Entretenimento',
    'Alimentação',
    'Turismo',
    'Outro'
  ];

  // Lista de fusos horários
  const timezones = [
    'America/Sao_Paulo',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney'
  ];

  // Lista de formatos de data
  const dateFormats = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2023)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2023)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2023-12-31)' }
  ];

  // Lista de moedas
  const currencies = [
    { value: 'BRL', label: 'Real Brasileiro (R$)' },
    { value: 'USD', label: 'Dólar Americano ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'Libra Esterlina (£)' }
  ];

  // Lista de idiomas
  const languages = [
    { value: 'pt-BR', label: 'Português (Brasil)' },
    { value: 'en-US', label: 'English (United States)' },
    { value: 'es-ES', label: 'Español' },
    { value: 'fr-FR', label: 'Français' }
  ];

  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Typography variant="h6" gutterBottom>
          Configurações da Conta
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Nome da Empresa"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              disabled={loading}
              error={error.includes('empresa')}
              helperText={error.includes('empresa') ? error : ''}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel id="industry-label">Indústria</InputLabel>
              <Select
                labelId="industry-label"
                value={formData.industry}
                onChange={(e) => handleChange('industry', e.target.value)}
                label="Indústria"
              >
                {industries.map((industry) => (
                  <MenuItem key={industry} value={industry}>
                    {industry}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Selecione a indústria da sua empresa</FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel id="timezone-label">Fuso Horário</InputLabel>
              <Select
                labelId="timezone-label"
                value={formData.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                label="Fuso Horário"
              >
                {timezones.map((timezone) => (
                  <MenuItem key={timezone} value={timezone}>
                    {timezone}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Fuso horário usado para relatórios e dados</FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel id="date-format-label">Formato de Data</InputLabel>
              <Select
                labelId="date-format-label"
                value={formData.dateFormat}
                onChange={(e) => handleChange('dateFormat', e.target.value)}
                label="Formato de Data"
              >
                {dateFormats.map((format) => (
                  <MenuItem key={format.value} value={format.value}>
                    {format.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Como as datas serão exibidas na plataforma</FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel id="currency-label">Moeda</InputLabel>
              <Select
                labelId="currency-label"
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                label="Moeda"
              >
                {currencies.map((currency) => (
                  <MenuItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Moeda usada para valores monetários</FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel id="language-label">Idioma</InputLabel>
              <Select
                labelId="language-label"
                value={formData.language}
                onChange={(e) => handleChange('language', e.target.value)}
                label="Idioma"
              >
                {languages.map((language) => (
                  <MenuItem key={language.value} value={language.value}>
                    {language.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Idioma da interface do usuário</FormHelperText>
            </FormControl>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          >
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default AccountSettings;
