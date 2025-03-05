import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  Person as PersonIcon,
  CalendarToday as CalendarTodayIcon,
  Lock as LockIcon
} from '@mui/icons-material';

/**
 * Componente para atualização de método de pagamento
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.currentPaymentMethod - Método de pagamento atual
 * @param {Function} props.onSubmit - Função chamada ao enviar o formulário
 * @param {Function} props.onCancel - Função chamada ao cancelar a operação
 * @param {boolean} props.loading - Indica se o componente está carregando
 */
const PaymentMethodForm = ({
  currentPaymentMethod = {},
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    ...currentPaymentMethod
  });
  const [errors, setErrors] = useState({});

  // Gera os anos para o select de expiração
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 15; i++) {
      years.push(currentYear + i);
    }
    return years;
  };

  // Manipula a alteração dos campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validação específica para cada campo
    let formattedValue = value;
    
    if (name === 'cardNumber') {
      // Remove caracteres não numéricos e limita a 16 dígitos
      formattedValue = value.replace(/\D/g, '').slice(0, 16);
    } else if (name === 'cvv') {
      // Remove caracteres não numéricos e limita a 4 dígitos
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }
    
    setFormData({
      ...formData,
      [name]: formattedValue
    });
    
    // Limpa o erro do campo
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Formata o número do cartão para exibição
  const formatCardNumber = (value) => {
    if (!value) return '';
    const regex = /(\d{1,4})(\d{1,4})?(\d{1,4})?(\d{1,4})?/;
    const match = value.match(regex);
    
    if (!match) return value;
    
    let formatted = match[1] || '';
    if (match[2]) formatted += ' ' + match[2];
    if (match[3]) formatted += ' ' + match[3];
    if (match[4]) formatted += ' ' + match[4];
    
    return formatted;
  };

  // Valida o formulário
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.cardNumber || formData.cardNumber.length < 15) {
      newErrors.cardNumber = 'Número do cartão inválido';
    }
    
    if (!formData.cardholderName) {
      newErrors.cardholderName = 'Nome do titular é obrigatório';
    }
    
    if (!formData.expiryMonth) {
      newErrors.expiryMonth = 'Mês de expiração é obrigatório';
    }
    
    if (!formData.expiryYear) {
      newErrors.expiryYear = 'Ano de expiração é obrigatório';
    }
    
    if (!formData.cvv || formData.cvv.length < 3) {
      newErrors.cvv = 'CVV inválido';
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
      <Typography variant="h6" gutterBottom>
        Atualizar Método de Pagamento
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Número do Cartão"
              name="cardNumber"
              value={formatCardNumber(formData.cardNumber)}
              onChange={handleChange}
              error={!!errors.cardNumber}
              helperText={errors.cardNumber}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CreditCardIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Nome do Titular"
              name="cardholderName"
              value={formData.cardholderName}
              onChange={handleChange}
              error={!!errors.cardholderName}
              helperText={errors.cardholderName}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!!errors.expiryMonth}>
              <InputLabel id="expiry-month-label">Mês de Expiração</InputLabel>
              <Select
                labelId="expiry-month-label"
                name="expiryMonth"
                value={formData.expiryMonth}
                onChange={handleChange}
                label="Mês de Expiração"
                disabled={loading}
                startAdornment={
                  <InputAdornment position="start">
                    <CalendarTodayIcon />
                  </InputAdornment>
                }
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <MenuItem key={month} value={month.toString().padStart(2, '0')}>
                    {month.toString().padStart(2, '0')}
                  </MenuItem>
                ))}
              </Select>
              {errors.expiryMonth && (
                <Typography variant="caption" color="error">
                  {errors.expiryMonth}
                </Typography>
              )}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!!errors.expiryYear}>
              <InputLabel id="expiry-year-label">Ano de Expiração</InputLabel>
              <Select
                labelId="expiry-year-label"
                name="expiryYear"
                value={formData.expiryYear}
                onChange={handleChange}
                label="Ano de Expiração"
                disabled={loading}
              >
                {generateYears().map((year) => (
                  <MenuItem key={year} value={year.toString()}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
              {errors.expiryYear && (
                <Typography variant="caption" color="error">
                  {errors.expiryYear}
                </Typography>
              )}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="CVV"
              name="cvv"
              value={formData.cvv}
              onChange={handleChange}
              error={!!errors.cvv}
              helperText={errors.cvv}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'Salvando...' : 'Salvar Método de Pagamento'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default PaymentMethodForm;
