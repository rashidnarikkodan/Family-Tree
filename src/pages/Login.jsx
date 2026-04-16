import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';

export default function Login() {
  const { loginWithGoogle, loginEmailPassword, registerEmailPassword } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (e) {
      setError(e.message);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await registerEmailPassword(email, password);
      } else {
        await loginEmailPassword(email, password);
      }
      navigate('/dashboard');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <div className="bg-[var(--color-node-900)] max-w-md w-full rounded-2xl p-8 shadow-2xl border border-[var(--color-border)] text-[var(--color-text)]">
        <h2 className="text-3xl font-bold mb-6 text-center text-[var(--color-node-300)]">
          Family Tree Connector
        </h2>
        {error && <div className="bg-red-500/20 text-red-200 p-3 mb-4 rounded">{error}</div>}
        
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-[var(--color-node-100)]">Email</label>
            <input 
              type="email" 
              required
              className="w-full bg-[var(--color-bg)] rounded-lg p-3 outline-none focus:ring-2 focus:ring-[var(--color-hover)] transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-[var(--color-node-100)]">Password</label>
            <input 
              type="password" 
              required
              className="w-full bg-[var(--color-bg)] rounded-lg p-3 outline-none focus:ring-2 focus:ring-[var(--color-hover)] transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-[var(--color-node-700)] hover:bg-[var(--color-node-500)] text-white p-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {isRegister ? <UserPlus size={20} /> : <LogIn size={20} />}
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-4">
          <div className="h-px bg-[var(--color-border)] flex-1"></div>
          <span className="text-[var(--color-node-100)] text-sm">or</span>
          <div className="h-px bg-[var(--color-border)] flex-1"></div>
        </div>

        <button 
          onClick={handleGoogle} 
          className="w-full mt-6 bg-[var(--color-bg)] hover:bg-[var(--color-border)] border border-[var(--color-border)] text-white p-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors focus:ring-2 focus:ring-[var(--color-hover)]"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-[var(--color-node-100)]">
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <button 
            onClick={() => setIsRegister(!isRegister)} 
            className="text-[var(--color-hover)] hover:underline font-semibold"
          >
            {isRegister ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
}
