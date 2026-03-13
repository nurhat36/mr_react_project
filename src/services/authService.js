import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_URL = 'http://oncovisionai.com.tr/api/auth';

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