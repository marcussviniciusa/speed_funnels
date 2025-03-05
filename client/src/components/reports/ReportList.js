import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { REPORT_STATUSES } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import DataTable from '../tables/DataTable';

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
 * Componente para exibir a lista de relatórios
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Array} props.reports - Lista de relatórios
 * @param {boolean} props.loading - Indica se os dados estão carregando
 * @param {string} props.error - Mensagem de erro, se houver
 * @param {Object} props.pagination - Configurações de paginação
 * @param {Function} props.onPageChange - Função chamada quando a página é alterada
 * @param {Function} props.onRowsPerPageChange - Função chamada quando o número de linhas por página é alterado
 * @param {Function} props.onSortChange - Função chamada quando a ordenação é alterada
 * @param {Function} props.onView - Função chamada ao clicar em visualizar
 * @param {Function} props.onEdit - Função chamada ao clicar em editar
 * @param {Function} props.onDelete - Função chamada ao clicar em excluir
 * @param {Function} props.onDownload - Função chamada ao clicar em baixar
 */
const ReportList = ({
  reports = [],
  loading = false,
  error = null,
  pagination,
  onPageChange,
  onRowsPerPageChange,
  onSortChange,
  onView,
  onEdit,
  onDelete,
  onDownload
}) => {
  // Definição das colunas da tabela
  const columns = [
    {
      id: 'name',
      label: 'Nome',
      sortable: true,
      render: (row) => (
        <Box>
          <Typography variant="subtitle2">{row.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {typeLabels[row.type] || row.type}
          </Typography>
        </Box>
      )
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <Chip
          label={statusLabels[row.status] || row.status}
          color={statusColors[row.status] || 'default'}
          size="small"
        />
      )
    },
    {
      id: 'createdAt',
      label: 'Criado em',
      sortable: true,
      render: (row) => formatDate(row.createdAt)
    },
    {
      id: 'updatedAt',
      label: 'Atualizado em',
      sortable: true,
      render: (row) => formatDate(row.updatedAt)
    },
    {
      id: 'actions',
      label: 'Ações',
      sortable: false,
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title="Visualizar">
            <IconButton size="small" onClick={() => onView(row)}>
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {row.status === REPORT_STATUSES.COMPLETED && (
            <Tooltip title="Baixar">
              <IconButton size="small" onClick={() => onDownload(row)}>
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {row.status !== REPORT_STATUSES.PROCESSING && (
            <>
              <Tooltip title="Editar">
                <IconButton size="small" onClick={() => onEdit(row)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Excluir">
                <IconButton size="small" color="error" onClick={() => onDelete(row)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      )
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={reports}
      loading={loading}
      error={error}
      pagination={pagination}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      onSortChange={onSortChange}
    />
  );
};

export default ReportList;
