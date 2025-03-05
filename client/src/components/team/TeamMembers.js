import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Avatar,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import teamService from '../../services/teamService';

/**
 * Componente para gerenciar membros da equipe
 * 
 * @param {Object} props - Propriedades do componente
 */
const TeamMembers = () => {
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados para o modal de convite
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    name: '',
    role: ''
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Estados para o modal de edição
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editMemberId, setEditMemberId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    role: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Estados para o modal de confirmação de remoção
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteMemberId, setDeleteMemberId] = useState(null);
  const [deleteMemberName, setDeleteMemberName] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Carrega os membros da equipe e papéis disponíveis
  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [membersData, rolesData] = await Promise.all([
        teamService.getTeamMembers(),
        teamService.getAvailableRoles()
      ]);
      
      setMembers(membersData);
      setRoles(rolesData);
    } catch (err) {
      console.error('Erro ao carregar dados da equipe:', err);
      setError('Falha ao carregar os dados da equipe. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Manipula a abertura do modal de convite
  const handleOpenInviteDialog = () => {
    setInviteDialogOpen(true);
    setInviteFormData({
      email: '',
      name: '',
      role: ''
    });
    setInviteError('');
  };

  // Manipula o fechamento do modal de convite
  const handleCloseInviteDialog = () => {
    setInviteDialogOpen(false);
  };

  // Manipula a alteração dos campos do formulário de convite
  const handleInviteFormChange = (e) => {
    const { name, value } = e.target;
    setInviteFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setInviteError('');
  };

  // Manipula o envio do formulário de convite
  const handleInviteSubmit = async () => {
    // Validação básica
    if (!inviteFormData.email.trim()) {
      setInviteError('O email é obrigatório');
      return;
    }
    
    if (!inviteFormData.name.trim()) {
      setInviteError('O nome é obrigatório');
      return;
    }
    
    if (!inviteFormData.role) {
      setInviteError('O papel é obrigatório');
      return;
    }
    
    setInviteLoading(true);
    setInviteError('');
    
    try {
      await teamService.inviteTeamMember(inviteFormData);
      await fetchData(); // Recarrega a lista de membros
      setSuccess('Convite enviado com sucesso!');
      handleCloseInviteDialog();
      
      // Limpa a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Erro ao convidar membro:', err);
      setInviteError(err.response?.data?.message || 'Falha ao enviar o convite. Por favor, tente novamente.');
    } finally {
      setInviteLoading(false);
    }
  };

  // Manipula a abertura do modal de edição
  const handleOpenEditDialog = (member) => {
    setEditDialogOpen(true);
    setEditMemberId(member.id);
    setEditFormData({
      role: member.role
    });
    setEditError('');
  };

  // Manipula o fechamento do modal de edição
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
  };

  // Manipula a alteração dos campos do formulário de edição
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setEditError('');
  };

  // Manipula o envio do formulário de edição
  const handleEditSubmit = async () => {
    // Validação básica
    if (!editFormData.role) {
      setEditError('O papel é obrigatório');
      return;
    }
    
    setEditLoading(true);
    setEditError('');
    
    try {
      await teamService.updateMemberPermissions(editMemberId, {
        role: editFormData.role
      });
      await fetchData(); // Recarrega a lista de membros
      setSuccess('Permissões atualizadas com sucesso!');
      handleCloseEditDialog();
      
      // Limpa a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Erro ao atualizar permissões:', err);
      setEditError(err.response?.data?.message || 'Falha ao atualizar as permissões. Por favor, tente novamente.');
    } finally {
      setEditLoading(false);
    }
  };

  // Manipula a abertura do modal de confirmação de remoção
  const handleOpenDeleteDialog = (member) => {
    setDeleteDialogOpen(true);
    setDeleteMemberId(member.id);
    setDeleteMemberName(member.name);
  };

  // Manipula o fechamento do modal de confirmação de remoção
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  // Manipula a remoção de um membro
  const handleDeleteMember = async () => {
    setDeleteLoading(true);
    
    try {
      await teamService.removeTeamMember(deleteMemberId);
      await fetchData(); // Recarrega a lista de membros
      setSuccess('Membro removido com sucesso!');
      handleCloseDeleteDialog();
      
      // Limpa a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Erro ao remover membro:', err);
      setError('Falha ao remover o membro. Por favor, tente novamente.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Renderiza o chip de status do membro
  const renderStatusChip = (status) => {
    switch (status) {
      case 'active':
        return <Chip label="Ativo" color="success" size="small" />;
      case 'pending':
        return <Chip label="Pendente" color="warning" size="small" />;
      case 'inactive':
        return <Chip label="Inativo" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  // Renderiza o chip de papel do membro
  const renderRoleChip = (role) => {
    switch (role) {
      case 'admin':
        return <Chip label="Administrador" color="primary" size="small" />;
      case 'editor':
        return <Chip label="Editor" color="info" size="small" />;
      case 'viewer':
        return <Chip label="Visualizador" color="default" size="small" />;
      default:
        return <Chip label={role} size="small" />;
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Membros da Equipe
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenInviteDialog}
        >
          Convidar Membro
        </Button>
      </Box>
      <Divider sx={{ mb: 3 }} />
      
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
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Membro</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Papel</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="textSecondary">
                      Nenhum membro encontrado. Convide alguém para sua equipe!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2 }}>
                          {member.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body1">
                          {member.name}
                          {member.isOwner && (
                            <Typography component="span" variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                              (Proprietário)
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{renderRoleChip(member.role)}</TableCell>
                    <TableCell>{renderStatusChip(member.status)}</TableCell>
                    <TableCell align="right">
                      {!member.isOwner && (
                        <>
                          <Tooltip title="Editar permissões">
                            <IconButton 
                              color="primary" 
                              onClick={() => handleOpenEditDialog(member)}
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remover membro">
                            <IconButton 
                              color="error" 
                              onClick={() => handleOpenDeleteDialog(member)}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Modal de Convite */}
      <Dialog open={inviteDialogOpen} onClose={handleCloseInviteDialog}>
        <DialogTitle>Convidar Novo Membro</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Preencha os dados abaixo para enviar um convite para um novo membro da equipe.
          </DialogContentText>
          
          {inviteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {inviteError}
            </Alert>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            name="email"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={inviteFormData.email}
            onChange={handleInviteFormChange}
            required
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <EmailIcon color="action" sx={{ mr: 1 }} />
              )
            }}
          />
          
          <TextField
            margin="dense"
            name="name"
            label="Nome"
            type="text"
            fullWidth
            variant="outlined"
            value={inviteFormData.name}
            onChange={handleInviteFormChange}
            required
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <PersonIcon color="action" sx={{ mr: 1 }} />
              )
            }}
          />
          
          <FormControl fullWidth margin="dense">
            <InputLabel id="invite-role-label">Papel</InputLabel>
            <Select
              labelId="invite-role-label"
              name="role"
              value={inviteFormData.role}
              onChange={handleInviteFormChange}
              label="Papel"
              required
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInviteDialog} disabled={inviteLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleInviteSubmit} 
            variant="contained" 
            disabled={inviteLoading}
            startIcon={inviteLoading ? <CircularProgress size={20} /> : null}
          >
            {inviteLoading ? 'Enviando...' : 'Enviar Convite'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Modal de Edição */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog}>
        <DialogTitle>Editar Permissões</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Altere o papel do membro para modificar suas permissões.
          </DialogContentText>
          
          {editError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {editError}
            </Alert>
          )}
          
          <FormControl fullWidth margin="dense">
            <InputLabel id="edit-role-label">Papel</InputLabel>
            <Select
              labelId="edit-role-label"
              name="role"
              value={editFormData.role}
              onChange={handleEditFormChange}
              label="Papel"
              required
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={editLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleEditSubmit} 
            variant="contained" 
            disabled={editLoading}
            startIcon={editLoading ? <CircularProgress size={20} /> : null}
          >
            {editLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Modal de Confirmação de Remoção */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Remover Membro</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja remover {deleteMemberName} da equipe? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deleteLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteMember} 
            color="error" 
            variant="contained" 
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : null}
          >
            {deleteLoading ? 'Removendo...' : 'Remover'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TeamMembers;
