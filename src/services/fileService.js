import axios from 'axios';

// CANLI VE LOCAL AYRIMI (Otomatik)
// NOT: Canlı sunucu adresi https olarak güncellendi!
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8000/api' 
    : 'http://oncovisionai.com.tr/api';

// Her istekte kullanıcının token'ını header'a ekleyen yardımcı fonksiyon
const getAuthHeaders = (isMultipart = false) => {
    const userStr = localStorage.getItem('user');
    
    // Eğer kullanıcı giriş yapmamışsa uyar (Hata ayıklamayı kolaylaştırır)
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

// ==========================================
// SEGMENTASYON BAŞLATMA (Güncellendi)
// ==========================================
export const startSegmentation = async (fileId, roi = null) => {
    const formData = new FormData();
    
    // Dashboard'dan gelen ROI (Seçim Kutusu) koordinatları varsa onları kullan, yoksa 0 gönder
    formData.append('x', roi?.x || 0);
    formData.append('y', roi?.y || 0);
    formData.append('z', roi?.z || 0); // 3D için Z eksenini de ekledik
    
    // Modelin kırpacağı (crop) alanın varsayılan genişliği
    formData.append('width', 64); 
    formData.append('height', 64);
    formData.append('shape', 'rectangle');

    // getAuthHeaders(true) kullanarak multipart (form-data) ayarını ve Token'ı otomatik çekiyoruz
    const response = await axios.post(`${API_URL}/segment/${fileId}`, formData, getAuthHeaders(true));
    
    return response.data;
};