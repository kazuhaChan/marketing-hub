import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Users, Trash2, ShieldAlert, ShoppingCart } from 'lucide-react';
import { API_URL } from '../config';

const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('create');
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Registration Form States
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('Sender');
  
  // Newly Created User password display
  const [createdUser, setCreatedUser] = useState(null);

  const token = localStorage.getItem('token');

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/users`, {
        headers: { 'x-auth-token': token }
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders`, {
        headers: { 'x-auth-token': token }
      });
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching orders', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchOrders();
  }, []);

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    setCreatedUser(null);
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, {
        username: regUsername,
        email: regEmail,
        role: regRole
      }, {
        headers: { 'x-auth-token': token }
      });
      
      setCreatedUser({
        username: res.data.username,
        email: res.data.email,
        password: res.data.password,
        role: res.data.role
      });

      alert(`${regRole} account created successfully!`);
      setRegUsername('');
      setRegEmail('');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.msg || 'Error creating account');
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (id === user.id) {
      alert('You cannot delete your own admin account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user "${name}"?`)) return;
    try {
      await axios.delete(`${API_URL}/api/auth/users/${id}`, {
        headers: { 'x-auth-token': token }
      });
      alert('User deleted successfully.');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.msg || 'Error deleting user');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Admin Panel</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={`btn ${activeTab === 'create' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('create')}><UserPlus size={16}/> Create Account</button>
          <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('users')}><Users size={16}/> Manage Users</button>
          <button className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('orders')}><ShoppingCart size={16}/> View Orders</button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {activeTab === 'orders' ? 'Order Monitoring' : (activeTab === 'create' ? 'Register New User' : 'Admin Controls')}
          </h2>

          {activeTab === 'create' && (
            <form onSubmit={handleRegisterUser}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Create Senders or Posters. A random 8-character password will be auto-generated.
              </p>
              <div className="form-group">
                <label>Username</label>
                <input type="text" className="input" required value={regUsername} onChange={e => setRegUsername(e.target.value)} placeholder="e.g. johndoe" />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" className="input" required value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="e.g. john@domain.com" />
              </div>
              <div className="form-group">
                <label>Account Role</label>
                <select className="input" value={regRole} onChange={e => setRegRole(e.target.value)}>
                  <option value="Sender">Sender (Creates Products & Posts)</option>
                  <option value="Poster">Poster (Connects Social & Publishes)</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                <UserPlus size={18} style={{ marginRight: '0.5rem' }} /> Generate Account
              </button>
            </form>
          )}

          {activeTab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <ShieldAlert size={24} style={{ color: '#ef4444' }} />
                <div>
                  <p style={{ fontWeight: 600, color: '#ef4444', fontSize: '0.9rem' }}>Danger Zone Controls</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Deleting users will remove all their active sessions and cannot be undone.</p>
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Select a user from the right side panel to manage or delete their account.</p>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                As an Administrator, you can view and monitor all user checkouts across the entire system.
              </p>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1.25rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>System Summary</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Total Orders</p>
                    <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>{orders.length}</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Total Qty</p>
                    <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>
                      {orders.reduce((sum, o) => sum + (o.quantity || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          {createdUser && activeTab === 'create' && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#10b981', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Account Created Successfully!</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
                <p><strong>Username:</strong> {createdUser.username}</p>
                <p><strong>Email:</strong> {createdUser.email}</p>
                <p><strong>Role:</strong> <span className="badge badge-success">{createdUser.role}</span></p>
                <p style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px', border: '1px dashed rgba(255,255,255,0.1)', marginTop: '0.5rem', fontSize: '1rem', textAlign: 'center' }}>
                  <strong>Temporary Password:</strong> <code style={{ color: '#f59e0b', fontSize: '1.1rem', letterSpacing: '0.05em' }}>{createdUser.password}</code>
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>⚠️ Make sure to copy this password now! It will not be shown again.</p>
              </div>
            </div>
          )}

          <h2 style={{ marginBottom: '1.5rem' }}>
            {activeTab === 'orders' ? `Recorded Orders (${orders.length})` : `System Accounts (${users.length})`}
          </h2>
          
          <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activeTab === 'orders' ? (
              orders.map(o => (
                <div key={o._id} className="list-item" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '1rem', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{o.productName}</span>
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Qty: {o.quantity}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem', width: '100%' }}>
                    <p><strong>Customer:</strong> {o.customerName} ({o.customerNumber})</p>
                    <p><strong>Placed By:</strong> {o.orderedBy?.username || 'Unknown'} ({o.orderedBy?.email || 'N/A'})</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {new Date(o.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              users.map(u => (
                <div key={u._id} className="list-item" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '0.8rem 1rem' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{u.username}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</p>
                    <div style={{ marginTop: '0.4rem' }}>
                      <span className={`badge ${u.role === 'Admin' ? 'badge-success' : (u.role === 'Poster' ? 'badge-pending' : 'badge-primary')}`} style={{ fontSize: '0.7rem' }}>
                        {u.role}
                      </span>
                    </div>
                  </div>
                  {u._id !== user.id && (
                    <button onClick={() => handleDeleteUser(u._id, u.username)} className="btn btn-secondary" style={{ padding: '0.4rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }} title="Delete Account">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
