import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Switch,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  CircularProgress,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import SuperadminSidebar from '../../components/superadmin/SuperadminSidebar';
import { useSnackbar } from 'notistack';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { enqueueSnackbar } = useSnackbar();

  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    primaryColor: '#3f51b5',
    secondaryColor: '#f50057',
    isActive: true,
  });

  useEffect(() => {
    fetchCompanies();
  }, [page, rowsPerPage, searchTerm, statusFilter]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/superadmin/companies', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      });
      setCompanies(response.data.companies);
      setTotalCompanies(response.data.total);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching companies:', error);
      enqueueSnackbar('Erro ao carregar empresas', { variant: 'error' });
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (company = null) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name,
        logoUrl: company.logoUrl || '',
        primaryColor: company.primaryColor || '#3f51b5',
        secondaryColor: company.secondaryColor || '#f50057',
        isActive: company.isActive,
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: '',
        logoUrl: '',
        primaryColor: '#3f51b5',
        secondaryColor: '#f50057',
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      enqueueSnackbar('Nome da empresa é obrigatório', { variant: 'error' });
      return;
    }

    try {
      setDialogLoading(true);

      if (editingCompany) {
        // Update existing company
        await api.put(`/api/superadmin/companies/${editingCompany.id}`, formData);
        enqueueSnackbar('Empresa atualizada com sucesso', { variant: 'success' });
      } else {
        // Create new company
        await api.post('/api/superadmin/companies', formData);
        enqueueSnackbar('Empresa criada com sucesso', { variant: 'success' });
      }

      setDialogLoading(false);
      handleCloseDialog();
      fetchCompanies();
    } catch (error) {
      console.error('Error saving company:', error);
      enqueueSnackbar(
        `Erro ao ${editingCompany ? 'atualizar' : 'criar'} empresa`,
        { variant: 'error' }
      );
      setDialogLoading(false);
    }
  };

  const handleStatusChange = async (company, newStatus) => {
    try {
      await api.put(`/api/superadmin/companies/${company.id}`, {
        isActive: newStatus,
      });
      fetchCompanies();
      enqueueSnackbar(
        `Empresa ${newStatus ? 'ativada' : 'desativada'} com sucesso`,
        { variant: 'success' }
      );
    } catch (error) {
      console.error('Error updating company status:', error);
      enqueueSnackbar('Erro ao alterar status da empresa', { variant: 'error' });
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <SuperadminSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Container maxWidth="lg">
          <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
            <Grid item xs={12} sm={8}>
              <Typography variant="h4" component="h1" gutterBottom>
                Gerenciamento de Empresas
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Nova Empresa
              </Button>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Buscar empresas"
                  variant="outlined"
                  fullWidth
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton onClick={handleClearSearch} size="small">
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="active">Ativas</MenuItem>
                    <MenuItem value="inactive">Inativas</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Nome</TableCell>
                    <TableCell>Usuários</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Criado em</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress size={30} />
                      </TableCell>
                    </TableRow>
                  ) : companies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Nenhuma empresa encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    companies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>{company.id}</TableCell>
                        <TableCell>{company.name}</TableCell>
                        <TableCell>{company.userCount || 0}</TableCell>
                        <TableCell>
                          <Switch
                            checked={company.isActive}
                            onChange={(e) =>
                              handleStatusChange(company, e.target.checked)
                            }
                            color="primary"
                          />
                          {company.isActive ? 'Ativa' : 'Inativa'}
                        </TableCell>
                        <TableCell>
                          {new Date(company.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenDialog(company)}
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalCompanies}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Linhas por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count}`
              }
            />
          </Paper>

          {/* Company Form Dialog */}
          <Dialog
            open={openDialog}
            onClose={handleCloseDialog}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>
              {editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
            </DialogTitle>
            <DialogContent>
              <Box component="form" noValidate sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      name="name"
                      label="Nome da Empresa"
                      fullWidth
                      required
                      value={formData.name}
                      onChange={handleFormChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="logoUrl"
                      label="URL do Logo"
                      fullWidth
                      value={formData.logoUrl}
                      onChange={handleFormChange}
                      helperText="URL de uma imagem para o logo da empresa"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      name="primaryColor"
                      label="Cor Primária"
                      fullWidth
                      value={formData.primaryColor}
                      onChange={handleFormChange}
                      type="color"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      name="secondaryColor"
                      label="Cor Secundária"
                      fullWidth
                      value={formData.secondaryColor}
                      onChange={handleFormChange}
                      type="color"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  {editingCompany && (
                    <Grid item xs={12}>
                      <FormControl component="fieldset">
                        <Grid container alignItems="center">
                          <Grid item>
                            <Switch
                              name="isActive"
                              checked={formData.isActive}
                              onChange={handleFormChange}
                              color="primary"
                            />
                          </Grid>
                          <Grid item>
                            <Typography variant="body1">
                              {formData.isActive
                                ? 'Empresa Ativa'
                                : 'Empresa Inativa'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </FormControl>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancelar</Button>
              <Button
                onClick={handleSubmit}
                color="primary"
                disabled={dialogLoading}
                startIcon={
                  dialogLoading ? <CircularProgress size={20} /> : null
                }
              >
                {editingCompany ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </Box>
  );
};

export default Companies;
