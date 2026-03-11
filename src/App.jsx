import React, { useState, useEffect } from 'react';
import Auth from './pages/Auth';
import MainDashboard from './pages/MainDashboard'; // Bu senin MR projenin olduğu sayfa olacak
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
        setUser(JSON.parse(loggedInUser));
    }
  }, []);

  if (!user) {
    return <Auth onLoginSuccess={(userData) => setUser(userData)} />;
  }

  return (
      <MainDashboard 
          user={user} 
          onLogout={() => { localStorage.removeItem('user'); setUser(null); }} 
      />
  );
}

export default App;