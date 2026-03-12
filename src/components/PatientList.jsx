import React, { useState, useEffect } from 'react';
import { fetchPatients, createPatient, deletePatient } from '../services/patientService';
import { UserPlus, Trash2, User, ChevronRight } from 'lucide-react';

const PatientList = ({ onSelectPatient }) => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPatientName, setNewPatientName] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        try {
            setLoading(true);
            const data = await fetchPatients();
            setPatients(data);
            setError('');
        } catch (err) {
            setError('Hastalar yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPatient = async (e) => {
        e.preventDefault();
        if (!newPatientName.trim()) return;

        try {
            await createPatient(newPatientName);
            setNewPatientName('');
            setShowAddForm(false);
            loadPatients(); // Listeyi yenile
        } catch (err) {
            setError('Hasta eklenirken bir hata oluştu.');
        }
    };

    const handleDelete = async (id, name, e) => {
        e.stopPropagation(); // Satıra tıklama olayını engeller
        if (window.confirm(`${name} isimli hastayı silmek istediğinize emin misiniz?`)) {
            try {
                await deletePatient(id);
                loadPatients(); // Listeyi yenile
            } catch (err) {
                setError('Hasta silinirken hata oluştu.');
            }
        }
    };

    if (loading) return <div className="p-text">Yükleniyor...</div>;

    return (
        <div className="patient-panel">
            <div className="panel-header">
                <h3>Hasta Kayıtları</h3>
                <button className="icon-btn" onClick={() => setShowAddForm(!showAddForm)}>
                    <UserPlus size={18} />
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {showAddForm && (
                <form onSubmit={handleAddPatient} className="add-patient-form">
                    <input 
                        type="text" 
                        placeholder="Yeni Hasta Adı..." 
                        value={newPatientName}
                        onChange={(e) => setNewPatientName(e.target.value)}
                        autoFocus
                    />
                    <button type="submit">Ekle</button>
                </form>
            )}

            <div className="patient-list">
                {patients.length === 0 && !showAddForm ? (
                    <div className="p-text">Kayıtlı hasta bulunmuyor.</div>
                ) : (
                    patients.map((patient) => (
                        <div 
                            key={patient.id} 
                            className="patient-card"
                            onClick={() => onSelectPatient(patient)}
                        >
                            <div className="p-info">
                                <div className="p-avatar"><User size={16} /></div>
                                <div>
                                    <div className="p-name">{patient.name}</div>
                                    <div className="p-id">ID: {patient.id}</div>
                                </div>
                            </div>
                            <div className="p-actions">
                                <button className="delete-btn" onClick={(e) => handleDelete(patient.id, patient.name, e)}>
                                    <Trash2 size={16} />
                                </button>
                                <ChevronRight size={16} className="chevron" />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PatientList;