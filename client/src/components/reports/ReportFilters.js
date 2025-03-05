import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { REPORT_STATUSES } from '../../utils/constants';

/**
 * Componente de filtros para relatórios
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.filters - Filtros atuais
 * @param {Function} props.onFilterChange - Função chamada quando os filtros são alterados
 */
const ReportFilters = ({ filters = {}, onFilterChange }) => {
  const [expanded, setExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    search: '',
    status: '',
    type: '',
    ...filters
  });

  // Atualiza os filtros locais quando os filtros externos mudam
  useEffect(() => {
    setLocalFilters({
      search: '',
      status: '',
      type: '',
      ...filters
    });
  }, [filters]);

  // Manipula a alteração dos campos de filtro
  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Aplica os filtros
  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  // Limpa os filtros
  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      status: '',
      type: ''
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  // Manipula a pesquisa rápida
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleApplyFilters();
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: expanded ? 2 : 0 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Pesquisar relatórios..."
            name="search"
            value={localFilters.search}
            onChange={handleChange}
            onKeyDown={handleSearchKeyDown}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              endAdornment: (
                localFilters.search ? (
                  <IconButton
                    size="small"
                    onClick={() => {
                      setLocalFilters(prev => ({ ...prev, search: '' }));
                    }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                ) : null
              )
            }}
          />
          <Tooltip title="Filtros avançados">
            <IconButton 
              sx={{ ml: 1 }} 
              onClick={() => setExpanded(!expanded)}
              color={expanded ? 'primary' : 'default'}
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Collapse in={expanded}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  id="status-filter"
                  name="status"
                  value={localFilters.status}
                  label="Status"
                  onChange={handleChange}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value={REPORT_STATUSES.DRAFT}>Rascunho</MenuItem>
                  <MenuItem value={REPORT_STATUSES.PENDING}>Pendente</MenuItem>
                  <MenuItem value={REPORT_STATUSES.PROCESSING}>Processando</MenuItem>
                  <MenuItem value={REPORT_STATUSES.COMPLETED}>Concluído</MenuItem>
                  <MenuItem value={REPORT_STATUSES.ERROR}>Erro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="type-filter-label">Tipo</InputLabel>
                <Select
                  labelId="type-filter-label"
                  id="type-filter"
                  name="type"
                  value={localFilters.type}
                  label="Tipo"
                  onChange={handleChange}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="facebook">Facebook Ads</MenuItem>
                  <MenuItem value="google">Google Ads</MenuItem>
                  <MenuItem value="instagram">Instagram Ads</MenuItem>
                  <MenuItem value="analytics">Google Analytics</MenuItem>
                  <MenuItem value="custom">Personalizado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4} sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleApplyFilters}
                startIcon={<SearchIcon />}
                fullWidth
              >
                Aplicar
              </Button>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                startIcon={<ClearIcon />}
              >
                Limpar
              </Button>
            </Grid>
          </Grid>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default ReportFilters;
