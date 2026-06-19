import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Lock, Mail } from 'lucide-react';
import '../auth/Login.css'; // We can reuse the main login styling

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('light-theme');
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    // Hardcoded mock credentials for the frontend demo
    if (email === 'admin@onlymans.com' && password === 'admin123') {
      localStorage.setItem('isAdminLoggedIn', 'true');
      navigate('/admin');
    } else {
      setError('Invalid admin credentials. Hint: admin@onlymans.com / admin123');
    }
  };

  return (
    <div className="login-container" style={{ background: 'var(--bg-dark)' }}>
      <div className="login-right" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div className="login-form-wrapper" style={{ maxWidth: '400px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <ShieldAlert size={48} color="#e74c3c" style={{ marginBottom: '1rem' }} />
            <h2 className="brand-logo" style={{ color: '#e74c3c' }}>Admin Portal</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Restricted Access Area</p>
          </div>
          
          <div className="form-card" style={{ border: '1px solid #e74c3c33', boxShadow: '0 8px 32px rgba(231, 76, 60, 0.1)' }}>
            <div className="form-header">
              <h3 className="form-title">Security Gateway</h3>
              <p className="form-subtitle">Please verify your identity</p>
            </div>
            
            {error && (
              <div style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', textAlign: 'center' }}>
                {error}
              </div>
            )}
            
            <form className="login-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label>Admin Email</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Mail size={16} />
                  </span>
                  <input 
                    type="email" 
                    placeholder="admin@onlymans.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Passcode</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Lock size={16} />
                  </span>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                className="submit-btn" 
                style={{ background: '#e74c3c', marginTop: '1rem' }}
              >
                Authenticate
                <Lock size={16} style={{ marginLeft: '8px' }} />
              </button>
            </form>
            
            <div className="signup-prompt" style={{ marginTop: '24px' }}>
              <Link to="/user/dashboard" style={{ color: 'var(--text-secondary)' }}>← Return to User Dashboard</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
