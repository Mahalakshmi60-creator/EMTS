import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Vault from './pages/Vault';
import Certificates from './pages/Certificates';
import Scanner from './pages/Scanner';
import AuditLogs from './pages/AuditLogs';
import Login from './pages/Login';

// Protect routes from unauthenticated session hijacking
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Sign In / Register Endpoint */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Enterprise Route Namespace */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="vault" element={<Vault />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="scanner" element={<Scanner />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>
          
          {/* Global Fallback Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
