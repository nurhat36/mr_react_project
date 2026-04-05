import axios from 'axios';

// CANLI VE LOCAL AYRIMI (Otomatik)
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8000/api' 
    : 'http://oncovisionai.com.tr/api';

// Her istekte kullanıcının token'ını header'a ekleyen yardımcı fonksiyon
const getAuthHeaders = (isMultipart = false) => {
    const userStr = localStorage.getItem('user');
    
    if (!userStr) {
        console.warn("Yetki Uyarısı: Token bulunamadı. Lütfen giriş yapın.");
        return {};
    }
    
    const user = JSON.parse(userStr);
    const headers = { Authorization: `Bearer ${user.token}` };
    
    if (isMultipart) {
        headers['Content-Type'] = 'multipart/form-data';
    }
    
    return { headers };
};

// 1. Hastaya ait dosyaları getir
export const getPatientFiles = async (patientId) => {
    const response = await axios.get(`${API_URL}/files/${patientId}`, getAuthHeaders());
    return response.data;
};

// 2. Hastaya yeni dosya yükle
export const uploadPatientFile = async (patientId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_URL}/files/${patientId}`, formData, getAuthHeaders(true));
    return response.data;
};

// 3. Segmentasyon Başlatma
export const startSegmentation = async (fileId, roi = null) => {
    const formData = new FormData();
    formData.append('x', roi?.x || 0);
    formData.append('y', roi?.y || 0);
    formData.append('z', roi?.z || 0); 
    formData.append('width', 64); 
    formData.append('height', 64);
    formData.append('shape', 'rectangle');

    const response = await axios.post(`${API_URL}/segment/${fileId}`, formData, getAuthHeaders(true));
    return response.data;
};

// ==========================================
// YENİ EKLENEN FONKSİYONLAR (Flutter ile Senkronize)
// ==========================================

// 4. Bir dosyaya ait tüm maskeleri çeker
export const getMasksByFile = async (fileId) => {
    const response = await axios.get(`${API_URL}/masks/file/${fileId}`, getAuthHeaders());
    return response.data;
};

// 5. Dosyayı kalıcı olarak siler (Maskeleriyle birlikte)
export const deleteFile = async (fileId) => {
    const response = await axios.delete(`${API_URL}/files/${fileId}`, getAuthHeaders());
    return response.data;
};

// 6. Sadece spesifik bir maskeyi siler
export const deleteMask = async (maskId) => {
    const response = await axios.delete(`${API_URL}/segment/${maskId}`, getAuthHeaders());
    return response.data;
};