import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import FacebookSDK from './components/integration/FacebookSDK';

// Layouts
import AuthLayout from './components/layouts/AuthLayout';
import MainLayout from './components/layouts/MainLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Billing from './pages/Billing';
import Integrations from './pages/Integrations';

// Superadmin Pages
import SuperadminDashboard from './pages/superadmin/Dashboard';
import SuperadminCompanies from './pages/superadmin/Companies';
import SuperadminUsers from './pages/superadmin/Users';
import SuperadminSettings from './pages/superadmin/Settings';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

const SuperadminRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== 'superadmin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  // Obtendo APP_ID do ambiente
  const META_APP_ID = process.env.REACT_APP_META_APP_ID || '4190441111244279';
  
  // Função executada quando o SDK do Facebook estiver carregado
  const handleFacebookSDKLoaded = (FB) => {
    console.log('Facebook SDK carregado com sucesso');
    // Você pode fazer verificações ou configurações adicionais aqui
  };

  return (
    <Router>
      {/* Carrega o SDK do Facebook */}
      <FacebookSDK 
        appId={META_APP_ID}
        onSDKLoaded={handleFacebookSDKLoaded}
      />
      
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Protected Routes */}
        <Route element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/integrations" element={<Integrations />} />
          {/* Rota de faturamento temporariamente desativada
          <Route path="/billing" element={<Billing />} />
          */}
        </Route>

        {/* Superadmin Routes */}
        <Route element={
          <SuperadminRoute>
            <div style={{ display: 'flex' }}>
              {/* O SuperadminSidebar já está incluído dentro de cada componente de página */}
              <div style={{ flexGrow: 1 }}></div>
            </div>
          </SuperadminRoute>
        }>
          <Route path="/superadmin/dashboard" element={<SuperadminDashboard />} />
          <Route path="/superadmin/companies" element={<SuperadminCompanies />} />
          <Route path="/superadmin/users" element={<SuperadminUsers />} />
          <Route path="/superadmin/settings" element={<SuperadminSettings />} />
        </Route>

        {/* Redirect to dashboard or login based on auth status */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
