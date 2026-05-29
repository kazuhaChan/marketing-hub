import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Send, ShoppingCart } from 'lucide-react';
import { API_URL } from '../config';

const SenderDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [orders, setOrders] = useState([]);

  // Form states
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productImage, setProductImage] = useState(null);

  const [postContent, setPostContent] = useState('');
  const [postProductId, setPostProductId] = useState('');
  const [postScheduledAt, setPostScheduledAt] = useState('');
  const [postPlatforms, setPostPlatforms] = useState({ Facebook: true, Zalo: false, TikTok: false });

  const [editingProductId, setEditingProductId] = useState(null);
  const [productIsAvailable, setProductIsAvailable] = useState(true);

  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const headers = { 'x-auth-token': token };
      const [prodRes, postRes, orderRes] = await Promise.all([
        axios.get(`${API_URL}/api/products`, { headers }),
        axios.get(`${API_URL}/api/posts`, { headers }),
        axios.get(`${API_URL}/api/orders`, { headers })
      ]);
      setProducts(prodRes.data);
      setPosts(postRes.data);
      setOrders(orderRes.data);
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
    formData.append('isAvailable', productIsAvailable);
    if (productImage) formData.append('image', productImage);

    try {
      if (editingProductId) {
        await axios.put(`${API_URL}/api/products/${editingProductId}`, formData, {
          headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
        });
        alert('Product updated successfully!');
      } else {
        await axios.post(`${API_URL}/api/products`, formData, {
          headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
        });
        alert('Product created successfully!');
      }
      setProductName(''); setProductDesc(''); setProductImage(null); 
      setEditingProductId(null); setProductIsAvailable(true);
      fetchData();
    } catch (err) {
      alert('Error saving product');
    }
  };

  const handleEditClick = (p) => {
    setEditingProductId(p._id);
    setProductName(p.name);
    setProductDesc(p.description);
    setProductIsAvailable(p.isAvailable);
    setActiveTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`${API_URL}/api/products/${id}`, {
        headers: { 'x-auth-token': token }
      });
      fetchData();
    } catch (err) {
      alert('Error deleting product');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    const selectedPlatforms = Object.keys(postPlatforms).filter(key => postPlatforms[key]);
    
    try {
      await axios.post(`${API_URL}/api/posts`, {
        productId: postProductId,
        content: postContent,
        platforms: selectedPlatforms,
        scheduledAt: postScheduledAt || null
      }, {
        headers: { 'x-auth-token': token }
      });
      alert('Post created in the shared pool!');
      setPostContent(''); setPostScheduledAt('');
      fetchData();
    } catch (err) {
      alert('Error creating post. Make sure Product is valid and owned by you.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Sender Dashboard</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('products')}><Package size={16}/> Products</button>
          <button className={`btn ${activeTab === 'posts' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('posts')}><Send size={16}/> Posts</button>
          <button className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('orders')}><ShoppingCart size={16}/> Orders</button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {activeTab === 'orders' ? 'Order Insights' : (editingProductId ? 'Edit Product' : `Create New ${activeTab.slice(0, -1)}`)}
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
                <label>Image (Leave empty to keep current)</label>
                <input type="file" className="input" onChange={e => setProductImage(e.target.files[0])} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={productIsAvailable} onChange={e => setProductIsAvailable(e.target.checked)} id="isAvailable" />
                <label htmlFor="isAvailable" style={{ marginBottom: 0 }}>Active / Available for Posters</label>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary">{editingProductId ? 'Update Product' : 'Create Product'}</button>
                {editingProductId && (
                  <button type="button" className="btn btn-secondary" onClick={() => { setEditingProductId(null); setProductName(''); setProductDesc(''); }}>Cancel</button>
                )}
              </div>
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

          {activeTab === 'orders' && (
            <div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                Monitor performance, fulfillment, and customer inquiries from this panel. All orders are synchronized to your designated Google Sheet in real-time.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Total Orders</p>
                  <p style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary)' }}>{orders.length}</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Items Ordered</p>
                  <p style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--success)' }}>
                    {orders.reduce((sum, o) => sum + (o.quantity || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Your {activeTab}</h2>
          
          {activeTab === 'products' && products.map(p => (
            <div key={p._id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '0.5rem' }}>
                <p style={{ fontWeight: 600 }}>{p.name}</p>
                <span className={`badge ${p.isAvailable ? 'badge-success' : 'badge-pending'}`}>
                  {p.isAvailable ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>ID: {p._id}</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleEditClick(p)} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>Edit</button>
                <button onClick={() => handleDeleteProduct(p._id)} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', color: '#ff4d4f' }}>Delete</button>
              </div>
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

          {activeTab === 'orders' && orders.map(o => (
            <div key={o._id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{o.productName}</span>
                <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>Qty: {o.quantity}</span>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
                <p><strong>Customer:</strong> {o.customerName}</p>
                <p><strong>Contact:</strong> {o.customerNumber}</p>
                <p><strong>Ordered By:</strong> {o.orderedBy?.username || 'Unknown'}</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.2rem', color: 'var(--text-muted)' }}>
                  {new Date(o.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}

          {activeTab === 'orders' && orders.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
              No orders received yet for your products.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SenderDashboard;
