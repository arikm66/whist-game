import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleEmailLogin = (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        // Simulating backend delay
        setTimeout(() => {
            setIsLoading(false);
            // This object will be passed to App.jsx to set the user state
            onLoginSuccess({ 
                id: 'unique_mongo_id_123', 
                email: email, 
                displayName: email.split('@')[0] 
            });
        }, 800);
    };

    const handleSocialLogin = (provider) => {
        // This will redirect to your Passport.js routes on the server
        window.location.href = `http://localhost:3001/auth/${provider}`;
    };

    return (
        <div className="login-page-container">
            {/* The background image and dark overlay are handled by CSS on the container above */}
            <div className="login-card">
                <div className="login-header">
                    <h2>Whist Online</h2>
                    <p className="subtitle">Master the trump. Win the game.</p>
                </div>

                <form className="login-form" onSubmit={handleEmailLogin}>
                    <input 
                        type="email" 
                        placeholder="Email Address" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                    <button type="submit" className="login-btn" disabled={isLoading}>
                        {isLoading ? 'Joining Table...' : 'Start Playing'}
                    </button>
                </form>

                <div className="divider">or continue with</div>

                <div className="social-auth">
                    <button 
                        className="social-btn google-btn" 
                        onClick={() => handleSocialLogin('google')}
                    >
                        Google
                    </button>
                    <button 
                        className="social-btn facebook-btn" 
                        onClick={() => handleSocialLogin('facebook')}
                    >
                        Facebook
                    </button>
                </div>

                <div className="login-footer">
                    <p>New player? <span className="link">Create Account</span></p>
                </div>
            </div>
        </div>
    );
};

export default Login;