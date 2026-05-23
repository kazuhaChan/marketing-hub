import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';
import SenderDashboard from './pages/SenderDashboard';
import PosterDashboard from './pages/PosterDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Header from './components/Header';
import { useState, useEffect } from 'react';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const Layout = ({ children }) => (
    <div className="app-layout">
      <Header user={user} onLogout={handleLogout} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        
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
