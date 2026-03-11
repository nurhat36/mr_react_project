import React, { useState } from 'react';
import { login, register } from '../services/authService';
import { LogIn, UserPlus, ShieldCheck } from 'lucide-react';

const Auth = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [message, setMessage] = useState('');

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
            }
        } catch (err) {
            setMessage(err.response?.data?.detail || "Bir hata oluştu");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-icon">
                    <ShieldCheck size={48} color="#646cff" />
                </div>
                <h2>{isLogin ? 'Hoş Geldiniz' : 'Yeni Hesap Oluştur'}</h2>
                
                <form onSubmit={handleSubmit}>
                    <input 
                        type="text" 
                        placeholder="Kullanıcı Adı" 
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Şifre" 
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required 
                    />
                    <button type="submit">
                        {isLogin ? <><LogIn size={18}/> Giriş Yap</> : <><UserPlus size={18}/> Kayıt Ol</>}
                    </button>
                </form>

                <p onClick={() => setIsLogin(!isLogin)} className="toggle-auth">
                    {isLogin ? "Hesabınız yok mu? Kayıt olun" : "Zaten üye misiniz? Giriş yapın"}
                </p>
                {message && <p className="message">{message}</p>}
            </div>
        </div>
    );
};

export default Auth;