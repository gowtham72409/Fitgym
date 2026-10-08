import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Zap, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';

export default function AuthModal({ onClose }) {
  const { signupWithEmail, loginWithEmail, loginWithGoogle, loginAsDemo, authError } = useAuth();
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password, name);
      }
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    try {
      await loginAsDemo();
      if (onClose) onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="bottom-sheet" style={{ maxHeight: '90vh' }}>
        <div className="sheet-handle" />

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'var(--gradient-brand)',
            color: '#0A0D14',
            marginBottom: '12px',
            boxShadow: 'var(--shadow-glow-cyan)'
          }}>
            <Zap size={28} />
          </div>
          <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {isLogin ? 'Sign in to access your isolated fitness journey' : 'Start your AI-powered personalized fitness journey'}
          </p>
        </div>

        {/* Tab switch */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            style={{
              flex: 1,
              background: !isLogin ? 'var(--bg-card-hover)' : 'transparent',
              color: !isLogin ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '8px',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            style={{
              flex: 1,
              background: isLogin ? 'var(--bg-card-hover)' : 'transparent',
              color: isLogin ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '8px',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            Sign In
          </button>
        </div>

        {(error || authError) && (
          <div style={{
            background: 'rgba(255, 94, 94, 0.15)',
            border: '1px solid rgba(255, 94, 94, 0.3)',
            color: 'var(--accent-coral)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            {error || authError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="e.g. Jordan Lee"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  style={{ paddingLeft: '40px' }}
                />
                <User size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                placeholder="athlete@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '40px' }}
              />
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ paddingLeft: '40px' }}
              />
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '6px' }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Free Account')}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '20px 0',
          color: 'var(--text-muted)',
          fontSize: '12px'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            onClick={handleGoogle}
            className="btn btn-secondary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={handleDemo}
            className="btn btn-outline"
            disabled={loading}
            style={{ width: '100%', borderColor: 'var(--accent-emerald)', color: 'var(--accent-emerald)' }}
          >
            <Sparkles size={18} />
            Quick Test Account (Instant Access)
          </button>
        </div>
      </div>
    </div>
  );
}
