import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/products`, {
          headers: { 'x-auth-token': token }
        });
        setProducts(res.data);
      } catch (err) {
        console.error('Error fetching products', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div>
      <h1 className="page-title">Products Showcase</h1>
      
      {loading ? (
        <p>Loading products...</p>
      ) : products.length === 0 ? (
        <p>No products available right now.</p>
      ) : (
        <div className="product-grid">
          {products.map(product => (
            <Link to={`/product/${product._id}`} key={product._id} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card product-card" style={{ padding: 0 }}>
                {product.imageUrl ? (
                  <img src={`${API_URL}${product.imageUrl}`} alt={product.name} className="product-image" />
                ) : (
                  <div className="product-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>No Image</span>
                  </div>
                )}
                <div className="product-info">
                  <h3 className="product-title">{product.name}</h3>
                  <p className="product-desc">{product.description.substring(0, 100)}...</p>
                  <div>
                    <span className={`badge ${product.isAvailable ? 'badge-success' : 'badge-pending'}`}>
                      {product.isAvailable ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
