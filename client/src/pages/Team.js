import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Grid,
  TextField,
  Button
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import TeamMembers from '../components/team/TeamMembers';
import teamService from '../services/teamService';

/**
 * Página de gerenciamento da equipe
 */
const Team = () => {
  const [teamDetails, setTeamDetails] = useState({
    name: '',
    description: '',
    website: '',
    industry: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Carrega os detalhes da equipe
  const fetchTeamDetails = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await teamService.getTeamDetails();
      setTeamDetails(data);
    } catch (err) {
      console.error('Erro ao carregar detalhes da equipe:', err);
      setError('Falha ao carregar os detalhes da equipe. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamDetails();
  }, []);

  // Manipula a alteração dos campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTeamDetails(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  // Manipula o envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const updatedTeam = await teamService.updateTeamDetails(teamDetails);
      setTeamDetails(updatedTeam);
      setSuccess('Detalhes da equipe atualizados com sucesso!');
      
      // Limpa a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Erro ao atualizar detalhes da equipe:', err);
      setError('Falha ao atualizar os detalhes da equipe. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Gerenciamento de Equipe
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} lg={5}>
          <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Detalhes da Equipe
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                margin="normal"
                required
                label="Nome da Equipe"
                name="name"
                value={teamDetails.name}
                onChange={handleChange}
                disabled={loading}
              />
              
              <TextField
                fullWidth
                margin="normal"
                label="Descrição"
                name="description"
                value={teamDetails.description}
                onChange={handleChange}
                multiline
                rows={3}
                disabled={loading}
              />
              
              <TextField
                fullWidth
                margin="normal"
                label="Website"
                name="website"
                value={teamDetails.website}
                onChange={handleChange}
                disabled={loading}
              />
              
              <TextField
                fullWidth
                margin="normal"
                label="Indústria"
                name="industry"
                value={teamDetails.industry}
                onChange={handleChange}
                disabled={loading}
              />
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} lg={7}>
          <TeamMembers />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Team;
