// src/pages/Auth.jsx
import React, { useState, useEffect } from 'react';
import '../styles/Auth.css'; // YENİ CSS DOSYAMIZI EKLEDİK
import { login, register } from '../services/authService';
import { LogIn, UserPlus, ShieldCheck, ArrowLeft } from 'lucide-react';

const Auth = ({ onLoginSuccess, onBack, initialMode = 'login' }) => {
    const [isLogin, setIsLogin] = useState(initialMode === 'login');
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [message, setMessage] = useState('');

    useEffect(() => {
        setIsLogin(initialMode === 'login');
    }, [initialMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isLogin) {
                const data = await login(formData.username, formData.password);
                onLoginSuccess(data);
            } else {
                await register(formData.username, formData.password);
                setMessage("Kayıt başarılı! Şimdi giriş yapabilirsiniz.");
                setIsLogin(true); 
                setFormData({ username: '', password: '' }); 
            }
        } catch (err) {
            setMessage(err.response?.data?.detail || "Bir hata oluştu");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                
                {/* Satır içi (inline) stilleri sildik, CSS dosyasından yöneteceğiz */}
                <div onClick={onBack} className="back-button">
                    <ArrowLeft size={18} />
                    <span>Ana Sayfaya Dön</span>
                </div>

                <div className="auth-icon-wrapper">
                    <ShieldCheck size={48} className="auth-icon" />
                </div>
                
                <h2>{isLogin ? 'Hoş Geldiniz' : 'Yeni Hesap Oluştur'}</h2>
                
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                        <input 
                            type="text" 
                            placeholder="Kullanıcı Adı" 
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                            required 
                        />
                    </div>
                    <div className="input-group">
                        <input 
                            type="password" 
                            placeholder="Şifre" 
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            required 
                        />
                    </div>
                    <button type="submit" className="auth-submit-btn">
                        {isLogin ? <><LogIn size={18}/> Giriş Yap</> : <><UserPlus size={18}/> Kayıt Ol</>}
                    </button>
                </form>

                <p onClick={() => { setIsLogin(!isLogin); setMessage(''); }} className="toggle-auth">
                    {isLogin ? "Hesabınız yok mu? Kayıt olun" : "Zaten üye misiniz? Giriş yapın"}
                </p>
                {message && <div className={`message ${message.includes('başarılı') ? 'success' : 'error'}`}>{message}</div>}
            </div>
        </div>
    );
};

export default Auth;