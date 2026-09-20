import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import SubmitBugs from './pages/SubmitBugs.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// Protected Route Component (if not logged in, redirect to login page)
const ProtectedRoute = ({ isLoggedIn, children }) => {
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  const handleLogin = () => {
    localStorage.setItem('isLoggedIn', 'true');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800">
        <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
        <Routes>
          <Route 
            path="/login" 
            element={isLoggedIn ? <Navigate to="/submit-bugs" replace /> : <Login onLogin={handleLogin} />} 
          />
          <Route 
            path="/register" 
            element={<Register />} 
          />
          <Route 
            path="/submit-bugs" 
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <SubmitBugs />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/submit-bug" 
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <SubmitBugs />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          {/* Default URL route: if logged in goes to /submit-bugs, if not logged in goes to /login */}
          <Route 
            path="/" 
            element={
              isLoggedIn ? <Navigate to="/submit-bugs" replace /> : <Navigate to="/login" replace />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;