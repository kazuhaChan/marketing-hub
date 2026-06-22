import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Send } from 'lucide-react';
import { API_URL } from '../config';

const SenderDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [posts, setPosts] = useState([]);

  // Form states
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productImages, setProductImages] = useState([]);

  const [postContent, setPostContent] = useState('');
  const [postProductId, setPostProductId] = useState('');
  const [postScheduledAt, setPostScheduledAt] = useState('');
  const [postPlatforms, setPostPlatforms] = useState({ Facebook: true, Zalo: false, TikTok: false });
  const [postImages, setPostImages] = useState([]);

  const [editingProductId, setEditingProductId] = useState(null);
  const [productIsAvailable, setProductIsAvailable] = useState(true);

  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const headers = { 'x-auth-token': token };
      const [prodRes, postRes] = await Promise.all([
        axios.get(`${API_URL}/api/products`, { headers }),
        axios.get(`${API_URL}/api/posts`, { headers })
      ]);
      setProducts(prodRes.data);
      setPosts(postRes.data);
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
    if (productImages && productImages.length > 0) {
      for (let i = 0; i < productImages.length; i++) {
        formData.append('images', productImages[i]);
      }
    }

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
      setProductName(''); setProductDesc(''); setProductImages([]); 
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
    
    const formData = new FormData();
    formData.append('productId', postProductId);
    formData.append('content', postContent);
    formData.append('platforms', JSON.stringify(selectedPlatforms));
    if (postScheduledAt) {
      formData.append('scheduledAt', postScheduledAt);
    }
    if (postImages && postImages.length > 0) {
      for (let i = 0; i < postImages.length; i++) {
        formData.append('images', postImages[i]);
      }
    }

    try {
      await axios.post(`${API_URL}/api/posts`, formData, {
        headers: { 
          'x-auth-token': token, 
          'Content-Type': 'multipart/form-data' 
        }
      });
      alert('Post created in the shared pool!');
      setPostContent(''); setPostScheduledAt(''); setPostImages([]);
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
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {editingProductId ? 'Edit Product' : `Create New ${activeTab.slice(0, -1)}`}
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
                <label>Images (Leave empty to keep current)</label>
                <input type="file" className="input" multiple onChange={e => setProductImages(e.target.files)} />
                {productImages && productImages.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {Array.from(productImages).map((file, idx) => (
                      <img 
                        key={idx} 
                        src={URL.createObjectURL(file)} 
                        alt="preview" 
                        style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'cover' }} 
                      />
                    ))}
                  </div>
                )}
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
                <label>Post Images (Optional)</label>
                <input type="file" className="input" multiple onChange={e => setPostImages(e.target.files)} />
                {postImages && postImages.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {Array.from(postImages).map((file, idx) => (
                      <img 
                        key={idx} 
                        src={URL.createObjectURL(file)} 
                        alt="preview" 
                        style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'cover' }} 
                      />
                    ))}
                  </div>
                )}
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
            <div key={p._id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '0.5rem' }}>
                <p style={{ fontWeight: 600 }}>{p.name}</p>
                <span className={`badge ${p.isAvailable ? 'badge-success' : 'badge-pending'}`}>
                  {p.isAvailable ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>ID: {p._id}</p>
              {p.imageUrls && p.imageUrls.length > 0 ? (
                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                  {p.imageUrls.map((url, idx) => (
                    <img key={idx} src={`${API_URL}${url}`} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                  ))}
                </div>
              ) : p.imageUrl ? (
                <img src={`${API_URL}${p.imageUrl}`} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', marginBottom: '0.8rem', border: '1px solid var(--border)' }} />
              ) : null}
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
              {p.imageUrls && p.imageUrls.length > 0 ? (
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', margin: '0.4rem 0' }}>
                  {p.imageUrls.map((url, idx) => (
                    <img key={idx} src={`${API_URL}${url}`} alt="" style={{ width: '35px', height: '35px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                  ))}
                </div>
              ) : p.product?.imageUrls && p.product.imageUrls.length > 0 ? (
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', margin: '0.4rem 0' }}>
                  {p.product.imageUrls.map((url, idx) => (
                    <img key={idx} src={`${API_URL}${url}`} alt="" style={{ width: '35px', height: '35px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                  ))}
                </div>
              ) : p.product?.imageUrl ? (
                <img src={`${API_URL}${p.product.imageUrl}`} alt="" style={{ width: '35px', height: '35px', borderRadius: '4px', objectFit: 'cover', margin: '0.4rem 0', border: '1px solid var(--border)' }} />
              ) : null}
              {p.scheduledAt && <p style={{ fontSize: '0.8rem' }}>Scheduled: {new Date(p.scheduledAt).toLocaleString()}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SenderDashboard;
