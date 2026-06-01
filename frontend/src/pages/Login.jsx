import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { Mail, Lock, Key, ArrowLeft, ShieldCheck } from 'lucide-react';

const Login = ({ setUser }) => {
  const navigate = useNavigate();
  
  // Modes: 'login', 'forgot', 'reset'
  const [mode, setMode] = useState('login');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setSuccessMessage(res.data.msg);
      // Wait a moment, then automatically transition to verification/reset mode
      setTimeout(() => {
        setMode('reset');
        setSuccessMessage('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!verificationCode || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/reset-password`, {
        email,
        code: verificationCode,
        newPassword
      });
      setSuccessMessage(res.data.msg);
      // Automatically return to login page after success
      setTimeout(() => {
        setMode('login');
        setSuccessMessage('');
        setPassword('');
        setVerificationCode('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.msg || 'Verification failed. Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ flexDirection: 'column' }}>
      <div className="card auth-card" style={{ padding: '2.5rem' }}>
        
        {/* LOGIN MODE */}
        {mode === 'login' && (
          <div>
            <div className="auth-header">
              <h1>MarketingHub</h1>
              <p style={{ color: 'var(--text-muted)' }}>Welcome back! Please login.</p>
            </div>

            {error && <div style={{ color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '1.25rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    className="input" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. user@domain.com"
                    style={{ paddingLeft: '2.75rem' }}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ marginBottom: 0 }}>Password</label>
                  <button 
                    type="button" 
                    onClick={() => { setMode('forgot'); setError(''); setSuccessMessage(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.85rem', padding: 0, fontWeight: 500 }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    className="input" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ paddingLeft: '2.75rem' }}
                    disabled={loading}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }} disabled={loading}>
                {loading ? 'Logging in...' : 'Login to Account'}
              </button>
            </form>
          </div>
        )}

        {/* FORGOT PASSWORD MODE */}
        {mode === 'forgot' && (
          <div>
            <div className="auth-header">
              <h1>Reset Password</h1>
              <p style={{ color: 'var(--text-muted)' }}>Enter your email to receive a 6-digit verification code.</p>
            </div>

            {error && <div style={{ color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '1.25rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
            {successMessage && <div style={{ color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '1.25rem', fontSize: '0.9rem', textAlign: 'center' }}>{successMessage}</div>}

            <form onSubmit={handleForgotSubmit}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    className="input" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. user@domain.com"
                    style={{ paddingLeft: '2.75rem' }}
                    disabled={loading}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={loading}>
                {loading ? 'Sending Code...' : 'Send Verification Email'}
              </button>

              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => { setMode('login'); setError(''); setSuccessMessage(''); }}
                style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
                disabled={loading}
              >
                <ArrowLeft size={16} /> Back to Login
              </button>
            </form>
          </div>
        )}

        {/* VERIFICATION & RESET MODE */}
        {mode === 'reset' && (
          <div>
            <div className="auth-header">
              <h1>Verify OTP Code</h1>
              <p style={{ color: 'var(--text-muted)' }}>Enter the code sent to your email and set your new password.</p>
            </div>

            {error && <div style={{ color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '1.25rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
            {successMessage && <div style={{ color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '1.25rem', fontSize: '0.9rem', textAlign: 'center' }}>{successMessage}</div>}

            <form onSubmit={handleResetSubmit}>
              <div className="form-group">
                <label>6-Digit Verification Code</label>
                <div style={{ position: 'relative' }}>
                  <Key size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="input" 
                    required 
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    style={{ paddingLeft: '2.75rem', letterSpacing: '0.05em' }}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    className="input" 
                    required 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    style={{ paddingLeft: '2.75rem' }}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <ShieldCheck size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    className="input" 
                    required 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    style={{ paddingLeft: '2.75rem' }}
                    disabled={loading}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={loading}>
                {loading ? 'Resetting Password...' : 'Verify and Reset Password'}
              </button>

              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => { setMode('forgot'); setError(''); setSuccessMessage(''); }}
                style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
                disabled={loading}
              >
                <ArrowLeft size={16} /> Back / Resend Code
              </button>
            </form>
          </div>
        )}

      </div>
      <footer style={{
        marginTop: '2rem',
        display: 'flex',
        gap: '1.5rem',
        fontSize: '0.85rem',
        color: 'var(--text-muted)'
      }}>
        <a href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.25s' }} onMouseEnter={(e) => e.target.style.color = 'var(--primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>Chính sách bảo mật</a>
        <span>•</span>
        <a href="/delete-instructions" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.25s' }} onMouseEnter={(e) => e.target.style.color = 'var(--primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>Hướng dẫn xóa dữ liệu</a>
      </footer>
    </div>
  );
};

export default Login;
