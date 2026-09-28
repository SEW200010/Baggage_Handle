import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/login`, formData);
      
      // Save user data & login status
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('isLoggedIn', 'true');

      if (onLogin) {
        onLogin();
      }

      // Successful login -> Redirect to Submit Bugs page
      navigate('/submit-bugs');
      
    } catch (err) {
      // 401 just means wrong credentials; only log unexpected failures
      if (err.response?.status !== 401) {
        console.error(err);
      }
      setError(err.response?.data?.error || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] py-12 px-6 flex justify-center items-center">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white p-8 border-b-4 border-amber-400 text-center">
          <h2 className="text-2xl font-bold tracking-tight">ConveyCare</h2>
          <p className="text-xs text-center sm:text-sm text-slate-500 mb-6">Equipment Maintenance Portal</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-3 font-bold text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Username *
            </label>
            <input
              type="text"
              name="username"
              required
              autoComplete="username"
              autoCapitalize="none"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Password *
            </label>
            <input 
              type="password" 
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold py-4 rounded-2xl transition shadow-lg border border-amber-400 text-base"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-600 font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="text-slate-900 font-bold hover:underline">
                Register here
              </Link>
            </p>
          </div>

        </form>
      </div>
    </div>
  );
}
