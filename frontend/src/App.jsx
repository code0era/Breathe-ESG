import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Review from './pages/Review';
import Ingest from './pages/Ingest';
import AuditLog from './pages/AuditLog';
import Sidebar from './components/Sidebar';
import { auth } from './api';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Check if session exists
    const user = auth.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    setInitialLoading(false);
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  if (initialLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // If not signed in, show visual glass Login screen
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Active workspace page routing
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'review':
        return <Review />;
      case 'ingest':
        return <Ingest />;
      case 'audit':
        return <AuditLog />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Fixed Left Sidebar */}
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      
      {/* Main Right Scrollable Panel */}
      <main className="dashboard-content">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
