import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_URL = 'http://oncovisionai.com.tr/api/auth';
// src/services/authService.js

// src/services/authService.js

export const googleLogin = async (googleToken) => {
    try {
        const response = await axios.post(`${API_URL}/google`, {
            token: googleToken 
        });

        // Backend'den { access_token: "...", user_id: 1, username: "..." } geldiğini varsayıyoruz
        if (response.data.access_token) {
            const userData = {
                token: response.data.access_token, // Diğer servisler 'token' ismini bekler
                username: response.data.username,
                userId: response.data.user_id
            };
            
            // TARAYICIYA KAYDET (Dashboard bunu okuyacak)
            localStorage.setItem('user', JSON.stringify(userData));
            return userData;
        }
        return response.data;
    } catch (error) {
        console.error("Google Login Servis Hatası:", error);
        throw error;
    }
};
// LOGIN FONKSİYONU
export const login = async (username, password) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await axios.post(`${API_URL}/token`, params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    if (response.data.access_token) {
        const token = response.data.access_token;
        const decoded = jwtDecode(token);
        
        const userData = {
            token: token,
            username: decoded.sub,
            userId: decoded.user_id 
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
    }
};

// REGISTER FONKSİYONU (Hata Buradaydı, Başına 'export' eklediğimizden emin olalım)
export const register = async (username, password) => {
    const response = await axios.post(`${API_URL}/register`, { 
        username: username, 
        password: password 
    });
    return response.data;
};

// LOGOUT FONKSİYONU
export const logout = () => {
    localStorage.removeItem('user');
};