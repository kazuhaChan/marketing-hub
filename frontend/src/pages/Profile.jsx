import { useState } from 'react';
import axios from 'axios';
import { User, Lock, Save } from 'lucide-react';
import { API_URL } from '../config';

const Profile = ({ user }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const token = localStorage.getItem('token');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      return setMessage({ type: 'error', text: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
    }

    setLoading(true);
    try {
      const res = await axios.put(
        `${API_URL}/api/auth/change-password`,
        { currentPassword, newPassword },
        { headers: { 'x-auth-token': token } }
      );
      setMessage({ type: 'success', text: res.data.msg });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.msg || 'Error changing password' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <h1 className="page-title">Your Profile</h1>

      <div className="dashboard-grid">
        {/* User Info Card */}
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} /> Account Information
          </h2>
          <div className="form-group">
            <label>Username</label>
            <input type="text" className="input" value={user?.username} disabled />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="text" className="input" value={user?.email} disabled />
          </div>
          <div className="form-group">
            <label>Role</label>
            <div style={{ marginTop: '0.5rem' }}>
              <span className="badge badge-success">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={20} /> Change Password
          </h2>

          {message.text && (
            <div style={{ 
              padding: '1rem', 
              borderRadius: 'var(--radius)', 
              marginBottom: '1rem',
              backgroundColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              color: message.type === 'error' ? 'var(--error)' : 'var(--success)',
              border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>Current Password</label>
              <input 
                type="password" 
                className="input" 
                required 
                value={currentPassword} 
                onChange={e => setCurrentPassword(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input 
                type="password" 
                className="input" 
                required 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input 
                type="password" 
                className="input" 
                required 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
              />
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Updating...' : <><Save size={18} /> Update Password</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
