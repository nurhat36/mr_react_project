import axios from 'axios';

const API_URL = 'http://oncovisionai.com.tr/api';

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
// fileService.js dosyasının en altına EKLENECEK KOD:

export const startSegmentation = async (fileId) => {
    const formData = new FormData();
    // NIfTI dosyaları için backend bu değerleri 0 bekliyor
    formData.append('x', 0);
    formData.append('y', 0);
    formData.append('width', 0);
    formData.append('height', 0);
    formData.append('shape', 'rectangle');

    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);

    const response = await axios.post(`${API_URL}/segment/${fileId}`, formData, {
        headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    
    return response.data;
};