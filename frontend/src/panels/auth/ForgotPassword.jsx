import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../components/Logo';
import { apiRequest } from '../../utils/api';
import './Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: { email },
      });
      setSuccess('If an account exists with this email, a password reset link has been sent.');
      setEmail('');
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-right">
        <div className="login-form-wrapper">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2.5rem' }}>
            <Logo size={40} textClass="brand-logo" />
          </div>

          <div className="form-card">
            <div className="form-header">
              <h3 className="form-title">Reset Password</h3>
              <p className="form-subtitle">Enter your email and we'll send a link to reset your password.</p>
            </div>

            {error && <div className="form-error">{error}</div>}
            {success && <div className="success-message" style={{ background: 'rgba(0, 180, 216, 0.1)', color: '#00B4D8', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', border: '1px solid rgba(0, 180, 216, 0.2)' }}>{success}</div>}

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                      <path d="M2 4l10 8 10-8"></path>
                    </svg>
                  </span>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                {!isLoading && (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                )}
              </button>
            </form>

            <div className="signup-prompt">
              Remember your password? <Link to="/login">Log In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
