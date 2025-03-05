import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  CircularProgress,
  Typography
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';

/**
 * Componente de tabela de dados com ordenação e paginação
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Array} props.columns - Colunas da tabela
 * @param {Array} props.data - Dados da tabela
 * @param {boolean} props.loading - Indica se a tabela está carregando
 * @param {string} props.error - Mensagem de erro, se houver
 * @param {Object} props.pagination - Configurações de paginação
 * @param {Function} props.onPageChange - Função chamada quando a página é alterada
 * @param {Function} props.onRowsPerPageChange - Função chamada quando o número de linhas por página é alterado
 * @param {Function} props.onSortChange - Função chamada quando a ordenação é alterada
 */
const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  error = null,
  pagination = {
    page: 0,
    pageSize: 10,
    totalCount: 0,
    pageSizeOptions: [5, 10, 25, 50]
  },
  onPageChange,
  onRowsPerPageChange,
  onSortChange,
}) => {
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('asc');

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    const newOrder = isAsc ? 'desc' : 'asc';
    setOrder(newOrder);
    setOrderBy(property);

    if (onSortChange) {
      onSortChange(property, newOrder);
    }
  };

  const handleChangePage = (event, newPage) => {
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    if (onRowsPerPageChange) {
      onRowsPerPageChange(parseInt(event.target.value, 10));
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="medium">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align || 'left'}
                    padding={column.disablePadding ? 'none' : 'normal'}
                    sortDirection={orderBy === column.id ? order : false}
                    sx={{ fontWeight: 'bold' }}
                  >
                    {column.sortable !== false ? (
                      <TableSortLabel
                        active={orderBy === column.id}
                        direction={orderBy === column.id ? order : 'asc'}
                        onClick={() => handleRequestSort(column.id)}
                      >
                        {column.label}
                        {orderBy === column.id ? (
                          <Box component="span" sx={visuallyHidden}>
                            {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                          </Box>
                        ) : null}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow style={{ height: 53 * 5 }}>
                  <TableCell colSpan={columns.length} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow style={{ height: 53 * 5 }}>
                  <TableCell colSpan={columns.length} align="center">
                    <Typography color="error">{error}</Typography>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow style={{ height: 53 * 5 }}>
                  <TableCell colSpan={columns.length} align="center">
                    Nenhum dado encontrado
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => (
                  <TableRow
                    hover
                    tabIndex={-1}
                    key={row.id || index}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.id} align={column.align || 'left'}>
                        {column.render ? column.render(row) : row[column.id]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {pagination && (
          <TablePagination
            rowsPerPageOptions={pagination.pageSizeOptions}
            component="div"
            count={pagination.totalCount}
            rowsPerPage={pagination.pageSize}
            page={pagination.page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Linhas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        )}
      </Paper>
    </Box>
  );
};

export default DataTable;
