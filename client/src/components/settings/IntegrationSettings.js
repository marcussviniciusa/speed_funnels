import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Grid,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Facebook as FacebookIcon,
  Google as GoogleIcon,
  Instagram as InstagramIcon,
  Analytics as AnalyticsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

/**
 * Componente para configurações de integrações
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.integrations - Dados das integrações
 * @param {Function} props.onSave - Função chamada ao salvar as configurações
 * @param {Function} props.onDelete - Função chamada ao excluir uma integração
 * @param {boolean} props.loading - Indica se o componente está carregando
 */
const IntegrationSettings = ({ 
  integrations = {}, 
  onSave, 
  onDelete,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    facebook: {
      enabled: false,
      appId: '',
      appSecret: '',
      accessToken: '',
      ...integrations.facebook
    },
    google: {
      enabled: false,
      clientId: '',
      clientSecret: '',
      refreshToken: '',
      ...integrations.google
    },
    instagram: {
      enabled: false,
      appId: '',
      appSecret: '',
      accessToken: '',
      ...integrations.instagram
    },
    analytics: {
      enabled: false,
      viewId: '',
      serviceAccountKey: '',
      ...integrations.analytics
    }
  });

  const [showSecrets, setShowSecrets] = useState({
    facebook: false,
    google: false,
    instagram: false,
    analytics: false
  });

  // Manipula a alteração dos campos do formulário
  const handleChange = (integration, field, value) => {
    setFormData(prev => ({
      ...prev,
      [integration]: {
        ...prev[integration],
        [field]: value
      }
    }));
  };

  // Alterna a visibilidade dos campos secretos
  const handleToggleSecretVisibility = (integration) => {
    setShowSecrets(prev => ({
      ...prev,
      [integration]: !prev[integration]
    }));
  };

  // Manipula o envio do formulário
  const handleSubmit = (integration) => {
    onSave(integration, formData[integration]);
  };

  // Manipula a exclusão de uma integração
  const handleDelete = (integration) => {
    onDelete(integration);
  };

  // Renderiza o formulário de integração do Facebook
  const renderFacebookForm = () => (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="facebook-integration-content"
        id="facebook-integration-header"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <FacebookIcon color="primary" sx={{ mr: 2 }} />
          <Typography variant="subtitle1">Facebook Ads</Typography>
          <Box sx={{ ml: 'auto' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.facebook.enabled}
                  onChange={(e) => handleChange('facebook', 'enabled', e.target.checked)}
                  disabled={loading}
                  onClick={(e) => e.stopPropagation()}
                />
              }
              label=""
            />
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="App ID"
              value={formData.facebook.appId}
              onChange={(e) => handleChange('facebook', 'appId', e.target.value)}
              disabled={loading || !formData.facebook.enabled}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="App Secret"
              type={showSecrets.facebook ? 'text' : 'password'}
              value={formData.facebook.appSecret}
              onChange={(e) => handleChange('facebook', 'appSecret', e.target.value)}
              disabled={loading || !formData.facebook.enabled}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => handleToggleSecretVisibility('facebook')}
                      edge="end"
                      disabled={loading || !formData.facebook.enabled}
                    >
                      {showSecrets.facebook ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Access Token"
              type={showSecrets.facebook ? 'text' : 'password'}
              value={formData.facebook.accessToken}
              onChange={(e) => handleChange('facebook', 'accessToken', e.target.value)}
              disabled={loading || !formData.facebook.enabled}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => handleToggleSecretVisibility('facebook')}
                      edge="end"
                      disabled={loading || !formData.facebook.enabled}
                    >
                      {showSecrets.facebook ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => handleDelete('facebook')}
              disabled={loading || !formData.facebook.enabled}
            >
              Remover
            </Button>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={() => handleSubmit('facebook')}
              disabled={loading || !formData.facebook.enabled}
            >
              Salvar
            </Button>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );

  // Renderiza o formulário de integração do Google
  const renderGoogleForm = () => (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="google-integration-content"
        id="google-integration-header"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <GoogleIcon color="error" sx={{ mr: 2 }} />
          <Typography variant="subtitle1">Google Ads</Typography>
          <Box sx={{ ml: 'auto' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.google.enabled}
                  onChange={(e) => handleChange('google', 'enabled', e.target.checked)}
                  disabled={loading}
                  onClick={(e) => e.stopPropagation()}
                />
              }
              label=""
            />
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Client ID"
              value={formData.google.clientId}
              onChange={(e) => handleChange('google', 'clientId', e.target.value)}
              disabled={loading || !formData.google.enabled}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Client Secret"
              type={showSecrets.google ? 'text' : 'password'}
              value={formData.google.clientSecret}
              onChange={(e) => handleChange('google', 'clientSecret', e.target.value)}
              disabled={loading || !formData.google.enabled}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => handleToggleSecretVisibility('google')}
                      edge="end"
                      disabled={loading || !formData.google.enabled}
                    >
                      {showSecrets.google ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Refresh Token"
              type={showSecrets.google ? 'text' : 'password'}
              value={formData.google.refreshToken}
              onChange={(e) => handleChange('google', 'refreshToken', e.target.value)}
              disabled={loading || !formData.google.enabled}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => handleToggleSecretVisibility('google')}
                      edge="end"
                      disabled={loading || !formData.google.enabled}
                    >
                      {showSecrets.google ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => handleDelete('google')}
              disabled={loading || !formData.google.enabled}
            >
              Remover
            </Button>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={() => handleSubmit('google')}
              disabled={loading || !formData.google.enabled}
            >
              Salvar
            </Button>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );

  // Renderiza o formulário de integração do Instagram
  const renderInstagramForm = () => (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="instagram-integration-content"
        id="instagram-integration-header"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <InstagramIcon color="secondary" sx={{ mr: 2 }} />
          <Typography variant="subtitle1">Instagram Ads</Typography>
          <Box sx={{ ml: 'auto' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.instagram.enabled}
                  onChange={(e) => handleChange('instagram', 'enabled', e.target.checked)}
                  disabled={loading}
                  onClick={(e) => e.stopPropagation()}
                />
              }
              label=""
            />
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="App ID"
              value={formData.instagram.appId}
              onChange={(e) => handleChange('instagram', 'appId', e.target.value)}
              disabled={loading || !formData.instagram.enabled}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="App Secret"
              type={showSecrets.instagram ? 'text' : 'password'}
              value={formData.instagram.appSecret}
              onChange={(e) => handleChange('instagram', 'appSecret', e.target.value)}
              disabled={loading || !formData.instagram.enabled}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => handleToggleSecretVisibility('instagram')}
                      edge="end"
                      disabled={loading || !formData.instagram.enabled}
                    >
                      {showSecrets.instagram ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Access Token"
              type={showSecrets.instagram ? 'text' : 'password'}
              value={formData.instagram.accessToken}
              onChange={(e) => handleChange('instagram', 'accessToken', e.target.value)}
              disabled={loading || !formData.instagram.enabled}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => handleToggleSecretVisibility('instagram')}
                      edge="end"
                      disabled={loading || !formData.instagram.enabled}
                    >
                      {showSecrets.instagram ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => handleDelete('instagram')}
              disabled={loading || !formData.instagram.enabled}
            >
              Remover
            </Button>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={() => handleSubmit('instagram')}
              disabled={loading || !formData.instagram.enabled}
            >
              Salvar
            </Button>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );

  // Renderiza o formulário de integração do Google Analytics
  const renderAnalyticsForm = () => (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="analytics-integration-content"
        id="analytics-integration-header"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <AnalyticsIcon color="success" sx={{ mr: 2 }} />
          <Typography variant="subtitle1">Google Analytics</Typography>
          <Box sx={{ ml: 'auto' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.analytics.enabled}
                  onChange={(e) => handleChange('analytics', 'enabled', e.target.checked)}
                  disabled={loading}
                  onClick={(e) => e.stopPropagation()}
                />
              }
              label=""
            />
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="View ID"
              value={formData.analytics.viewId}
              onChange={(e) => handleChange('analytics', 'viewId', e.target.value)}
              disabled={loading || !formData.analytics.enabled}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Service Account Key (JSON)"
              multiline
              rows={4}
              value={formData.analytics.serviceAccountKey}
              onChange={(e) => handleChange('analytics', 'serviceAccountKey', e.target.value)}
              disabled={loading || !formData.analytics.enabled}
            />
          </Grid>
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => handleDelete('analytics')}
              disabled={loading || !formData.analytics.enabled}
            >
              Remover
            </Button>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={() => handleSubmit('analytics')}
              disabled={loading || !formData.analytics.enabled}
            >
              Salvar
            </Button>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );

  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Integrações
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {renderFacebookForm()}
        {renderGoogleForm()}
        {renderInstagramForm()}
        {renderAnalyticsForm()}
      </Box>
    </Paper>
  );
};

export default IntegrationSettings;
