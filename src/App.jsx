import React, { useState, useEffect } from 'react';
import Auth from './pages/Auth';
import MainDashboard from './pages/MainDashboard';
import LandingPage from './pages/LandingPage'; // Yeni ekleyeceğimiz tanıtım sayfası
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false); // Giriş/Kayıt ekranını kontrol eder
  const [authMode, setAuthMode] = useState('login'); // 'login' veya 'register' sekmesi için

  useEffect(() => {
    // Sayfa yenilendiğinde kullanıcı zaten giriş yapmış mı kontrol et
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
        setUser(JSON.parse(loggedInUser));
    }
  }, []);

  // 1. DURUM: Kullanıcı giriş yapmışsa direkt ana paneli (MR Projeni) göster
  if (user) {
    return (
        <MainDashboard 
            user={user} 
            onLogout={() => { 
                localStorage.removeItem('user'); 
                setUser(null); 
                setShowAuth(false); // Çıkış yapınca tanıtım sayfasına dönsün
            }} 
        />
    );
  }

  // 2. DURUM: Kullanıcı giriş yapmamış ama Login/Register butonuna basmışsa Auth'u göster
  if (showAuth) {
    return (
        <Auth 
            initialMode={authMode} // Auth bileşenine login mi register mı açılacağını söyler
            onBack={() => setShowAuth(false)} // Tanıtım sayfasına geri dönmek için
            onLoginSuccess={(userData) => setUser(userData)} 
        />
    );
  }

  // 3. DURUM: İlk açılış (Kullanıcı yok ve Auth ekranı açık değil) - Tanıtım Sayfası
  return (
      <LandingPage 
          onLoginClick={() => { setAuthMode('login'); setShowAuth(true); }}
          onRegisterClick={() => { setAuthMode('register'); setShowAuth(true); }}
      />
  );
}

export default App;