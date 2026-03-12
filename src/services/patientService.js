import axios from 'axios';

// Docker'da çalışırken de bu adres kullanılacak (Nginx ayarlarında 8000'e proxy yapılabilir ama şimdilik localhost:8000 ideal)
const API_URL = 'http://localhost:8000/patients';

// Her istekte kullanıcının token'ını header'a ekleyen yardımcı fonksiyon
const getAuthHeaders = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return {};
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