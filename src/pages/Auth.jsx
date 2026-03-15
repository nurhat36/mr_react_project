import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import { login, register, googleLogin } from '../services/authService';
import { LogIn, UserPlus, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

const Auth = ({ onLoginSuccess, initialMode }) => {
    const navigate = useNavigate();
    const isLogin = initialMode === 'login'; 
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [message, setMessage] = useState('');

    // ==========================================
    // 1. STANDART GİRİŞ/KAYIT İŞLEMİ
    // ==========================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isLogin) {
                const data = await login(formData.username, formData.password);
                onLoginSuccess(data);
                navigate('/dashboard');
            } else {
                await register(formData.username, formData.password);
                setMessage("Kayıt başarılı! Yönlendiriliyorsunuz...");
                setFormData({ username: '', password: '' });
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (err) {
            setMessage(err.response?.data?.detail || "Bir hata oluştu");
        }
    };

    // ==========================================
    // 2. GOOGLE LOGIN AKIŞI (LOGLAMALI)
    // ==========================================
    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            console.log("✅ 1. [GOOGLE BAŞARILI]: Erişim kodu geldi:", tokenResponse);
            
            try {
                console.log("🚀 2. [BACKEND İSTEĞİ]: Token backend'e gönderiliyor...");
                // Google'dan gelen access_token'ı backend'e gönderiyoruz
                const realDatabaseUser = await googleLogin(tokenResponse.access_token);
                
                console.log("🎉 3. [BACKEND BAŞARILI]: Kullanıcı işlendi:", realDatabaseUser);
                
                localStorage.setItem('user', JSON.stringify(realDatabaseUser));
                onLoginSuccess(realDatabaseUser);
                navigate('/dashboard');
            } catch (err) {
                console.error("❌ [BACKEND HATASI]:", err.response?.data || err.message);
                setMessage("Google girişi backend tarafında onaylanamadı.");
            }
        },
        onError: (errorResponse) => {
            console.error("❌ [GOOGLE LOGIN HATASI]: Google tarafı isteği reddetti!", errorResponse);
            setMessage("Google yetkilendirme hatası (Origin hatası olabilir).");
        },
        // Implicit flow genellikle Origin hatalarını aşmak için daha stabildir
        flow: 'implicit' 
    });

    return (
        <div className="auth-container">
            <div className="auth-card">
                
                <div onClick={() => navigate('/')} className="back-button" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px', color: '#64748b' }}>
                    <ArrowLeft size={18} />
                    <span>Ana Sayfaya Dön</span>
                </div>

                <div className="auth-icon-wrapper">
                    <ShieldCheck size={48} className="auth-icon" />
                </div>
                
                <h2 className="auth-title">{isLogin ? 'Hoş Geldiniz' : 'Yeni Hesap Oluştur'}</h2>
                
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

                <div className="divider">
                    <span>veya</span>
                </div>
                
                <div className="google-btn-wrapper">
                    {/* Hata veren standart buton yerine kontrol edilebilir özel buton */}
                    <button 
                        type="button" 
                        className="google-custom-btn" 
                        onClick={() => {
                            console.log("⚡ 0. [BAŞLAT]: Google Butona tıklandı.");
                            loginWithGoogle();
                        }}
                        style={{
                            width: '100%',
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            backgroundColor: 'white',
                            color: '#444',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            transition: 'background 0.3s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                    >
                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_Logo.svg" alt="G" width="20"/>
                        Google ile {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                    </button>
                </div>

                <p onClick={() => { setMessage(''); navigate(isLogin ? '/register' : '/login'); }} className="toggle-auth" style={{ cursor: 'pointer', marginTop: '20px', textAlign: 'center', color: '#3b82f6' }}>
                    {isLogin ? "Hesabınız yok mu? Kayıt olun" : "Zaten üye misiniz? Giriş yapın"}
                </p>
                
                {message && (
                    <div className={`message ${message.includes('başarılı') ? 'success' : 'error'}`} 
                         style={{ marginTop: '15px', padding: '10px', borderRadius: '5px', textAlign: 'center', backgroundColor: message.includes('başarılı') ? '#dcfce7' : '#fee2e2', color: message.includes('başarılı') ? '#166534' : '#991b1b' }}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Auth;