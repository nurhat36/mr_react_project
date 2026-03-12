import React, { useState } from 'react';
import NiiVueViewer from '../components/NiiVueViewer';
import PatientList from '../components/PatientList';
import { getPatientFiles, uploadPatientFile } from '../services/fileService';
import { Upload, Activity, Database, LogOut, User as UserIcon, File, Loader2 } from 'lucide-react';

const MainDashboard = ({ user, onLogout }) => {
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientFiles, setPatientFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [viewMode, setViewMode] = useState('multiplanar'); // Görünüm Modu State'i
    
    const [isImageLoading, setIsImageLoading] = useState(false); // YENİ: Görüntü yüklenme durumu
    
    // NiiVue için gösterilecek dosyalar
    const [mainImage, setMainImage] = useState(null);
    const [maskImage, setMaskImage] = useState(null);

    // Hasta seçildiğinde dosyalarını çek
    const handlePatientSelect = async (patient) => {
        setSelectedPatient(patient);
        setMainImage(null); // Görüntüleyiciyi sıfırla
        setMaskImage(null);
        fetchFiles(patient.id);
    };

    const fetchFiles = async (patientId) => {
        try {
            const files = await getPatientFiles(patientId);
            setPatientFiles(files);
        } catch (error) {
            console.error("Dosyalar çekilemedi:", error);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedPatient) return;

        try {
            setUploading(true);
            await uploadPatientFile(selectedPatient.id, file);
            await fetchFiles(selectedPatient.id);
            
            // Sadece URL değil, dosya adını da gönderiyoruz ki NiiVue uzantıyı anlasın
            setMainImage({ 
                url: URL.createObjectURL(file), 
                name: file.name 
            }); 
            
        } catch (error) {
            console.error("Yükleme hatası:", error);
            alert("Dosya yüklenirken bir hata oluştu.");
        } finally {
            setUploading(false);
        }
    };
    const handleFileClick = (fileRecord) => {
        // Windows yollarındaki ters slaşları (\) düz slaşa (/) çeviriyoruz
        const cleanPath = fileRecord.file_path.replace(/\\/g, '/');
        
        // FastAPI sunucumuzun adresiyle birleştirip tam URL oluşturuyoruz
        const fullUrl = `http://localhost:8000/${cleanPath}`;

        // NiiVue'ye yeni resmi gönderiyoruz
        setMainImage({
            url: fullUrl,
            name: fileRecord.filename
        });
    };

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <Activity color="#60a5fa" size={32} />
                    <h2>SEGMENT AI</h2>
                </div>
                
                <nav className="nav-menu">
                    <div className="nav-group-label">KONTROL PANELİ</div>
                    <div className="nav-item active"><Database size={20} /> Hasta Kayıtları</div>
                    <div className="nav-item"><Activity size={20} /> Canlı Analiz</div>
                    <div className="nav-item"><UserIcon size={20} /> Uzman Doktor</div>
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={onLogout}>
                        <LogOut size={18} /> Sistemi Kapat
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <header className="top-bar">
                    <div className="search-box">
                        <input type="text" placeholder="Hasta ID veya İsim ara..." />
                    </div>
                    <div className="user-profile">
                        <span>Dr. {user.username}</span>
                        <div className="avatar">{user.username[0].toUpperCase()}</div>
                    </div>
                </header>

                <section className="dashboard-body">
                    <div className="welcome-banner">
                        <h1>TÜBİTAK 3D MRI Segmentasyon Sistemi</h1>
                        <p>Yapay zeka destekli tümör tespiti ve hacimsel analiz paneli.</p>
                    </div>

                    <div className="main-grid">
                        
                        {/* SOL: Hasta Listesi */}
                        <div className="patients-column">
                            <PatientList onSelectPatient={handlePatientSelect} />
                        </div>

                        {/* SAĞ: Görüntüleyici ve Dosya Yönetimi */}
                        <div className="viewer-column">
                            {selectedPatient ? (
                                <div className="viewer-card">
                                    <div className="card-top">
                                        <div>
                                            <h3 style={{ color: 'white', marginBottom: '5px' }}>
                                                {selectedPatient.name} - MR Görüntüleri
                                            </h3>
                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ID: {selectedPatient.id}</span>
                                        </div>
                                        
                                        {/* Yükleme Butonu */}
                                        <label className="upload-label" style={{ opacity: uploading ? 0.7 : 1 }}>
                                            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} 
                                            {uploading ? 'Yükleniyor...' : 'Yeni MR Yükle'}
                                            <input type="file" hidden accept=".nii,.nii.gz" onChange={handleFileUpload} disabled={uploading} />
                                        </label>
                                    </div>

                                    {/* Hastanın Geçmiş Dosyaları Listesi */}
                                    {patientFiles.length > 0 && (
                                        <div className="patient-files-bar" style={{ padding: '10px 1.5rem', background: '#0f172a', borderBottom: '1px solid #334155', display: 'flex', gap: '10px', overflowX: 'auto' }}>
                                            {patientFiles.map(f => (
                                                <button key={f.id} className="file-chip" onClick={() => handleFileClick(f)}>
                                                    <File size={14} /> {f.filename.substring(0, 15)}...
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* GÖRÜNTÜLEYİCİ ALANI */}
                                    <div className="canvas-wrapper" style={{ position: 'relative' }}>
                                        
                                        {/* YÜKLEME EKRANI (OVERLAY) */}
                                        {isImageLoading && (
                                            <div className="loading-overlay">
                                                <Loader2 size={48} className="animate-spin" color="#3b82f6" />
                                                <h3 style={{ marginTop: '15px', color: 'white' }}>MR Görüntüsü İşleniyor...</h3>
                                                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Büyük dosyalar için bu işlem birkaç saniye sürebilir.</p>
                                            </div>
                                        )}

                                        {mainImage ? (
                                            <NiiVueViewer 
                                                mainImage={mainImage} 
                                                maskImage={maskImage} 
                                                viewMode={viewMode}
                                                onLoadingChange={setIsImageLoading} // NiiVue ile haberleşme
                                            />
                                        ) : (
                                            <div className="empty-state">
                                                <Database size={48} />
                                                <p>Görüntülemek için yukarıdan yeni MR yükleyin</p>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            ) : (
                                // Hasta Seçilmediyse Gösterilecek Ekran
                                <div className="viewer-card" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '500px' }}>
                                    <div className="empty-state">
                                        <UserIcon size={64} color="#334155" />
                                        <h3 style={{ color: '#94a3b8', marginTop: '1rem' }}>Lütfen Bir Hasta Seçin</h3>
                                        <p style={{ color: '#64748b' }}>MR görüntülerini yüklemek veya incelemek için sol taraftaki listeden bir hasta kaydına tıklayın.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </section>
            </main>
        </div>
    );
};

export default MainDashboard;