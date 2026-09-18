import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('isLoggedIn');

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  return (
    <nav style={{ fontFamily: '"Times New Roman", Times, serif' }} className="bg-slate-900 border-b-4 border-amber-400 shadow-md text-white sticky top-0 z-50">
      <div className="w-full px-6 lg:px-12 h-20 grid grid-cols-3 items-center">
        
        <div className="flex items-center space-x-3 justify-start">
          <div className="bg-amber-400 border-white text-black p-2.5 rounded-xl font-bold tracking-wider border border-amber-500 shadow-lg flex items-center justify-center">
            <Settings className="w-11 h-11 text-black animate-spin-slow" />
          </div>
          <div>
            <span className="text-[35px] tracking-wide text-white font-bold block leading-tight">
              TechOps
            </span>
            <span className="text-[20px] text-amber-400 uppercase tracking-widest block font-semibold">
              Equipment Maintenance
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-3">
          {isLoggedIn && (
            <>
              <Link 
                to="/" 
                className={`px-4 py-3 rounded-xl text-xl border-white font-bold transition ${
                  location.pathname === '/' 
                    ? 'bg-amber-400 text-black border border-amber-500 shadow-sm' 
                    : 'bg-slate-800/60 text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700/50'
                }`}
              >
                Report Bug
              </Link>
              <Link 
                to="/admin" 
                className={`px-4 py-3 rounded-xl text-xl font-bold transition ${
                  location.pathname === '/admin' 
                    ? 'bg-amber-400 text-black border border-amber-500 shadow-sm' 
                    : 'bg-slate-800/60 text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700/50'
                }`}
              >
                Dashboard
              </Link>
            </>
          )}
        </div>

        {/* Right: Auth / Logout Section */}
        <div className="flex items-center justify-end space-x-3">
          {isLoggedIn ? (
            <button 
              onClick={handleLogout} 
              className="text-xl text-rose-400 hover:text-rose-300 px-6 py-4 rounded-xl hover:bg-slate-800 transition font-bold border border-rose-500"
            >
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="text-sm text-slate-300 hover:text-white px-4 py-2 font-bold border border-slate-700/50">Login</Link>
              <Link to="/register" className="text-sm bg-amber-400 hover:bg-amber-500 text-black font-bold px-5 py-2.5 rounded-xl transition shadow-sm border border-amber-500">Register</Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}