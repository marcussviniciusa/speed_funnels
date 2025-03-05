import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Divider, 
  Chip, 
  IconButton, 
  Menu, 
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  Schedule as ScheduleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FileCopy as CopyIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../../services/authService';
import Layout from '../../components/Layout';

const ReportsLibrary = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Estado para diálogos
  const [openShareDialog, setOpenShareDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [expirationDays, setExpirationDays] = useState(30);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [publicLink, setPublicLink] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Carregar relatórios na montagem do componente
  useEffect(() => {
    fetchReports();
  }, []);
  
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/reports/list');
      setReports(response.data.reports || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar relatórios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Funções de menu
  const handleMenuOpen = (event, report) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedReport(report);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedReport(null);
  };
  
  // Funções de compartilhamento
  const handleShareOpen = () => {
    setOpenShareDialog(true);
    handleMenuClose();
  };
  
  const handleShareClose = () => {
    setOpenShareDialog(false);
    setPublicLink('');
    setExpirationDays(30);
  };
  
  const handleCreatePublicLink = async () => {
    try {
      setShareLoading(true);
      
      const response = await api.post(`/reports/${selectedReport.id}/share`, {
        expirationDays
      });
      
      setPublicLink(response.data.publicLink.url);
      setShareSuccess(true);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Erro ao criar link de compartilhamento',
        severity: 'error'
      });
    } finally {
      setShareLoading(false);
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicLink).then(
      () => {
        setSnackbar({
          open: true,
          message: 'Link copiado para a área de transferência!',
          severity: 'success'
        });
      },
      () => {
        setSnackbar({
          open: true,
          message: 'Erro ao copiar link',
          severity: 'error'
        });
      }
    );
  };
  
  // Funções de exclusão
  const handleDeleteOpen = () => {
    setOpenDeleteDialog(true);
    handleMenuClose();
  };
  
  const handleDeleteClose = () => {
    setOpenDeleteDialog(false);
  };
  
  const handleDeleteReport = async () => {
    try {
      await api.delete(`/reports/${selectedReport.id}`);
      
      setSnackbar({
        open: true,
        message: 'Relatório excluído com sucesso',
        severity: 'success'
      });
      
      fetchReports(); // Recarregar a lista
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Erro ao excluir relatório',
        severity: 'error'
      });
    } finally {
      handleDeleteClose();
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  const getPlatformLabel = (platform) => {
    return platform === 'meta' ? 'Meta Ads' : 'Google Analytics';
  };
  
  const getDateFormatted = (dateString) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };
  
  return (
    <Layout>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Biblioteca de Relatórios
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/company/reports/create')}
        >
          Novo Relatório
        </Button>
      </Box>
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : reports.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Você ainda não criou nenhum relatório
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Clique no botão "Novo Relatório" para começar a criar seus relatórios personalizados.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/company/reports/create')}
            sx={{ mt: 2 }}
          >
            Criar Meu Primeiro Relatório
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {reports.map((report) => (
            <Grid item xs={12} sm={6} md={4} key={report.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6" gutterBottom>
                      {report.name}
                    </Typography>
                    
                    <IconButton onClick={(e) => handleMenuOpen(e, report)}>
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  
                  {report.description && (
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {report.description}
                    </Typography>
                  )}
                  
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Plataformas:</strong> {report.platforms.map(getPlatformLabel).join(', ')}
                  </Typography>
                  
                  <Typography variant="body2" color="textSecondary">
                    <strong>Criado em:</strong> {getDateFormatted(report.createdAt)}
                  </Typography>
                  
                  {report.publicLinks && report.publicLinks.length > 0 && (
                    <Box mt={2}>
                      <Chip 
                        icon={<ShareIcon />} 
                        label="Link de compartilhamento ativo" 
                        color="primary" 
                        size="small" 
                      />
                    </Box>
                  )}
                </CardContent>
                
                <Divider />
                
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<ScheduleIcon />}
                    onClick={() => navigate(`/company/reports/${report.id}`)}
                  >
                    Visualizar
                  </Button>
                  
                  <Button 
                    size="small" 
                    startIcon={<ShareIcon />}
                    onClick={() => {
                      setSelectedReport(report);
                      setOpenShareDialog(true);
                    }}
                  >
                    Compartilhar
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Menu de opções */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => navigate(`/company/reports/${selectedReport?.id}`)}>
          <ScheduleIcon fontSize="small" sx={{ mr: 1 }} /> Visualizar
        </MenuItem>
        <MenuItem onClick={handleShareOpen}>
          <ShareIcon fontSize="small" sx={{ mr: 1 }} /> Compartilhar
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          navigate(`/company/reports/edit/${selectedReport?.id}`);
        }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Editar
        </MenuItem>
        <MenuItem onClick={handleDeleteOpen}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Excluir
        </MenuItem>
      </Menu>
      
      {/* Diálogo de compartilhamento */}
      <Dialog open={openShareDialog} onClose={handleShareClose} maxWidth="sm" fullWidth>
        <DialogTitle>Compartilhar Relatório</DialogTitle>
        <DialogContent>
          {shareSuccess ? (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Link de compartilhamento criado com sucesso!
              </Alert>
              
              <TextField
                fullWidth
                value={publicLink}
                variant="outlined"
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <IconButton onClick={copyToClipboard}>
                      <ContentCopyIcon />
                    </IconButton>
                  )
                }}
              />
              
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                Este link permite que qualquer pessoa visualize este relatório sem necessidade de login.
                {expirationDays > 0 && ` Expira em ${expirationDays} dias.`}
              </Typography>
            </Box>
          ) : (
            <>
              <DialogContentText>
                Crie um link de compartilhamento público para este relatório. Qualquer pessoa com o link poderá visualizá-lo sem necessidade de login.
              </DialogContentText>
              
              <TextField
                select
                fullWidth
                label="Expiração do Link"
                value={expirationDays}
                onChange={(e) => setExpirationDays(e.target.value)}
                margin="normal"
              >
                <MenuItem value={7}>7 dias</MenuItem>
                <MenuItem value={30}>30 dias</MenuItem>
                <MenuItem value={90}>90 dias</MenuItem>
                <MenuItem value={365}>1 ano</MenuItem>
                <MenuItem value={0}>Sem expiração</MenuItem>
              </TextField>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleShareClose}>
            {shareSuccess ? 'Fechar' : 'Cancelar'}
          </Button>
          
          {!shareSuccess && (
            <Button 
              onClick={handleCreatePublicLink} 
              variant="contained" 
              color="primary"
              disabled={shareLoading}
              startIcon={shareLoading ? <CircularProgress size={20} /> : <ShareIcon />}
            >
              {shareLoading ? 'Gerando...' : 'Gerar Link'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Diálogo de exclusão */}
      <Dialog open={openDeleteDialog} onClose={handleDeleteClose}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o relatório "{selectedReport?.name}"? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Cancelar</Button>
          <Button onClick={handleDeleteReport} color="error" startIcon={<DeleteIcon />}>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar para mensagens de feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
};

export default ReportsLibrary; 