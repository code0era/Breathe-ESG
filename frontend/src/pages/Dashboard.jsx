import React, { useState, useEffect } from 'react';
import { records } from '../api';
import { Leaf, CheckCircle2, FileClock, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await records.getStats();
      setStats(data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '16px' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Assembling emissions intelligence...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
        <ShieldAlert size={48} color="var(--status-rejected)" style={{ marginBottom: '16px' }} />
        <h3 style={{ marginBottom: '8px' }}>Dashboard Error</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{error || 'Failed to load statistics.'}</p>
        <button onClick={fetchStats} className="btn btn-primary">Try Again</button>
      </div>
    );
  }

  const { total_co2e, approved_co2e, status_counts, scope_breakdown, category_breakdown, monthly_trend } = stats;

  // Percentage calculations
  const approvedPercent = total_co2e > 0 ? (approved_co2e / total_co2e) * 100 : 0;
  
  // Find maximum monthly value to scale timeline SVG graph
  const maxMonthly = monthly_trend.length > 0 ? Math.max(...monthly_trend.map(t => t.total_co2e)) : 0;

  return (
    <div>
      {/* Header and Sync */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
            Sustainability Overview
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Real-time compliance intelligence & emissions tracking
          </p>
        </div>
        <button onClick={fetchStats} className="btn btn-secondary" style={{ gap: '8px' }}>
          <RefreshCw size={16} />
          <span>Refresh Stats</span>
        </button>
      </div>

      {/* Grid: 4 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {/* Total Carbon */}
        <div className="glass-panel glass-panel-interactive" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>TOTAL INGESTED CARBON</span>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '8px' }}>
              <Leaf size={18} color="var(--primary)" />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              {(total_co2e / 1000).toFixed(2)} t
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {total_co2e.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg CO₂e
            </span>
          </div>
        </div>

        {/* Approved Carbon */}
        <div className="glass-panel glass-panel-interactive" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>AUDIT-READY / APPROVED</span>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '8px' }}>
              <CheckCircle2 size={18} color="var(--primary)" />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              {approvedPercent.toFixed(1)}%
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {(approved_co2e / 1000).toFixed(2)} t approved
            </span>
          </div>
        </div>

        {/* Pending Approval */}
        <div className="glass-panel glass-panel-interactive" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>PENDING ANALYST REVIEW</span>
            <div style={{ background: 'rgba(249, 115, 22, 0.1)', padding: '8px', borderRadius: '8px' }}>
              <FileClock size={18} color="var(--status-pending)" />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              {status_counts.pending}
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Rows awaiting sign-off
            </span>
          </div>
        </div>

        {/* Suspicious Flags */}
        <div className="glass-panel glass-panel-interactive" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>SUSPICIOUS / FLAGGED</span>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '8px', borderRadius: '8px' }}>
              <ShieldAlert size={18} color="var(--status-suspicious)" />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: status_counts.suspicious > 0 ? 'var(--status-suspicious)' : 'inherit' }}>
              {status_counts.suspicious}
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Require attention
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Breakdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginBottom: '40px' }}>
        
        {/* Timeline SVG Chart */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Emissions Timeline</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Monthly historical trends in kilograms of CO₂e</p>
          </div>
          
          {monthly_trend.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', minHeight: '240px' }}>
              No timeline data available.
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '260px', padding: '10px 0' }}>
              {/* Timeline SVG chart bars */}
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '220px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
                {monthly_trend.map((item, idx) => {
                  const heightPercent = maxMonthly > 0 ? (item.total_co2e / maxMonthly) * 190 : 0;
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                      {/* Bar container with hover tooltip effect */}
                      <div 
                        style={{ 
                          width: '60%', 
                          maxWidth: '40px', 
                          height: `${Math.max(heightPercent, 4)}px`, 
                          background: 'linear-gradient(to top, var(--primary) 0%, var(--secondary) 100%)', 
                          borderRadius: '6px 6px 0 0', 
                          boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)',
                          position: 'relative'
                        }}
                        title={`${item.total_co2e.toFixed(0)} kg CO2e`}
                      />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Scope Breakdowns */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Emissions by Scope</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Scope categorization split</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Scope 1 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span className="badge badge-scope1" style={{ fontSize: '0.65rem' }}>Scope 1</span>
                <span>{(scope_breakdown.scope_1 / 1000).toFixed(2)} t CO₂e</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ background: 'var(--scope-1)', width: `${total_co2e > 0 ? (scope_breakdown.scope_1 / total_co2e) * 100 : 0}%`, height: '100%' }}></div>
              </div>
            </div>

            {/* Scope 2 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span className="badge badge-scope2" style={{ fontSize: '0.65rem' }}>Scope 2</span>
                <span>{(scope_breakdown.scope_2 / 1000).toFixed(2)} t CO₂e</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ background: 'var(--scope-2)', width: `${total_co2e > 0 ? (scope_breakdown.scope_2 / total_co2e) * 100 : 0}%`, height: '100%' }}></div>
              </div>
            </div>

            {/* Scope 3 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span className="badge badge-scope3" style={{ fontSize: '0.65rem' }}>Scope 3</span>
                <span>{(scope_breakdown.scope_3 / 1000).toFixed(2)} t CO₂e</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ background: 'var(--scope-3)', width: `${total_co2e > 0 ? (scope_breakdown.scope_3 / total_co2e) * 100 : 0}%`, height: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Ingestion Listing */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Emissions by Activity Category</h3>
        
        {category_breakdown.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
            No activity records mapped to categories.
          </p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Scope Class</th>
                  <th>Emissions (kg CO₂e)</th>
                  <th>Percentage of Total</th>
                </tr>
              </thead>
              <tbody>
                {category_breakdown.map((item, index) => {
                  const pct = total_co2e > 0 ? (item.total_co2e / total_co2e) * 100 : 0;
                  return (
                    <tr key={index}>
                      <td style={{ fontWeight: 600 }}>{item.category}</td>
                      <td>
                        <span className={`badge badge-scope${item.scope.replace('Scope ', '')}`} style={{ fontSize: '0.65rem' }}>
                          {item.scope}
                        </span>
                      </td>
                      <td>{item.total_co2e.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '40px' }}>{pct.toFixed(1)}%</span>
                          <div style={{ background: 'rgba(255,255,255,0.05)', width: '80px', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ 
                              background: item.scope === 'Scope 1' ? 'var(--scope-1)' : item.scope === 'Scope 2' ? 'var(--scope-2)' : 'var(--scope-3)', 
                              width: `${pct}%`, 
                              height: '100%' 
                            }}></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
