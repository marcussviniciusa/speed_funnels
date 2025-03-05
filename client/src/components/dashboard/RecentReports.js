import React from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Chip,
  Button,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
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

/**
 * Componente para exibir os relatórios recentes no dashboard
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Array} props.reports - Lista de relatórios recentes
 * @param {boolean} props.loading - Indica se os dados estão carregando
 */
const RecentReports = ({ reports = [], loading = false }) => {
  const navigate = useNavigate();

  const handleViewReport = (reportId) => {
    navigate(`/reports/${reportId}`);
  };

  const handleViewAllReports = () => {
    navigate('/reports');
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader 
        title="Relatórios Recentes" 
        action={
          <Button
            endIcon={<ArrowForwardIcon />}
            onClick={handleViewAllReports}
            size="small"
          >
            Ver Todos
          </Button>
        }
      />
      <Divider />
      <CardContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : reports.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Nenhum relatório encontrado
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {reports.map((report, index) => (
              <React.Fragment key={report.id}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" noWrap>
                        {report.name}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={statusLabels[report.status] || report.status}
                          color={statusColors[report.status] || 'default'}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          {formatDate(report.updatedAt || report.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleViewReport(report.id)}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < reports.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentReports;
