import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, Link as LinkIcon, Share, MessageSquare } from 'lucide-react';
import { API_URL } from '../config';

const PosterDashboard = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('posts');
  const [invitationCode, setInvitationCode] = useState('');
  const [posts, setPosts] = useState([]);
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [joinedGroups, setJoinedGroups] = useState([]);

  // Mock social link state
  const [platform, setPlatform] = useState('Facebook');
  const [accountId, setAccountId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState({}); // { postId_platform: accountId }

  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const headers = { 'x-auth-token': token };
      const [postRes, accRes, groupRes] = await Promise.all([
        axios.get(`${API_URL}/api/posts`, { headers }),
        axios.get(`${API_URL}/api/social/accounts`, { headers }),
        axios.get(`${API_URL}/api/groups/my-groups`, { headers }) // I'll add this endpoint
      ]);
      setPosts(postRes.data);
      setLinkedAccounts(accRes.data);
      setJoinedGroups(groupRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();

    // Check for Facebook OAuth callback
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (code && state === 'facebook') {
      handleOAuthCallback(code);
      // Clean up URL
      searchParams.delete('code');
      searchParams.delete('state');
      setSearchParams(searchParams);
      setActiveTab('social');
    }
  }, []);

  const handleOAuthCallback = async (code) => {
    try {
      // Hardcode the redirectUri to match exactly what is registered in Facebook
      const redirectUri = 'https://mkt.kaiyovietnam.vn/poster-dashboard';
      
      console.error('Sending callback with redirectUri:', redirectUri);
      
      await axios.post(`${API_URL}/api/social/link`, {
        platform: 'Facebook',
        code,
        redirectUri
      }, {
        headers: { 'x-auth-token': token }
      });
      alert('Facebook account successfully linked!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.msg || 'Error linking Facebook account');
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/groups/join`, { invitationCode }, {
        headers: { 'x-auth-token': token }
      });
      alert('Successfully joined group!');
      setInvitationCode('');
      fetchData(); // Refresh posts that might be available now
    } catch (err) {
      alert(err.response?.data?.msg || 'Error joining group');
    }
  };

  const handleLinkAccount = (e) => {
    e.preventDefault();
    if (platform === 'Facebook') {
      const appId = import.meta.env.VITE_FB_APP_ID;
      if (!appId) {
        alert('Facebook App ID is not configured. Please add VITE_FB_APP_ID to .env');
        return;
      }
      // Hardcode the redirectUri to match exactly what is registered in Facebook
      const redirectUri = 'https://mkt.kaiyovietnam.vn/poster-dashboard';
      
      const oauthUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=pages_manage_posts,pages_read_engagement,pages_show_list&state=facebook`;
      window.location.href = oauthUrl;
    } else {
      alert(`${platform} linking is not yet implemented. Please use Facebook.`);
    }
  };

  const handlePostToPlatform = async (postId, targetPlatform) => {
    try {
      const accountId = selectedAccounts[`${postId}_${targetPlatform}`];
      
      const res = await axios.post(`${API_URL}/api/social/post/${postId}`, { 
        platform: targetPlatform,
        accountId: accountId 
      }, {
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
            <div>
              <form onSubmit={handleJoinGroup} style={{ marginBottom: '2rem' }}>
                <div className="form-group">
                  <label>Invitation Code</label>
                  <input type="text" className="input" required value={invitationCode} onChange={e => setInvitationCode(e.target.value)} placeholder="e.g. A1B2C3D4" />
                </div>
                <button type="submit" className="btn btn-primary">Join Group</button>
              </form>

              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Groups You've Joined</h3>
              {joinedGroups.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>You haven't joined any groups yet.</p>
              ) : (
                joinedGroups.map(g => (
                  <div key={g._id} className="list-item" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>{g.name}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'social' && (
            <form onSubmit={handleLinkAccount}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Link your social media accounts to enable automated or one-click posting.
              </p>
              <div className="form-group">
                <label>Platform</label>
                <select className="input" value={platform} onChange={e => setPlatform(e.target.value)}>
                  <option value="Facebook">Facebook (Real)</option>
                  <option value="Zalo" disabled>Zalo (Coming soon)</option>
                  <option value="TikTok" disabled>TikTok (Coming soon)</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#1877f2', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                Connect Facebook
              </button>
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
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {p.platforms.map(plat => {
                    const platformAccounts = linkedAccounts.filter(acc => acc.platform === plat);
                    return (
                      <div key={plat} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {platformAccounts.length > 1 && (
                          <select 
                            className="input" 
                            style={{ fontSize: '0.75rem', padding: '0.2rem' }}
                            value={selectedAccounts[`${p._id}_${plat}`] || ''}
                            onChange={(e) => setSelectedAccounts({...selectedAccounts, [`${p._id}_${plat}`]: e.target.value})}
                          >
                            <option value="">-- Choose Account --</option>
                            {platformAccounts.map(acc => (
                              <option key={acc._id} value={acc._id}>{acc.accountName}</option>
                            ))}
                          </select>
                        )}
                        <button onClick={() => handlePostToPlatform(p._id, plat)} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                          <Share size={14} /> Post to {plat}
                        </button>
                      </div>
                    );
                  })}
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
