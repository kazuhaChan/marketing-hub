import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Users, Package, Send } from 'lucide-react';
import { API_URL } from '../config';

const SenderDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [posts, setPosts] = useState([]);

  // Form states
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productImage, setProductImage] = useState(null);

  const [groupName, setGroupName] = useState('');

  const [postContent, setPostContent] = useState('');
  const [postProductId, setPostProductId] = useState('');
  const [postGroupId, setPostGroupId] = useState('');
  const [postScheduledAt, setPostScheduledAt] = useState('');
  const [postPlatforms, setPostPlatforms] = useState({ Facebook: true, Zalo: false, TikTok: false });

  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const headers = { 'x-auth-token': token };
      const [prodRes, postRes, groupRes] = await Promise.all([
        axios.get(`${API_URL}/api/products`, { headers }),
        axios.get(`${API_URL}/api/posts`, { headers }),
        axios.get(`${API_URL}/api/groups`, { headers })
      ]);
      setProducts(prodRes.data);
      setPosts(postRes.data);
      setGroups(groupRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', productName);
    formData.append('description', productDesc);
    if (productImage) formData.append('image', productImage);

    try {
      await axios.post(`${API_URL}/api/products`, formData, {
        headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
      });
      alert('Product created!');
      setProductName(''); setProductDesc(''); setProductImage(null);
      fetchData();
    } catch (err) {
      alert('Error creating product');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/groups`, { name: groupName }, {
        headers: { 'x-auth-token': token }
      });
      alert(`Group created! Invite Code: ${res.data.invitationCode}`);
      setGroupName('');
      // update groups list if we were displaying them
    } catch (err) {
      alert('Error creating group');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    const selectedPlatforms = Object.keys(postPlatforms).filter(key => postPlatforms[key]);
    
    try {
      await axios.post(`${API_URL}/api/posts`, {
        productId: postProductId,
        groupId: postGroupId, // The sender needs to type the group ID for now (in real app, dropdown)
        content: postContent,
        platforms: selectedPlatforms,
        scheduledAt: postScheduledAt || null
      }, {
        headers: { 'x-auth-token': token }
      });
      alert('Post scheduled/created!');
      setPostContent(''); setPostScheduledAt('');
      fetchData();
    } catch (err) {
      alert('Error creating post. Make sure Product ID and Group ID are valid and owned by you.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Sender Dashboard</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('products')}><Package size={16}/> Products</button>
          <button className={`btn ${activeTab === 'groups' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('groups')}><Users size={16}/> Groups</button>
          <button className={`btn ${activeTab === 'posts' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('posts')}><Send size={16}/> Posts</button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} /> Create New {activeTab.slice(0, -1)}
          </h2>

          {activeTab === 'products' && (
            <form onSubmit={handleCreateProduct}>
              <div className="form-group">
                <label>Product Name</label>
                <input type="text" className="input" required value={productName} onChange={e => setProductName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="input" rows="4" required value={productDesc} onChange={e => setProductDesc(e.target.value)}></textarea>
              </div>
              <div className="form-group">
                <label>Image</label>
                <input type="file" className="input" onChange={e => setProductImage(e.target.files[0])} />
              </div>
              <button type="submit" className="btn btn-primary">Create Product</button>
            </form>
          )}

          {activeTab === 'groups' && (
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label>Group Name</label>
                <input type="text" className="input" required value={groupName} onChange={e => setGroupName(e.target.value)} />
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Creating a group will generate an invitation code that Posters can use to join.
              </p>
              <button type="submit" className="btn btn-primary">Create Group</button>
            </form>
          )}

          {activeTab === 'posts' && (
            <form onSubmit={handleCreatePost}>
               <div className="form-group">
                <label>Select Product</label>
                <select className="input" required value={postProductId} onChange={e => setPostProductId(e.target.value)}>
                  <option value="">-- Choose a Product --</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Select Group</label>
                <select className="input" required value={postGroupId} onChange={e => setPostGroupId(e.target.value)}>
                  <option value="">-- Choose a Group --</option>
                  {groups.map(g => (
                    <option key={g._id} value={g._id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Caption / Content</label>
                <textarea className="input" rows="4" required value={postContent} onChange={e => setPostContent(e.target.value)}></textarea>
              </div>
              <div className="form-group">
                <label>Target Platforms</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  {['Facebook', 'Zalo', 'TikTok'].map(platform => (
                    <label key={platform} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={postPlatforms[platform]} 
                        onChange={(e) => setPostPlatforms({...postPlatforms, [platform]: e.target.checked})}
                      /> {platform}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Schedule At (Optional)</label>
                <input type="datetime-local" className="input" value={postScheduledAt} onChange={e => setPostScheduledAt(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary">Create Post</button>
            </form>
          )}
        </div>

        <div className="card" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Your {activeTab}</h2>
          
          {activeTab === 'products' && products.map(p => (
            <div key={p._id} className="list-item">
              <div>
                <p style={{ fontWeight: 600 }}>{p.name}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {p._id}</p>
              </div>
              <span className={`badge ${p.isAvailable ? 'badge-success' : 'badge-pending'}`}>
                {p.isAvailable ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}

          {activeTab === 'posts' && posts.map(p => (
            <div key={p._id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontWeight: 600 }}>{p.product?.name || 'Unknown Product'}</span>
                <span className={`badge ${p.status === 'Posted' ? 'badge-success' : 'badge-pending'}`}>{p.status}</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{p.content.substring(0, 50)}...</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Platforms: {p.platforms.join(', ')}</p>
              {p.scheduledAt && <p style={{ fontSize: '0.8rem' }}>Scheduled: {new Date(p.scheduledAt).toLocaleString()}</p>}
            </div>
          ))}

          {activeTab === 'groups' && groups.map(g => (
             <div key={g._id} className="list-item">
               <div>
                 <p style={{ fontWeight: 600 }}>{g.name}</p>
                 <p style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Code: {g.invitationCode}</p>
               </div>
               <span className="badge badge-success">{g.members.length} Members</span>
             </div>
           ))}

        </div>
      </div>
    </div>
  );
};

export default SenderDashboard;
