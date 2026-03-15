// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Auth from './pages/Auth';
import MainDashboard from './pages/MainDashboard';
import LandingPage from './pages/LandingPage';
import './App.css';

const GOOGLE_CLIENT_ID = "636599479269-8f0sbt9dpchjfit9so8la30heiqc8ckl.apps.googleusercontent.com";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) setUser(JSON.parse(loggedInUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Auth initialMode="login" onLoginSuccess={setUser} />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Auth initialMode="register" onLoginSuccess={setUser} />} />
          <Route path="/dashboard" element={user ? <MainDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;