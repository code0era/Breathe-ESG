import React, { useState } from 'react';
import { auth } from '../api';
import { KeyRound, Mail, AlertTriangle, Eye, EyeOff } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await auth.login(email, password);
      onLoginSuccess(user);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Invalid email or password combination.');
    } finally {
      setLoading(false);
    }
  };

  const autofillUser = (selectedEmail) => {
    setEmail(selectedEmail);
    setPassword('Test1234');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '40px' }}>
        {/* Logo Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', width: '48px', height: '48px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '16px', fontFamily: 'var(--font-display)' }}>
            B
          </div>
          <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
            Welcome to Breathe ESG
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Enterprise Carbon Accounting & Review Hub
          </p>
        </div>

        {/* Display Error Banner */}
        {error && (
          <div className="badge badge-rejected" style={{ width: '100%', padding: '12px', borderRadius: '8px', marginBottom: '24px', textTransform: 'none', justifyContent: 'flex-start', gap: '8px' }}>
            <AlertTriangle size={16} />
            <span style={{ fontSize: '0.85rem' }}>{error}</span>
          </div>
        )}

        {/* Stateful Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '14px' }} />
              <input
                id="email"
                type="email"
                required
                placeholder="analyst@breatheesg.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '48px' }}
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '32px' }}>
            <label className="input-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '14px' }} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '48px', paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '16px', top: '14px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={18} color="var(--text-muted)" /> : <Eye size={18} color="var(--text-muted)" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Seeding Accounts helper */}
        <div style={{ marginTop: '36px', borderTop: '1px solid var(--glass-border)', paddingTop: '24px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', textAlign: 'center', fontWeight: 500 }}>
            QUICK SEED DEMO ACCOUNTS
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              onClick={() => autofillUser('analyst@breatheesg.com')}
              className="btn btn-secondary btn-sm"
              style={{ padding: '8px', fontSize: '0.75rem', justifyContent: 'center' }}
            >
              Jane (Analyst)
            </button>
            <button
              onClick={() => autofillUser('auditor@breatheesg.com')}
              className="btn btn-secondary btn-sm"
              style={{ padding: '8px', fontSize: '0.75rem', justifyContent: 'center' }}
            >
              John (Auditor)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
