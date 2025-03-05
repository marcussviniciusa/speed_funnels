import React, { useState, useEffect } from 'react';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid,
  Button
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { 
  startOfDay, 
  endOfDay, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  subMonths 
} from 'date-fns';
import { DATE_RANGES } from '../../utils/constants';

/**
 * Componente de filtro de intervalo de datas
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Function} props.onFilterChange - Função chamada quando o filtro é alterado
 * @param {Object} props.initialValues - Valores iniciais do filtro
 */
const DateRangeFilter = ({ onFilterChange, initialValues = {} }) => {
  const [range, setRange] = useState(initialValues.range || DATE_RANGES.LAST_30_DAYS);
  const [startDate, setStartDate] = useState(initialValues.startDate || subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(initialValues.endDate || new Date());
  const [showCustomRange, setShowCustomRange] = useState(range === DATE_RANGES.CUSTOM);

  useEffect(() => {
    // Atualiza as datas com base no intervalo selecionado
    switch (range) {
      case DATE_RANGES.TODAY:
        setStartDate(startOfDay(new Date()));
        setEndDate(endOfDay(new Date()));
        break;
      case DATE_RANGES.YESTERDAY:
        setStartDate(startOfDay(subDays(new Date(), 1)));
        setEndDate(endOfDay(subDays(new Date(), 1)));
        break;
      case DATE_RANGES.LAST_7_DAYS:
        setStartDate(startOfDay(subDays(new Date(), 6)));
        setEndDate(endOfDay(new Date()));
        break;
      case DATE_RANGES.LAST_30_DAYS:
        setStartDate(startOfDay(subDays(new Date(), 29)));
        setEndDate(endOfDay(new Date()));
        break;
      case DATE_RANGES.THIS_MONTH:
        setStartDate(startOfMonth(new Date()));
        setEndDate(endOfDay(new Date()));
        break;
      case DATE_RANGES.LAST_MONTH:
        const lastMonth = subMonths(new Date(), 1);
        setStartDate(startOfMonth(lastMonth));
        setEndDate(endOfMonth(lastMonth));
        break;
      case DATE_RANGES.CUSTOM:
        // Mantém as datas atuais para o intervalo personalizado
        break;
      default:
        break;
    }

    setShowCustomRange(range === DATE_RANGES.CUSTOM);
  }, [range]);

  useEffect(() => {
    // Notifica o componente pai sobre a alteração do filtro
    onFilterChange({
      range,
      startDate,
      endDate,
    });
  }, [range, startDate, endDate, onFilterChange]);

  const handleApplyFilter = () => {
    onFilterChange({
      range,
      startDate,
      endDate,
    });
  };

  return (
    <Box>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={showCustomRange ? 4 : 10}>
          <FormControl fullWidth>
            <InputLabel id="date-range-select-label">Período</InputLabel>
            <Select
              labelId="date-range-select-label"
              id="date-range-select"
              value={range}
              label="Período"
              onChange={(e) => setRange(e.target.value)}
            >
              <MenuItem value={DATE_RANGES.TODAY}>Hoje</MenuItem>
              <MenuItem value={DATE_RANGES.YESTERDAY}>Ontem</MenuItem>
              <MenuItem value={DATE_RANGES.LAST_7_DAYS}>Últimos 7 dias</MenuItem>
              <MenuItem value={DATE_RANGES.LAST_30_DAYS}>Últimos 30 dias</MenuItem>
              <MenuItem value={DATE_RANGES.THIS_MONTH}>Este mês</MenuItem>
              <MenuItem value={DATE_RANGES.LAST_MONTH}>Mês passado</MenuItem>
              <MenuItem value={DATE_RANGES.CUSTOM}>Personalizado</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {showCustomRange && (
          <>
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                <DatePicker
                  label="Data de Início"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                <DatePicker
                  label="Data de Fim"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
          </>
        )}

        <Grid item xs={12} md={2}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleApplyFilter}
            sx={{ height: '56px' }}
          >
            Aplicar
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DateRangeFilter;
