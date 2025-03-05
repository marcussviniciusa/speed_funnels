import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  GetApp as GetAppIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { formatCurrency, formatDate, formatInvoiceStatus } from '../../utils/formatters';

/**
 * Componente para exibir histórico de faturas
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Array} props.invoices - Lista de faturas
 * @param {Function} props.onViewInvoice - Função chamada ao clicar em visualizar fatura
 * @param {Function} props.onDownloadInvoice - Função chamada ao clicar em baixar fatura
 * @param {boolean} props.loading - Indica se o componente está carregando
 */
const InvoiceHistory = ({
  invoices = [],
  onViewInvoice,
  onDownloadInvoice,
  loading = false
}) => {
  // Renderiza o status da fatura com o componente Chip
  const renderStatus = (status) => {
    let color = 'default';
    let label = formatInvoiceStatus(status);
    
    switch (status) {
      case 'paid':
        color = 'success';
        break;
      case 'pending':
      case 'open':
        color = 'warning';
        break;
      case 'failed':
        color = 'error';
        break;
      case 'canceled':
      case 'void':
        color = 'default';
        break;
    }
    
    return <Chip label={label} color={color} size="small" />;
  };

  if (loading) {
    return (
      <Paper elevation={0} sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Histórico de Faturas
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="textSecondary">
                    Nenhuma fatura encontrada.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.number}</TableCell>
                  <TableCell>{formatDate(invoice.date)}</TableCell>
                  <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell>{renderStatus(invoice.status)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Visualizar Fatura">
                      <IconButton
                        size="small"
                        onClick={() => onViewInvoice(invoice.id)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Baixar Fatura">
                      <IconButton
                        size="small"
                        onClick={() => onDownloadInvoice(invoice.id)}
                      >
                        <GetAppIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default InvoiceHistory;
