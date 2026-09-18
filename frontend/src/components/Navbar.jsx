import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('isLoggedIn');

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900 text-white border-b border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 px-3 py-1.5 rounded font-bold text-sm tracking-wide">
            GBS
          </div>
          <span className="font-semibold text-base tracking-wide">
            Ground Baggage System <span className="text-xs text-slate-400 font-normal ml-2">| Maintenance Portal</span>
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <>
              <Link 
                to="/" 
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                  location.pathname === '/' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Report Bug
              </Link>
              <Link 
                to="/admin" 
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                  location.pathname === '/admin' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Dashboard
              </Link>
              <button 
                onClick={handleLogout} 
                className="text-sm font-medium text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded hover:bg-slate-800 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5">Login</Link>
              <Link to="/register" className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded transition">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}