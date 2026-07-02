import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../../components/Logo';
import { apiRequest } from '../../utils/api';
import './Login.css';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Extract the token from the URL query params, e.g. /reset-password?token=abcdef
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: { token, newPassword: password },
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link might be expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-container">
        <div className="login-right">
          <div className="login-form-wrapper">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2.5rem' }}>
              <Logo size={40} textClass="brand-logo" />
            </div>
            <div className="form-card" style={{ textAlign: 'center' }}>
              <h3 className="form-title" style={{ color: '#00B4D8' }}>Password Reset Successful!</h3>
              <p className="form-subtitle" style={{ marginTop: '16px', marginBottom: '30px' }}>
                Your password has been successfully updated. You can now log in with your new password.
              </p>
              <Link to="/login" className="submit-btn" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
                Return to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-right">
        <div className="login-form-wrapper">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2.5rem' }}>
            <Logo size={40} textClass="brand-logo" />
          </div>

          <div className="form-card">
            <div className="form-header">
              <h3 className="form-title">Choose New Password</h3>
              <p className="form-subtitle">Please enter your new password below.</p>
            </div>

            {error && <div className="form-error">{error}</div>}

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>New Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </span>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </span>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
                {!isLoading && (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
