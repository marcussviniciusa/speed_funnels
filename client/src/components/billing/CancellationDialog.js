import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Alert,
  Box,
  Typography
} from '@mui/material';

/**
 * Componente para diálogo de cancelamento de assinatura
 * 
 * @param {Object} props - Propriedades do componente
 * @param {boolean} props.open - Indica se o diálogo está aberto
 * @param {Function} props.onClose - Função chamada ao fechar o diálogo
 * @param {Function} props.onConfirm - Função chamada ao confirmar o cancelamento
 * @param {boolean} props.loading - Indica se o componente está carregando
 */
const CancellationDialog = ({
  open,
  onClose,
  onConfirm,
  loading = false
}) => {
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  // Lista de motivos para cancelamento
  const cancellationReasons = [
    'Preço muito alto',
    'Não estou usando o suficiente',
    'Encontrei uma alternativa melhor',
    'Problemas técnicos',
    'Faltam recursos importantes',
    'Outro'
  ];

  // Manipula a alteração do motivo
  const handleReasonChange = (e) => {
    setReason(e.target.value);
    setError('');
  };

  // Manipula a alteração do feedback
  const handleFeedbackChange = (e) => {
    setFeedback(e.target.value);
  };

  // Manipula o envio do formulário
  const handleSubmit = () => {
    if (!reason) {
      setError('Por favor, selecione um motivo para o cancelamento');
      return;
    }
    
    onConfirm({
      reason,
      feedback
    });
  };

  // Limpa o formulário ao fechar o diálogo
  const handleClose = () => {
    setReason('');
    setFeedback('');
    setError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? null : handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Cancelar Assinatura</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 3 }}>
          Lamentamos que você esteja considerando cancelar sua assinatura. Sua opinião é importante para nós e nos ajuda a melhorar nossos serviços.
        </DialogContentText>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 3 }}>
          <FormControl component="fieldset" required error={!!error}>
            <FormLabel component="legend">Por que você está cancelando?</FormLabel>
            <RadioGroup
              aria-label="motivo-cancelamento"
              name="reason"
              value={reason}
              onChange={handleReasonChange}
            >
              {cancellationReasons.map((r) => (
                <FormControlLabel
                  key={r}
                  value={r}
                  control={<Radio disabled={loading} />}
                  label={r}
                  disabled={loading}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>
        
        <TextField
          fullWidth
          label="Comentários adicionais"
          multiline
          rows={4}
          value={feedback}
          onChange={handleFeedbackChange}
          placeholder="Conte-nos mais sobre sua experiência e como podemos melhorar..."
          disabled={loading}
        />
        
        <Box sx={{ mt: 3, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="error.dark" gutterBottom>
            Importante:
          </Typography>
          <Typography variant="body2" color="error.dark">
            Ao cancelar sua assinatura, você continuará tendo acesso aos recursos até o final do período de faturamento atual. Após esse período, sua conta será rebaixada para o plano gratuito com recursos limitados.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Voltar
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="error" 
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Processando...' : 'Confirmar Cancelamento'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CancellationDialog;
