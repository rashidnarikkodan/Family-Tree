import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, ArrowRight, Globe } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const { user, authError, loginWithGoogle, loginEmailPassword, registerEmailPassword } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    setError(authError || '');
  }, [authError]);

  const getAuthErrorMessage = (code, fallbackMessage) => {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password.';
      case 'auth/email-already-in-use':
        return 'An account already exists for this email.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Enter a valid email address.';
      case 'auth/popup-closed-by-user':
        return 'Google sign-in was cancelled before completion.';
      case 'auth/unauthorized-domain':
        return 'This domain is not authorized for Firebase authentication.';
      default:
        return fallbackMessage || 'Authentication failed. Please try again.';
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    setError('');

    try {
      const result = await loginWithGoogle();
      if (result) {
        toast.success('Access Granted', {
          description: `Welcome back, ${result.user.displayName || 'Explorer'}.`
        });
        navigate('/dashboard');
      }
    } catch (e) {
      const errorMsg = getAuthErrorMessage(e.code, e.message);
      setError(errorMsg);
      toast.error('Authentication Failed', {
        description: errorMsg
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');

    setSubmitting(true);
    try {
      if (isRegister) {
        await registerEmailPassword(email, password);
        toast.success('Account Created', {
          description: 'Welcome to the Family Tree Explorer network.'
        });
      } else {
        await loginEmailPassword(email, password);
        toast.success('Access Granted', {
          description: 'Identity verified. Accessing your dashboard.'
        });
      }
      navigate('/dashboard');
    } catch (e) {
      const errorMsg = getAuthErrorMessage(e.code, e.message);
      setError(errorMsg);
      toast.error('Authentication Failed', {
        description: errorMsg
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4 selection:bg-[var(--color-selected)] selection:text-white relative">
      {/* Guest explore shortcut — top-right pill */}
      <button 
        onClick={() => navigate('/explore')} 
        className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/60 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
      >
        <Globe size={13} />
        Browse public families
      </button>
      
      <div className="bg-[var(--color-surface)] max-w-md w-full rounded-3xl p-10 shadow-[0_0_50px_rgba(37,99,235,0.1)] border border-[var(--color-border)] text-[var(--color-text)] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[var(--color-accent)] opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[var(--color-danger)] opacity-10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <h2 className="text-4xl font-black mb-2 text-center bg-clip-text text-transparent bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-danger)]">
            Connect
          </h2>
          <p className="text-[var(--color-text-dim)] text-center mb-10 text-sm font-medium tracking-wide uppercase">
            Family Tree Explorer
          </p>

          {error && (
            <div className="bg-[var(--color-danger)]/10 text-[var(--color-danger)] p-4 mb-6 rounded-2xl border border-[var(--color-danger)]/20 text-sm animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          
          <form onSubmit={handleEmailAuth} className="space-y-5">
            <div>
              <label className="block text-xs font-bold mb-2 text-[var(--color-text-dim)] uppercase tracking-widest pl-1">Email Address</label>
              <input 
                type="email" 
                required
                placeholder="you@example.com"
                className="w-full bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)] rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 focus:border-[var(--color-accent)] transition-all placeholder:text-[var(--color-text-dim)]/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-2 text-[var(--color-text-dim)] uppercase tracking-widest pl-1">Password</label>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                className="w-full bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)] rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 focus:border-[var(--color-accent)] transition-all placeholder:text-[var(--color-text-dim)]/50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              disabled={submitting || Boolean(authError)}
              className="w-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-hover)] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isRegister ? <UserPlus size={20} /> : <LogIn size={20} />}
                  <span>{isRegister ? 'Join the network' : 'Sign in to explorer'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px bg-[var(--color-border)] flex-1"></div>
            <span className="text-[var(--color-text-dim)] text-xs font-bold uppercase tracking-widest">or</span>
            <div className="h-px bg-[var(--color-border)] flex-1"></div>
          </div>

          <button 
            onClick={handleGoogle} 
            disabled={submitting || Boolean(authError)}
            className="w-full mt-8 bg-[var(--color-bg)] hover:bg-[var(--color-border)] border border-[var(--color-border)] text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] focus:ring-2 focus:ring-[var(--color-accent)]/50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            <span>Continue with Google</span>
          </button>

          <p className="mt-8 text-center text-sm text-[var(--color-text-dim)]">
            {isRegister ? 'Part of a family already? ' : "New to the explorer? "}
            <button 
              onClick={() => setIsRegister(!isRegister)} 
              className="text-[var(--color-accent)] hover:text-[var(--color-hover)] hover:underline font-bold"
            >
              {isRegister ? 'Sign in' : 'Create account'}
            </button>
          </p>

          {/* Guest CTA */}
          <div className="mt-8 pt-6 border-t border-[var(--color-border)] text-center">
            <p className="text-xs text-[var(--color-text-dim)] mb-3 font-medium">Just browsing?</p>
            <button
              onClick={() => navigate('/explore')}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/5 hover:text-[var(--color-accent)] text-[var(--color-text-dim)] text-sm font-bold transition-all group"
            >
              <Globe size={15} />
              Explore public family trees
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
