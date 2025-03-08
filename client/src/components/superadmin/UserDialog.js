import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Chip,
  Box,
  Typography,
  CircularProgress,
  FormHelperText,
  OutlinedInput,
} from '@mui/material';
import superadminService from '../../services/superadminService';
import { useSnackbar } from 'notistack';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const UserDialog = ({ open, user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    companyIds: [],
    companyRoles: {}, // Map of companyId -> role
  });
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [errors, setErrors] = useState({});
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (user) {
      const companyIds = user.companies?.map(c => c.id) || [];
      const companyRoles = {};
      
      user.companies?.forEach(company => {
        companyRoles[company.id] = company.userCompany?.role || 'viewer';
      });

      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '', // Don't set password for edit
        role: user.role || 'user',
        companyIds,
        companyRoles,
      });
    } else {
      // Reset form for new user
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
        companyIds: [],
        companyRoles: {},
      });
    }
  }, [user]);

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const response = await superadminService.getCompanies(1, 100, '', 'active');
      setCompanies(response.companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
      enqueueSnackbar('Erro ao carregar empresas', { variant: 'error' });
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when field changes
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleCompanyChange = (event) => {
    const { value } = event.target;
    setFormData(prev => ({
      ...prev,
      companyIds: value,
    }));
  };

  const handleCompanyRoleChange = (companyId, role) => {
    setFormData(prev => ({
      ...prev,
      companyRoles: {
        ...prev.companyRoles,
        [companyId]: role,
      },
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.email.trim()) newErrors.email = 'Email é obrigatório';
    if (!user && !formData.password.trim()) newErrors.password = 'Senha é obrigatória para novos usuários';
    
    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email.trim() && !emailRegex.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    // Password validation - at least 6 characters
    if (formData.password && formData.password.length < 6 && formData.password.length > 0) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Transform companyRoles from object to array format expected by API
      const companyRolesArray = formData.companyIds.map(companyId => 
        formData.companyRoles[companyId] || 'viewer'
      );
      
      const userData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        companyIds: formData.companyIds,
        companyRoles: companyRolesArray,
      };
      
      // Only include password if it's provided (required for new users)
      if (formData.password) {
        userData.password = formData.password;
      }
      
      await onSave(userData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{user ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              name="name"
              label="Nome"
              fullWidth
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="email"
              label="Email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="password"
              label={user ? 'Nova Senha (opcional)' : 'Senha'}
              type="password"
              fullWidth
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password || (user ? 'Deixe em branco para manter a senha atual' : '')}
              required={!user}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Papel no Sistema</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                label="Papel no Sistema"
              >
                <MenuItem value="superadmin">Superadmin</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="user">Usuário Regular</MenuItem>
              </Select>
              <FormHelperText>
                Superadmin: Acesso total ao sistema | Admin: Gerencia apenas sua empresa | Usuário: Acesso limitado
              </FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Empresas</InputLabel>
              <Select
                multiple
                value={formData.companyIds}
                onChange={handleCompanyChange}
                input={<OutlinedInput label="Empresas" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((companyId) => {
                      const company = companies.find(c => c.id === companyId);
                      return company ? (
                        <Chip 
                          key={companyId} 
                          label={company.name} 
                        />
                      ) : null;
                    })}
                  </Box>
                )}
                MenuProps={MenuProps}
                disabled={loadingCompanies}
              >
                {loadingCompanies ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} /> Carregando empresas...
                  </MenuItem>
                ) : (
                  companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      <Checkbox checked={formData.companyIds.indexOf(company.id) > -1} />
                      <ListItemText primary={company.name} />
                    </MenuItem>
                  ))
                )}
              </Select>
              <FormHelperText>Selecione as empresas que este usuário poderá acessar</FormHelperText>
            </FormControl>
          </Grid>
          
          {formData.companyIds.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Papéis por Empresa:
              </Typography>
              <Grid container spacing={2}>
                {formData.companyIds.map(companyId => {
                  const company = companies.find(c => c.id === companyId);
                  if (!company) return null;
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={companyId}>
                      <FormControl fullWidth>
                        <InputLabel>{company.name}</InputLabel>
                        <Select
                          value={formData.companyRoles[companyId] || 'viewer'}
                          onChange={(e) => handleCompanyRoleChange(companyId, e.target.value)}
                          label={company.name}
                        >
                          <MenuItem value="admin">Admin</MenuItem>
                          <MenuItem value="editor">Editor</MenuItem>
                          <MenuItem value="viewer">Visualizador</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  );
                })}
              </Grid>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : user ? 'Atualizar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDialog;
