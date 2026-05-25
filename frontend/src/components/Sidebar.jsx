import React from 'react';
import { BarChart3, UploadCloud, ShieldAlert, ClipboardList, LogOut, User } from 'lucide-react';
import { auth } from '../api';

const Sidebar = ({ currentPage, setCurrentPage }) => {
  const currentUser = auth.getCurrentUser();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'review', label: 'Records Review', icon: ShieldAlert },
    { id: 'ingest', label: 'Ingestion Upload', icon: UploadCloud },
    { id: 'audit', label: 'Audit Log', icon: ClipboardList },
  ];

  return (
    <aside className="dashboard-sidebar glass-panel" style={{ borderRadius: 0, borderTop: 0, borderBottom: 0, borderLeft: 0 }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 8px 32px 8px', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>
          B
        </div>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', fontWeight: 700, background: 'linear-gradient(135deg, #fff 30%, var(--text-muted) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Breathe ESG
          </h2>
          <span style={{ fontSize: '0.7rem', color: var(--primary), fontWeight: 600, letterSpacing: '0.05em' }}>
            ENTERPRISE HUB
          </span>
        </div>
      </div>

      {/* User Session Profile Card */}
      {currentUser && (
        <div className="glass-card" style={{ margin: '24px 8px 16px 8px', background: 'rgba(255, 255, 255, 0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={16} color="var(--text-muted)" />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.first_name} {currentUser.last_name}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.email}
              </p>
            </div>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className={`badge badge-${currentUser.role === 'analyst' ? 'pending' : currentUser.role === 'auditor' ? 'suspicious' : 'approved'}`} style={{ fontSize: '0.65rem' }}>
              {currentUser.role}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 500 }}>
              {currentUser.tenant?.name || 'Default Tenant'}
            </span>
          </div>
        </div>
      )}

      {/* Nav Menu */}
      <nav style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className="btn"
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                background: isActive ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)' : 'transparent',
                border: isActive ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent',
                color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                padding: '12px 16px',
                textAlign: 'left'
              }}
            >
              <Icon size={18} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout Trigger */}
      <div style={{ padding: '16px 8px', borderTop: '1px solid var(--glass-border)' }}>
        <button
          onClick={auth.logout}
          className="btn btn-secondary"
          style={{ width: '100%', gap: '10px' }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
