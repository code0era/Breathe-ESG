import React, { useState, useEffect } from 'react';
import { audit } from '../api';
import { ClipboardList, ShieldAlert, ArrowRight, User } from 'lucide-react';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await audit.getLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load compliance audit trail logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
          Compliance Audit Trail
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Immutable logs tracking every data ingestion, manual edit, analyst rejection, and auditor sign-off
        </p>
      </div>

      {/* Main logs display list */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <div className="spinner"></div>
        </div>
      ) : errorMsg ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
          <ShieldAlert size={48} color="var(--status-rejected)" style={{ marginBottom: '16px' }} />
          <h3>Trail Error</h3>
          <p style={{ color: 'var(--text-muted)' }}>{errorMsg}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <ClipboardList size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <h3>No audit logs logged</h3>
          <p style={{ color: 'var(--text-muted)' }}>Seeding or parsing activity data will populate compliance trails.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {logs.map((log) => (
            <div key={log.id} className="glass-panel glass-panel-interactive" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                
                {/* Left Side Info */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  {/* Action tag */}
                  <span className={`badge badge-${
                    log.action === 'APPROVE' ? 'approved' : 
                    log.action === 'REJECT' ? 'rejected' : 
                    log.action === 'FLAG' ? 'suspicious' : 
                    'pending'
                  }`} style={{ fontSize: '0.7rem', padding: '6px 12px', minWidth: '90px', justifyContent: 'center' }}>
                    {log.action}
                  </span>
                  
                  <div>
                    {/* Log text details */}
                    <p style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '4px' }}>
                      {log.comments || 'No comment provided.'}
                    </p>
                    
                    {log.record_category && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        Target Record: <strong style={{ color: '#fff' }}>{log.record_category}</strong> ({log.record_scope})
                      </p>
                    )}

                    {/* Diff/Override table if manual edit */}
                    {log.action === 'UPDATE' && log.old_value && log.new_value && (
                      <div style={{ marginTop: '12px', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '12px', background: 'rgba(0,0,0,0.2)', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ color: 'var(--status-rejected)', fontWeight: 600 }}>BEFORE:</span>
                          <span style={{ color: 'var(--text-muted)' }}>{log.old_value}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ color: 'var(--status-approved)', fontWeight: 600 }}>AFTER:</span>
                          <span style={{ color: 'var(--text-main)' }}>{log.new_value}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side Info (User profile + Date) */}
                <div style={{ textAlign: 'right', minWidth: '180px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginBottom: '6px' }}>
                    <User size={14} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {log.user?.first_name} {log.user?.last_name}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {log.user?.email} ({log.user?.role})
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLog;
