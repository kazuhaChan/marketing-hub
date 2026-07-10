import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Link as LinkIcon, Share, MessageSquare, ShoppingCart, BarChart2, X } from 'lucide-react';
import { API_URL } from '../config';

const PosterDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [orders, setOrders] = useState([]);

  // Mock social link state
  const [platform, setPlatform] = useState('Facebook');
  const [selectedAccounts, setSelectedAccounts] = useState({}); // { postId_platform: accountId }
  const [sandboxMode, setSandboxMode] = useState(true);

  // Page Feed & Engagement state (pages_read_engagement)
  const [selectedFeedAccount, setSelectedFeedAccount] = useState(null);
  const [feedPosts, setFeedPosts] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [feedError, setFeedError] = useState('');

  const token = localStorage.getItem('token');

  const fetchPageFeed = async (account) => {
    setSelectedFeedAccount(account);
    setLoadingFeed(true);
    setFeedError('');
    setFeedPosts([]);
    try {
      const headers = { 'x-auth-token': token };
      const res = await axios.get(`${API_URL}/api/social/page-feed/${account._id}`, { headers });
      setFeedPosts(res.data);
    } catch (err) {
      setFeedError(err.response?.data?.msg || 'Error fetching page feed and metrics');
    } finally {
      setLoadingFeed(false);
    }
  };

  const fetchData = async () => {
    try {
      const headers = { 'x-auth-token': token };
      const [postRes, accRes, orderRes] = await Promise.all([
        axios.get(`${API_URL}/api/posts`, { headers }),
        axios.get(`${API_URL}/api/social/accounts`, { headers }),
        axios.get(`${API_URL}/api/orders`, { headers })
      ]);
      setPosts(postRes.data);
      setLinkedAccounts(accRes.data);
      setOrders(orderRes.data);
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
      const redirectUri = code === 'mock_sandbox_code' ? `${window.location.origin}/poster-dashboard` : 'https://mkt.kaiyovietnam.vn/poster-dashboard';
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

  const handleLinkAccount = (e) => {
    e.preventDefault();
    if (platform === 'Facebook') {
      if (sandboxMode) {
        navigate('/mock-facebook-oauth');
      } else {
        const appId = import.meta.env.VITE_FB_APP_ID;
        if (!appId) {
          alert('Facebook App ID is not configured. Please add VITE_FB_APP_ID to .env');
          return;
        }
        const redirectUri = 'https://mkt.kaiyovietnam.vn/poster-dashboard';
        const oauthUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=pages_manage_posts,pages_read_engagement,pages_show_list&state=facebook`;
        window.location.href = oauthUrl;
      }
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
          <button className={`btn ${activeTab === 'social' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('social')}><LinkIcon size={16}/> Accounts</button>
          <button className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('orders')}><ShoppingCart size={16}/> My Orders</button>
        </div>
      </div>

      {activeTab === 'posts' ? (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="card" style={{ maxHeight: '800px', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Shared Pool Feed</h2>
            {posts.map(p => (
              <div key={p._id} className="card" style={{ marginBottom: '1rem', background: 'rgba(15, 23, 42, 0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{p.product?.name}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>From: {p.sender?.username}</span>
                </div>
                <p style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>{p.content}</p>
                
                {/* Image previews */}
                {p.imageUrls && p.imageUrls.length > 0 ? (
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    {p.imageUrls.map((url, idx) => (
                      <img 
                        key={idx} 
                        src={`${API_URL}${url}`} 
                        alt="" 
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }} 
                      />
                    ))}
                  </div>
                ) : p.product?.imageUrls && p.product.imageUrls.length > 0 ? (
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    {p.product.imageUrls.map((url, idx) => (
                      <img 
                        key={idx} 
                        src={`${API_URL}${url}`} 
                        alt="" 
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }} 
                      />
                    ))}
                  </div>
                ) : p.product?.imageUrl ? (
                  <img 
                    src={`${API_URL}${p.product.imageUrl}`} 
                    alt="" 
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', marginBottom: '1rem', border: '1px solid var(--border)' }} 
                  />
                ) : null}
                
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
            {posts.length === 0 && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
                No posts available yet.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="dashboard-grid">
          <div className="card">
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {activeTab === 'orders' ? 'Tracking Metrics' : 'Action Area'}
            </h2>

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
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', marginBottom: '1.25rem' }}>
                  <input 
                    type="checkbox" 
                    id="sandboxMode" 
                    checked={sandboxMode} 
                    onChange={e => setSandboxMode(e.target.checked)} 
                    style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
                  />
                  <label htmlFor="sandboxMode" style={{ margin: 0, fontWeight: 500, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--primary)' }}>
                    Developer Sandbox Mode (OAuth Simulation)
                  </label>
                </div>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#1877f2', display: 'flex', gap: '0.5rem', justifyContent: 'center', width: '100%' }}>
                  Connect Facebook
                </button>
              </form>
            )}

            {activeTab === 'orders' && (
              <div>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                  Track the delivery and fulfillment status of your unique product checkouts.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Total Orders</p>
                    <p style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary)' }}>{orders.length}</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Total Qty</p>
                    <p style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--success)' }}>
                      {orders.reduce((sum, o) => sum + (o.quantity || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>
              {activeTab === 'social' ? 'Your Linked Accounts' : 'Your Tracked Orders'}
            </h2>
            
            {activeTab === 'social' && linkedAccounts.map(acc => (
               <div key={acc._id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>{acc.accountName} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({acc.platform})</span></p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>ID: {acc.accountId}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {acc.platform === 'Facebook' && (
                      <button 
                        onClick={() => fetchPageFeed(acc)}
                        className="btn btn-secondary" 
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <BarChart2 size={12} /> View Feed & Engagement
                      </button>
                    )}
                    <span className="badge badge-success">Linked</span>
                  </div>
                </div>
              </div>
            ))}

            {activeTab === 'orders' && orders.map(o => (
              <div key={o._id} className="card" style={{ marginBottom: '1rem', background: 'rgba(15, 23, 42, 0.4)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '1.05rem' }}>{o.productName}</span>
                  <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>Qty: {o.quantity}</span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <p><strong>Tracking ID:</strong> <code style={{ color: 'var(--text-main)', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{o._id}</code></p>
                  <p><strong>Contact Phone:</strong> {o.posterPhone}</p>
                  <p><strong>Fulfillment Location:</strong> {o.posterLocation}</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.4rem', color: 'var(--text-muted)' }}>
                    Placed on: {new Date(o.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}

            {activeTab === 'orders' && orders.length === 0 && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
                You have not placed any orders yet.
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'social' && selectedFeedAccount && (
         <div className="card" style={{ marginTop: '2rem', border: '1px solid var(--primary)', background: 'rgba(15, 23, 42, 0.6)' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
             <div>
               <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <BarChart2 size={20} /> Facebook Page Feed & Engagement Analytics
               </h2>
               <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                 Connected Page: <strong>{selectedFeedAccount.accountName}</strong> (ID: {selectedFeedAccount.accountId})
               </p>
             </div>
             <button onClick={() => setSelectedFeedAccount(null)} className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <X size={16} />
             </button>
           </div>

           <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', lineHeight: '1.5' }}>
             <p style={{ margin: 0 }}>
               ℹ️ <strong>Use Case Demonstration:</strong> This panel uses the <code>pages_read_engagement</code> permission to fetch the Page's posts and retrieve real-time engagement analytics. Marketing Hub uses this data to track reach, likes, comments, and shares, allowing publishers to monitor performance and optimize content distribution.
             </p>
           </div>

           {loadingFeed && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading posts and engagement metrics...</p>}
           
           {feedError && <div style={{ color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{feedError}</div>}

           {!loadingFeed && !feedError && feedPosts.length === 0 && (
             <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No posts found on this page's feed.</p>
           )}

           {!loadingFeed && !feedError && feedPosts.length > 0 && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               {feedPosts.map(post => (
                 <div key={post.id} className="card" style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border)', padding: '1.25rem' }}>
                   <p style={{ fontSize: '0.95rem', margin: '0 0 1rem 0', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{post.message}</p>
                   
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                     <span>Posted on: {new Date(post.createdAt).toLocaleString('en-US')}</span>
                     
                     <div style={{ display: 'flex', gap: '1rem' }}>
                       <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)' }}>
                         👍 <strong>{post.likesCount}</strong> Likes
                       </span>
                       <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--success)' }}>
                         💬 <strong>{post.commentsCount}</strong> Comments
                       </span>
                       <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-main)' }}>
                         🔗 <strong>{post.sharesCount}</strong> Shares
                       </span>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </div>
       )}
    </div>
  );
};

export default PosterDashboard;
