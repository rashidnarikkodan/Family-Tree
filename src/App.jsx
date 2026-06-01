import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FamilyGraphView from './pages/FamilyGraphView';
import Explore from './pages/Explore';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-white p-8">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  return children;
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster 
          position="top-right" 
          theme="dark" 
          richColors 
          closeButton 
          toastOptions={{
            style: {
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              borderRadius: '16px',
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/explore" element={<Explore />} />
          <Route path="/family/:familyId" element={<FamilyGraphView />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
