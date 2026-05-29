import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, ShoppingCart, Plus, Minus } from 'lucide-react';
import { API_URL } from '../config';

const OrderModal = ({ product, isOpen, onClose }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerNumber, setCustomerNumber] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset form states
      setQuantity(1);
      setSuccess(false);
      setError('');
      
      // Attempt to pre-fill customer name if logged in
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          if (userObj && userObj.username) {
            setCustomerName(userObj.username);
          }
        } catch (e) {
          console.error('Error reading user state', e);
        }
      } else {
        setCustomerName('');
      }
      setCustomerNumber('');
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !customerNumber.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/orders`,
        {
          productId: product._id,
          customerName,
          customerNumber,
          quantity
        },
        {
          headers: { 'x-auth-token': token }
        }
      );
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000); // Close modal automatically after 2 seconds on success
    } catch (err) {
      console.error('Order request error', err);
      setError(err.response?.data?.msg || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {success ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div className="success-checkmark">
              <div className="check-icon">
                <span className="icon-line line-tip"></span>
                <span className="icon-line line-long"></span>
              </div>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: '#10b981' }}>
              Order Placed!
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Successfully recorded order for {product.name}
            </p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', padding: '0.6rem', borderRadius: '10px' }}>
                <ShoppingCart size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Checkout Product</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fill in the details below to record your order</p>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {product.imageUrl ? (
                <img src={`${API_URL}${product.imageUrl}`} alt={product.name} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', background: 'var(--bg-secondary)' }} />
              ) : (
                <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No Image</span>
                </div>
              )}
              <div>
                <h4 style={{ fontWeight: 600, fontSize: '1.05rem', margin: 0 }}>{product.name}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>ID: {product._id}</p>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Customer Name</label>
                <input 
                  type="text" 
                  className="input" 
                  required 
                  value={customerName} 
                  onChange={e => setCustomerName(e.target.value)} 
                  placeholder="e.g. John Doe"
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label>Contact Number (Phone)</label>
                <input 
                  type="tel" 
                  className="input" 
                  required 
                  value={customerNumber} 
                  onChange={e => setCustomerNumber(e.target.value)} 
                  placeholder="e.g. 0912345678"
                  disabled={submitting}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label>Quantity</label>
                <div className="qty-stepper">
                  <button 
                    type="button" 
                    className="qty-btn" 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || submitting}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="qty-val">{quantity}</span>
                  <button 
                    type="button" 
                    className="qty-btn" 
                    onClick={() => setQuantity(q => q + 1)}
                    disabled={submitting}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }} 
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1.5 }}
                  disabled={submitting}
                >
                  {submitting ? 'Placing Order...' : 'Confirm Order'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderModal;
