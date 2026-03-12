import axios from 'axios';

const API_URL = 'http://localhost:8000';

const getAuthHeaders = (isMultipart = false) => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return {};
    const user = JSON.parse(userStr);
    
    const headers = { Authorization: `Bearer ${user.token}` };
    if (isMultipart) {
        headers['Content-Type'] = 'multipart/form-data';
    }
    return { headers };
};

// Hastaya ait dosyaları getir
export const getPatientFiles = async (patientId) => {
    const response = await axios.get(`${API_URL}/files/${patientId}`, getAuthHeaders());
    return response.data;
};

// Hastaya yeni dosya yükle
export const uploadPatientFile = async (patientId, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/files/${patientId}`, formData, getAuthHeaders(true));
    return response.data;
};