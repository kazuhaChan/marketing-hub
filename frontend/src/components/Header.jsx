import { Link, useNavigate } from 'react-router-dom';
import { Search, LogOut, LayoutDashboard } from 'lucide-react';

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <header className="header">
      <Link to="/" className="header-brand">MarketingHub</Link>
      
      <div className="header-search">
        <Search size={18} />
        <input type="text" className="input" placeholder="Search products, groups..." />
      </div>

      <div className="header-actions">
        {(user?.role === 'Sender' || user?.role === 'Admin') && (
          <Link to="/sender-dashboard" className="btn btn-secondary" title="Sender Dashboard">
            <LayoutDashboard size={18} /> <span style={{ marginLeft: '0.4rem', fontSize: '0.85rem' }}>Sender</span>
          </Link>
        )}
        {(user?.role === 'Poster' || user?.role === 'Admin') && (
          <Link to="/poster-dashboard" className="btn btn-secondary" title="Poster Dashboard">
            <LayoutDashboard size={18} /> <span style={{ marginLeft: '0.4rem', fontSize: '0.85rem' }}>Poster</span>
          </Link>
        )}
        {user?.role === 'Admin' && (
          <Link to="/admin-dashboard" className="btn btn-secondary" title="Admin Dashboard">
            <LayoutDashboard size={18} /> <span style={{ marginLeft: '0.4rem', fontSize: '0.85rem' }}>Admin</span>
          </Link>
        )}
        
        <Link to="/profile" className="user-avatar" title="View Profile">
          {user?.username?.charAt(0).toUpperCase()}
        </Link>
        
        <button onClick={() => { onLogout(); navigate('/login'); }} className="btn btn-secondary" title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
