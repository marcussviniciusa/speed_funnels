import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

// Componentes de Autenticação
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas de SuperAdmin
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import CompanyManagement from './pages/superadmin/CompanyManagement';
import UserManagement from './pages/superadmin/UserManagement';

// Páginas de Empresa
import CompanyDashboard from './pages/company/Dashboard';
import IntegrationSetup from './pages/company/IntegrationSetup';
import ReportBuilder from './pages/company/ReportBuilder';
import ReportsLibrary from './pages/company/ReportsLibrary';
import ReportView from './pages/company/ReportView';
import ScheduleReport from './pages/company/ScheduleReport';

// Páginas de Configurações
import FacebookIntegration from './pages/settings/FacebookIntegration';

// Páginas Públicas
import PublicReport from './pages/public/PublicReport';
import Unauthorized from './pages/Unauthorized';

// Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Rota padrão */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/report/:publicId" element={<PublicReport />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Rotas protegidas de SuperAdmin */}
          <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
            <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/superadmin/companies" element={<CompanyManagement />} />
            <Route path="/superadmin/users" element={<UserManagement />} />
          </Route>
          
          {/* Rotas protegidas de Empresa (admin e usuário regular) */}
          <Route element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'user']} />}>
            <Route path="/company/dashboard" element={<CompanyDashboard />} />
            <Route path="/company/integrations" element={<IntegrationSetup />} />
            <Route path="/company/reports/create" element={<ReportBuilder />} />
            <Route path="/company/reports/library" element={<ReportsLibrary />} />
            <Route path="/company/reports/:reportId" element={<ReportView />} />
            <Route path="/company/reports/:reportId/schedule" element={<ScheduleReport />} />
            
            {/* Rotas de Configurações */}
            <Route path="/settings/integrations/facebook" element={<FacebookIntegration />} />
          </Route>
          
          {/* Fallback para rota não encontrada */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App; 