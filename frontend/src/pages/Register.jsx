import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../api';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/register`, { name, email, password });
      navigate('/login');
    } catch (err) {
      setError('Registration failed. Email might already exist.');
    }
  };

  return (
    <div style={{ fontFamily: '"Times New Roman", Times, serif' }} className="min-h-[calc(100vh-4rem)] bg-slate-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200">
        <div className="text-black p-8  text-center">
          <h2 className="text-xl text-center sm:text-3xl font-bold mb-1">Staff Registration</h2>
          <p className="text-xs text-center sm:text-lg mb-6">Create a new account for bug reporting.</p>
        </div>

        {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-xl">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Full Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              placeholder="e.g. John Doe"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="e.g. technician@techops.com"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900" 
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm transition shadow-md border border-slate-900 mt-2"
          >
            Register
          </button>
        </form>

        <p className="text-center text-xs sm:text-sm text-slate-500 mt-6">
          Already have an account? <Link to="/login" className="text-amber-600 font-bold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}