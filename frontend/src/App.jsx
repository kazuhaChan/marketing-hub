import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';
import SenderDashboard from './pages/SenderDashboard';
import PosterDashboard from './pages/PosterDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import DeleteInstructions from './pages/DeleteInstructions';
import Header from './components/Header';
import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Set up global axios interceptor for 401 errors
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const Footer = () => (
    <footer style={{
      textAlign: 'center',
      padding: '1.5rem',
      borderTop: '1px solid var(--border)',
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(12px)',
      color: 'var(--text-muted)',
      fontSize: '0.85rem',
      display: 'flex',
      justifyContent: 'center',
      gap: '1.5rem',
      alignItems: 'center',
      marginTop: 'auto'
    }}>
      <span>© 2026 MarketingHub. All rights reserved.</span>
      <a href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = 'var(--primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>Chính sách bảo mật</a>
      <a href="/delete-instructions" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = 'var(--primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>Hướng dẫn xóa dữ liệu</a>
    </footer>
  );

  const Layout = ({ children }) => (
    <div className="app-layout">
      <Header user={user} onLogout={handleLogout} />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/delete-instructions" element={<DeleteInstructions />} />
        
        {/* Protected Routes */}
        <Route path="/" element={user ? <Layout><Home /></Layout> : <Navigate to="/login" />} />
        <Route path="/product/:id" element={user ? <Layout><ProductDetail /></Layout> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Layout><Profile user={user} /></Layout> : <Navigate to="/login" />} />
        
        {/* Role based Dashboards */}
        <Route path="/sender-dashboard" element={
          user && (user.role === 'Sender' || user.role === 'Admin') ? <Layout><SenderDashboard user={user} /></Layout> : <Navigate to="/" />
        } />
        
        <Route path="/poster-dashboard" element={
          user && (user.role === 'Poster' || user.role === 'Admin') ? <Layout><PosterDashboard user={user} /></Layout> : <Navigate to="/" />
        } />
        
        <Route path="/admin-dashboard" element={
          user && user.role === 'Admin' ? <Layout><AdminDashboard user={user} /></Layout> : <Navigate to="/" />
        } />
      </Routes>
    </Router>
  );
}

export default App;
