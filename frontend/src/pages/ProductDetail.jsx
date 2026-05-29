import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Share2 } from 'lucide-react';
import { API_URL } from '../config';
import OrderModal from '../components/OrderModal';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));

    const fetchProduct = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/products/${id}`, {
          headers: { 'x-auth-token': token }
        });
        setProduct(res.data);
      } catch (err) {
        console.error('Error fetching product', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!product) return <p>Product not found.</p>;

  return (
    <div>
      <button className="btn btn-secondary" style={{ marginBottom: '2rem' }} onClick={() => navigate(-1)}>
        &larr; Back
      </button>

      <div className="dashboard-grid">
        <div className="card">
          {product.imageUrl ? (
            <img src={`${API_URL}${product.imageUrl}`} alt={product.name} style={{ width: '100%', borderRadius: 'var(--radius)', marginBottom: '1rem' }} />
          ) : (
            <div style={{ width: '100%', height: '300px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>No Image Available</span>
            </div>
          )}
        </div>
        
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>{product.name}</h1>
          <span className={`badge ${product.isAvailable ? 'badge-success' : 'badge-pending'}`} style={{ display: 'inline-block', marginBottom: '1.5rem', width: 'fit-content' }}>
            {product.isAvailable ? 'In Stock & Active' : 'Out of Stock'}
          </span>
          
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Description</h3>
          <p style={{ lineHeight: 1.8, marginBottom: '2rem' }}>{product.description}</p>
          
          {product.isAvailable && (
            <button 
              className="btn btn-primary" 
              style={{ marginBottom: '2rem', width: '100%', padding: '0.8rem 1.5rem', fontSize: '1.05rem', fontWeight: 600 }}
              onClick={() => setIsModalOpen(true)}
            >
              Order This Product
            </button>
          )}
          
          {(user?.role === 'Poster' || user?.role === 'Admin') && product.isAvailable && (
            <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
              <h3 style={{ marginBottom: '1rem' }}>Share to Platforms</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                As a poster, you can pick up content related to this product in your Poster Dashboard and push it to your linked platforms.
              </p>
              <button className="btn btn-primary" onClick={() => navigate('/poster-dashboard')}>
                <Share2 size={18} /> Go to Poster Dashboard
              </button>
            </div>
          )}
        </div>
      </div>

      <OrderModal 
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default ProductDetail;
