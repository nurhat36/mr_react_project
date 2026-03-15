import axios from 'axios';

// CANLI VE LOCAL AYRIMI (Otomatik)
// NOT: Canlı sunucu adresi https olarak güncellendi!
const BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8000/api' 
    : 'http://oncovisionai.com.tr/api';

const API_URL = `${BASE_URL}/patients`;

// Her istekte kullanıcının token'ını header'a ekleyen yardımcı fonksiyon
const getAuthHeaders = () => {
    const userStr = localStorage.getItem('user');
    
    // Eğer kullanıcı giriş yapmamışsa uyar (Hata ayıklamayı kolaylaştırır)
    if (!userStr) {
        console.warn("Yetki Uyarısı: Token bulunamadı. Lütfen giriş yapın.");
        return {};
    }
    
    const user = JSON.parse(userStr);
    return {
        headers: { Authorization: `Bearer ${user.token}` }
    };
};

export const fetchPatients = async () => {
    const response = await axios.get(`${API_URL}/`, getAuthHeaders());
    return response.data;
};

export const createPatient = async (name) => {
    const response = await axios.post(`${API_URL}/`, { name }, getAuthHeaders());
    return response.data;
};

export const deletePatient = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
};

export const fetchPatientImages = async (patientId) => {
    const response = await axios.get(`${API_URL}/${patientId}/images`, getAuthHeaders());
    return response.data;
};