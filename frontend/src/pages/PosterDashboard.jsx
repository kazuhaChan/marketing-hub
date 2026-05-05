import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Link as LinkIcon, Share, MessageSquare } from 'lucide-react';

const PosterDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('posts');
  const [invitationCode, setInvitationCode] = useState('');
  const [posts, setPosts] = useState([]);
  const [linkedAccounts, setLinkedAccounts] = useState([]);

  // Mock social link state
  const [platform, setPlatform] = useState('Facebook');
  const [accountId, setAccountId] = useState('');
  const [accountName, setAccountName] = useState('');

  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const headers = { 'x-auth-token': token };
      const [postRes, accRes] = await Promise.all([
        axios.get('http://localhost:3000/api/posts', { headers }),
        axios.get('http://localhost:3000/api/social/accounts', { headers })
      ]);
      setPosts(postRes.data);
      setLinkedAccounts(accRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/groups/join', { invitationCode }, {
        headers: { 'x-auth-token': token }
      });
      alert('Successfully joined group!');
      setInvitationCode('');
      fetchData(); // Refresh posts that might be available now
    } catch (err) {
      alert(err.response?.data?.msg || 'Error joining group');
    }
  };

  const handleLinkAccount = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/social/link', {
        platform,
        accountId,
        accountName,
        accessToken: 'mock_token_' + Date.now()
      }, {
        headers: { 'x-auth-token': token }
      });
      alert('Account linked successfully (Mock)');
      setAccountId(''); setAccountName('');
      fetchData();
    } catch (err) {
      alert('Error linking account');
    }
  };

  const handlePostToPlatform = async (postId, targetPlatform) => {
    try {
      const res = await axios.post(`http://localhost:3000/api/social/post/${postId}`, { platform: targetPlatform }, {
        headers: { 'x-auth-token': token }
      });
      alert(`Success: ${res.data.msg}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.msg || 'Error posting to platform');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Poster Dashboard</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={`btn ${activeTab === 'posts' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('posts')}><MessageSquare size={16}/> Feed</button>
          <button className={`btn ${activeTab === 'groups' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('groups')}><UserPlus size={16}/> Join Group</button>
          <button className={`btn ${activeTab === 'social' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('social')}><LinkIcon size={16}/> Accounts</button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Action Area
          </h2>

          {activeTab === 'groups' && (
            <form onSubmit={handleJoinGroup}>
              <div className="form-group">
                <label>Invitation Code</label>
                <input type="text" className="input" required value={invitationCode} onChange={e => setInvitationCode(e.target.value)} placeholder="e.g. A1B2C3D4" />
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Ask your Sender for an invitation code to join their group and access their content.
              </p>
              <button type="submit" className="btn btn-primary">Join Group</button>
            </form>
          )}

          {activeTab === 'social' && (
            <form onSubmit={handleLinkAccount}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Link your social media accounts to enable automated or one-click posting.
              </p>
              <div className="form-group">
                <label>Platform</label>
                <select className="input" value={platform} onChange={e => setPlatform(e.target.value)}>
                  <option value="Facebook">Facebook</option>
                  <option value="Zalo">Zalo</option>
                  <option value="TikTok">TikTok</option>
                </select>
              </div>
              <div className="form-group">
                <label>Account ID / Phone</label>
                <input type="text" className="input" required value={accountId} onChange={e => setAccountId(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Account Name (Display)</label>
                <input type="text" className="input" required value={accountName} onChange={e => setAccountName(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary">Link Account (OAuth Mock)</button>
            </form>
          )}

          {activeTab === 'posts' && (
             <p style={{ color: 'var(--text-muted)' }}>
               Select a post from your feed on the right to share it to your linked platforms.
             </p>
          )}
        </div>

        <div className="card" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Your {activeTab === 'social' ? 'Linked Accounts' : 'Content Feed'}</h2>
          
          {activeTab === 'social' && linkedAccounts.map(acc => (
             <div key={acc._id} className="list-item">
              <div>
                <p style={{ fontWeight: 600 }}>{acc.accountName} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({acc.platform})</span></p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {acc.accountId}</p>
              </div>
              <span className="badge badge-success">Linked</span>
            </div>
          ))}

          {(activeTab === 'posts' || activeTab === 'groups') && posts.map(p => (
            <div key={p._id} className="card" style={{ marginBottom: '1rem', background: 'rgba(15, 23, 42, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{p.product?.name}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>From: {p.sender?.username}</span>
              </div>
              <p style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>{p.content}</p>
              
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Target Platforms: {p.platforms.join(', ')}</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {p.platforms.map(plat => (
                    <button key={plat} onClick={() => handlePostToPlatform(p._id, plat)} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                      <Share size={14} /> Post to {plat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {(activeTab === 'posts' || activeTab === 'groups') && posts.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
              No posts available. Join a group to see content.
            </p>
          )}

        </div>
      </div>
    </div>
  );
};

export default PosterDashboard;
