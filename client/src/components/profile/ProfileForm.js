import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  TextField,
  Avatar,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon
} from '@mui/icons-material';

/**
 * Componente de formulário de perfil do usuário
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.user - Dados do usuário
 * @param {Function} props.onSubmit - Função chamada ao enviar o formulário
 * @param {boolean} props.loading - Indica se o formulário está carregando
 */
const ProfileForm = ({ user = {}, onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    ...user
  });

  const [errors, setErrors] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);

  // Atualiza o formulário quando os dados do usuário mudam
  useEffect(() => {
    if (user) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        position: '',
        ...user
      });
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  // Manipula a alteração dos campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpa o erro do campo quando ele é alterado
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Manipula a alteração da imagem de avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      
      // Cria uma URL temporária para a imagem
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Valida o formulário antes de enviar
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'O nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'O email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.phone && !/^\d{10,11}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Telefone inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manipula o envio do formulário
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Cria um objeto FormData para enviar arquivos
      const formDataToSubmit = new FormData();
      
      // Adiciona os campos do formulário
      Object.keys(formData).forEach(key => {
        formDataToSubmit.append(key, formData[key]);
      });
      
      // Adiciona o arquivo de avatar, se houver
      if (avatarFile) {
        formDataToSubmit.append('avatar', avatarFile);
      }
      
      onSubmit(formDataToSubmit);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Typography variant="h6" gutterBottom>
          Informações do Perfil
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Avatar
            src={avatarPreview}
            alt={formData.name}
            sx={{ width: 100, height: 100, mb: 2 }}
          />
          <input
            accept="image/*"
            id="avatar-upload"
            type="file"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
            disabled={loading}
          />
          <label htmlFor="avatar-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<PhotoCameraIcon />}
              disabled={loading}
            >
              Alterar Foto
            </Button>
          </label>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              required
              fullWidth
              id="name"
              name="name"
              label="Nome Completo"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              required
              fullWidth
              id="email"
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="phone"
              name="phone"
              label="Telefone"
              value={formData.phone || ''}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone}
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="company"
              name="company"
              label="Empresa"
              value={formData.company || ''}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="position"
              name="position"
              label="Cargo"
              value={formData.position || ''}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default ProfileForm;
