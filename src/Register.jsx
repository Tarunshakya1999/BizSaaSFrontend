import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './Authcontext';
import { Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    first_name: '', 
    last_name: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await register(form);
      
      // ✅ Show success message
      toast.success('Account created successfully!');
      
      // ✅ Start countdown for redirect
      let timeLeft = 5;
      setCountdown(timeLeft);
      
      const timer = setInterval(() => {
        timeLeft -= 1;
        setCountdown(timeLeft);
        
        if (timeLeft <= 0) {
          clearInterval(timer);
          navigate('/login');
        }
      }, 1000);
      
    } catch (err) {
      const data = err.response?.data;
      const errorMsg = data ? Object.values(data).flat().join(', ') : 'Registration failed';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type = 'text', placeholder) => (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
        placeholder={placeholder}
        required={['username', 'password'].includes(key)}
        disabled={countdown !== null}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="text-gray-500 text-sm mt-1">Start managing your business today</p>
        </div>

        {/* ✅ Success message with countdown */}
        {countdown !== null && (
          <div className="mb-4 p-4 bg-green-950/50 border border-green-800 rounded-xl text-center">
            <p className="text-green-400 font-medium">✓ Account created successfully!</p>
            <p className="text-green-300 text-sm mt-1">
              Redirecting to login in <strong>{countdown}</strong> seconds...
            </p>
            <div className="mt-2 h-1 bg-green-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-1000"
                style={{ width: `${(countdown / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-950/50 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {field('first_name', 'First Name', 'text', 'First')}
            {field('last_name', 'Last Name', 'text', 'Last')}
          </div>
          {field('username', 'Username', 'text', 'Choose a username')}
          {field('email', 'Email', 'email', 'your@email.com')}
          {field('password', 'Password', 'password', 'Min 6 characters')}

          <button
            type="submit"
            disabled={loading || countdown !== null}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl text-sm transition"
          >
            {loading ? 'Creating account...' : countdown !== null ? `Redirecting in ${countdown}s...` : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}