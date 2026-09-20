import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Settings, Menu, X } from 'lucide-react';

export default function Navbar({ isLoggedIn, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user');
    }
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-neutral-900 border-b-4 border-orange-500 text-white shadow-md sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-12 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <Link to={isLoggedIn ? "/submit-bugs" : "/login"} onClick={closeMobileMenu} className="flex items-center space-x-2 sm:space-x-3 group">
          <div className="bg-amber-400 border-white text-black p-1.5 sm:p-2.5 rounded-xl font-bold tracking-wider border border-amber-500 shadow-lg flex items-center justify-center shrink-0">
            <Settings className="w-6 h-6 sm:w-9 sm:h-9 md:w-10 md:h-10 text-black animate-spin-slow" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-xl sm:text-2xl md:text-3xl tracking-wide text-white font-bold leading-tight">
              TechOps
            </span>
            <span className="text-[10px] sm:text-xs md:text-sm text-amber-400 uppercase tracking-wider font-semibold">
              Equipment Maintenance
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-3">
          {isLoggedIn && (
            <>
              <Link 
                to="/submit-bugs" 
                className={`px-4 py-2.5 rounded-xl text-base lg:text-lg border-white font-bold transition ${
                  location.pathname === '/submit-bugs' || location.pathname === '/submit-bug'
                    ? 'bg-amber-400 text-black border border-amber-500 shadow-sm' 
                    : 'bg-slate-800/60 text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700/50'
                }`}
              >
                Submit Bugs
              </Link>
              <Link 
                to="/dashboard" 
                className={`px-4 py-2.5 rounded-xl text-base lg:text-lg font-bold transition ${
                  location.pathname === '/dashboard' || location.pathname === '/admin' 
                    ? 'bg-amber-400 text-black border border-amber-500 shadow-sm' 
                    : 'bg-slate-800/60 text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700/50'
                }`}
              >
                Dashboard
              </Link>
            </>
          )}
        </div>

        {/* Desktop Auth / Logout Section */}
        <div className="hidden md:flex items-center space-x-3">
          {isLoggedIn ? (
            <button 
              onClick={handleLogout} 
              className="text-base lg:text-lg text-rose-400 hover:text-rose-300 px-5 py-2.5 rounded-xl hover:bg-slate-800 transition font-bold border border-rose-500"
            >
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="text-sm text-slate-300 hover:text-white px-4 py-2 font-bold border border-slate-700/50 rounded-lg">Login</Link>
              <Link to="/register" className="text-sm bg-amber-400 hover:bg-amber-500 text-black font-bold px-5 py-2.5 rounded-xl transition shadow-sm border border-amber-500">Register</Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-amber-400 hover:bg-slate-700 focus:outline-none"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Navigation Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 py-4 space-y-3 shadow-2xl">
          {isLoggedIn ? (
            <>
              <Link 
                to="/submit-bugs" 
                onClick={closeMobileMenu}
                className={`block w-full text-center py-3 rounded-xl text-base font-bold transition ${
                  location.pathname === '/submit-bugs' || location.pathname === '/submit-bug'
                    ? 'bg-amber-400 text-black border border-amber-500 shadow-sm' 
                    : 'bg-slate-800 text-slate-200 hover:text-white border border-slate-700'
                }`}
              >
                Submit Bugs
              </Link>
              <Link 
                to="/dashboard" 
                onClick={closeMobileMenu}
                className={`block w-full text-center py-3 rounded-xl text-base font-bold transition ${
                  location.pathname === '/dashboard' || location.pathname === '/admin' 
                    ? 'bg-amber-400 text-black border border-amber-500 shadow-sm' 
                    : 'bg-slate-800 text-slate-200 hover:text-white border border-slate-700'
                }`}
              >
                Dashboard
              </Link>
              <button 
                onClick={handleLogout} 
                className="block w-full text-center text-base text-rose-400 hover:text-rose-300 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition font-bold border border-rose-500"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex flex-col space-y-2">
              <Link 
                to="/login" 
                onClick={closeMobileMenu} 
                className="block text-center text-slate-200 hover:text-white py-3 rounded-xl bg-slate-800 border border-slate-700 font-bold"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                onClick={closeMobileMenu} 
                className="block text-center bg-amber-400 hover:bg-amber-500 text-black font-bold py-3 rounded-xl transition border border-amber-500"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}