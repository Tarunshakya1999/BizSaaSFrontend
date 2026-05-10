// src/Login.jsx
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Building2, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import InstallPWA from './InstallPWA';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef(null);
  const hasRedirected = useRef(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (showSuccess && countdown > 0 && !hasRedirected.current) {
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          const newValue = prev - 1;
          if (newValue <= 0) {
            clearInterval(timerRef.current);
            if (!hasRedirected.current) {
              hasRedirected.current = true;
              navigate('/', { replace: true });
            }
          }
          return newValue;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showSuccess, countdown, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(form.username, form.password);
      setLoading(false);
      setShowSuccess(true);
      setCountdown(5);
      toast.success('Login successful!');
    } catch (err) {
      setError('Invalid username or password');
      toast.error('Invalid username or password');
      setLoading(false);
    }
  };

  const progressPercentage = ((5 - countdown) / 5) * 100;

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-2xl mb-4">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">BizTrack</h1>
          </div>

          <div className="p-6 bg-gradient-to-br from-green-950/80 to-green-900/50 border border-green-700/50 rounded-2xl text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center animate-pulse">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
            </div>
            
            <p className="text-green-400 font-bold text-xl">Welcome back!</p>
            <p className="text-green-300/80 text-sm mt-2">Redirecting to dashboard in</p>
            <p className="text-5xl font-bold text-green-400 my-3">{countdown}</p>
            <p className="text-green-300/80 text-sm">second{countdown !== 1 ? 's' : ''}</p>
            
            <div className="mt-6">
              <div className="h-2 bg-green-900/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <InstallPWA />
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-2xl mb-4">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to your BizTrack account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-950/50 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full bg-gray-900 border border-gray-800 focus:border-indigo-500 text-white rounded-xl px-4 py-3 text-sm focus:outline-none"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 focus:border-indigo-500 text-white rounded-xl px-4 py-3 text-sm focus:outline-none pr-10"
                  placeholder="Enter password"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white font-medium py-3 rounded-xl text-sm transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin h-4 w-4" />
                  Verifying...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}