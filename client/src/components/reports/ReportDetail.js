import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Button,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { REPORT_STATUSES } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';

// Mapeamento de status para cores
const statusColors = {
  [REPORT_STATUSES.DRAFT]: 'default',
  [REPORT_STATUSES.PENDING]: 'warning',
  [REPORT_STATUSES.PROCESSING]: 'info',
  [REPORT_STATUSES.COMPLETED]: 'success',
  [REPORT_STATUSES.ERROR]: 'error'
};

// Mapeamento de status para rótulos
const statusLabels = {
  [REPORT_STATUSES.DRAFT]: 'Rascunho',
  [REPORT_STATUSES.PENDING]: 'Pendente',
  [REPORT_STATUSES.PROCESSING]: 'Processando',
  [REPORT_STATUSES.COMPLETED]: 'Concluído',
  [REPORT_STATUSES.ERROR]: 'Erro'
};

// Mapeamento de tipos para rótulos
const typeLabels = {
  'facebook': 'Facebook Ads',
  'google': 'Google Ads',
  'instagram': 'Instagram Ads',
  'analytics': 'Google Analytics',
  'custom': 'Personalizado'
};

/**
 * Componente para exibir os detalhes de um relatório
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.report - Dados do relatório
 * @param {boolean} props.loading - Indica se os dados estão carregando
 * @param {Function} props.onEdit - Função chamada ao clicar em editar
 * @param {Function} props.onDelete - Função chamada ao clicar em excluir
 * @param {Function} props.onDownload - Função chamada ao clicar em baixar
 * @param {Function} props.onGenerate - Função chamada ao clicar em gerar novamente
 */
const ReportDetail = ({
  report,
  loading = false,
  onEdit,
  onDelete,
  onDownload,
  onGenerate
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!report) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1">Relatório não encontrado</Typography>
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h5" component="div" gutterBottom>
              {report.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip 
                label={statusLabels[report.status] || report.status} 
                color={statusColors[report.status] || 'default'} 
                size="small"
              />
              <Chip 
                label={typeLabels[report.type] || report.type} 
                variant="outlined" 
                size="small"
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {report.status === REPORT_STATUSES.COMPLETED && (
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={onDownload}
                size="small"
              >
                Baixar
              </Button>
            )}
            {report.status !== REPORT_STATUSES.PROCESSING && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={onEdit}
                  size="small"
                >
                  Editar
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={onDelete}
                  size="small"
                >
                  Excluir
                </Button>
              </>
            )}
            {(report.status === REPORT_STATUSES.COMPLETED || report.status === REPORT_STATUSES.ERROR) && (
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={onGenerate}
                size="small"
              >
                Gerar Novamente
              </Button>
            )}
          </Box>
        </Box>

        {report.description && (
          <Typography variant="body1" color="text.secondary" paragraph>
            {report.description}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Período do Relatório
            </Typography>
            <Typography variant="body1">
              {report.startDate && report.endDate 
                ? `${formatDate(report.startDate)} até ${formatDate(report.endDate)}`
                : 'Não especificado'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Criado em
            </Typography>
            <Typography variant="body1">
              {report.createdAt ? formatDate(report.createdAt, 'PPpp') : 'N/A'}
            </Typography>
          </Grid>
          
          {report.updatedAt && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Última atualização
              </Typography>
              <Typography variant="body1">
                {formatDate(report.updatedAt, 'PPpp')}
              </Typography>
            </Grid>
          )}
          
          {report.generatedAt && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Gerado em
              </Typography>
              <Typography variant="body1">
                {formatDate(report.generatedAt, 'PPpp')}
              </Typography>
            </Grid>
          )}
          
          {report.errorMessage && report.status === REPORT_STATUSES.ERROR && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="error">
                Erro
              </Typography>
              <Typography variant="body2" color="error">
                {report.errorMessage}
              </Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ReportDetail;
