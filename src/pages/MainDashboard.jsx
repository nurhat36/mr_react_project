import React, { useState, useEffect } from 'react';
import NiiVueViewer from '../components/NiiVueViewer';
import PatientList from '../components/PatientList';
import { getPatientFiles, uploadPatientFile, startSegmentation } from '../services/fileService';
import { 
    Upload, 
    Activity, 
    Database, 
    LogOut, 
    User as UserIcon, 
    File, 
    Loader2, 
    BrainCircuit,
    Move, 
    Square,
    CheckCircle,
    Download // YENİ: İndirme ikonu eklendi
} from 'lucide-react';

const BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8000' 
    : 'http://oncovisionai.com.tr';

const MainDashboard = ({ user, onLogout }) => {
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientFiles, setPatientFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [viewMode, setViewMode] = useState('multiplanar'); 
    
    const [activeFileId, setActiveFileId] = useState(null); 
    const [isSegmenting, setIsSegmenting] = useState(false);
    
    const [mainImage, setMainImage] = useState(null);
    const [maskImage, setMaskImage] = useState(null);
    
    const [interactionMode, setInteractionMode] = useState('pan');
    const [roiCoords, setRoiCoords] = useState(null);

    useEffect(() => {
        window.onROISelected = (coords) => {
            console.log("Seçilen ROI Koordinatları:", coords);
            setRoiCoords(coords);
        };
    }, []);

    const handlePatientSelect = async (patient) => {
        setSelectedPatient(patient);
        setMainImage(null); 
        setMaskImage(null);
        setActiveFileId(null);
        setRoiCoords(null);
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
            const result = await uploadPatientFile(selectedPatient.id, file);
            
            await fetchFiles(selectedPatient.id); 
            
            setActiveFileId(result.id);
            setMainImage({ 
                url: URL.createObjectURL(file), 
                name: file.name 
            }); 
            setMaskImage(null); 
            setRoiCoords(null);
        } catch (error) {
            console.error("Yükleme hatası:", error);
            alert("Dosya yüklenirken bir hata oluştu.");
        } finally {
            setUploading(false);
        }
    };

    const handleFileClick = (fileRecord) => {
        setActiveFileId(fileRecord.id); 
        setRoiCoords(null);
        
        const cleanPath = fileRecord.file_path.replace(/\\/g, '/');
        const fullUrl = cleanPath.startsWith('/') ? `${BASE_URL}${cleanPath}` : `${BASE_URL}/${cleanPath}`;
        setMainImage({ url: fullUrl, name: fileRecord.filename });

        if (fileRecord.status === 'segmented' && fileRecord.mask_url) {
            const cleanMaskPath = fileRecord.mask_url.replace(/\\/g, '/');
            const fullMaskUrl = cleanMaskPath.startsWith('/') ? `${BASE_URL}${cleanMaskPath}` : `${BASE_URL}/${cleanMaskPath}`;
            setMaskImage(fullMaskUrl);
        } else {
            setMaskImage(null); 
        }
    };

    const handleSegmentClick = async () => {
        if (!activeFileId) {
            alert("Lütfen önce analiz edilecek bir dosya seçin.");
            return;
        }
        try {
            setIsSegmenting(true);
            const result = await startSegmentation(activeFileId, roiCoords);
            
            const newMaskPath = result.mask_url.replace(/\\/g, '/');
            const fullMaskUrl = newMaskPath.startsWith('/') ? `${BASE_URL}${newMaskPath}` : `${BASE_URL}/${newMaskPath}`;
            setMaskImage(fullMaskUrl);
            
            if (selectedPatient) {
                await fetchFiles(selectedPatient.id);
            }
            
            setRoiCoords(null); 
        } catch (error) {
            console.error("Segmentasyon hatası:", error);
            alert("Analiz sırasında bir hata oluştu. Lütfen bağlantınızı kontrol edin.");
        } finally {
            setIsSegmenting(false);
        }
    };

    // ==========================================
    // YENİ: DOSYA İNDİRME FONKSİYONU
    // ==========================================
    const handleDownload = async (url, defaultFilename) => {
        if (!url) return;
        try {
            // Tarayıcının yeni sekmede açmasını engellemek için dosyayı Blob olarak çekiyoruz
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = defaultFilename || 'oncovision_dosya';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("İndirme hatası:", error);
            // Eğer CORS vb. engellerse B planı olarak normal linkle aç (tarayıcı indirir)
            window.open(url, '_blank');
        }
    };

    const currentActiveFile = patientFiles.find(f => f.id === activeFileId);
    const isActiveFileSegmented = currentActiveFile?.status === 'segmented';

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
                        <span>Dr. {user?.username || 'Kullanıcı'}</span>
                        <div className="avatar">{user?.username ? user.username[0].toUpperCase() : 'U'}</div>
                    </div>
                </header>

                <section className="dashboard-body">
                    <div className="welcome-banner">
                        <h1>TÜBİTAK 3D MRI Segmentasyon Sistemi</h1>
                        <p>Analiz etmek istediğiniz bölgeyi Seçim Modu'nu açarak sağ tıkla işaretleyin.</p>
                    </div>

                    <div className="main-grid">
                        <div className="patients-column">
                            <PatientList onSelectPatient={handlePatientSelect} />
                        </div>

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
                                        <label className="upload-label" style={{ opacity: uploading ? 0.7 : 1 }}>
                                            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} 
                                            {uploading ? 'Yükleniyor...' : 'Yeni MR Yükle'}
                                            <input type="file" hidden accept=".nii,.nii.gz" onChange={handleFileUpload} disabled={uploading} />
                                        </label>
                                    </div>

                                    {patientFiles.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '15px', background: '#0f172a', borderBottom: '1px solid #1e293b' }}>
                                            {patientFiles.map(f => {
                                                const isSegmented = f.status === 'segmented';
                                                const isActive = activeFileId === f.id;
                                                
                                                return (
                                                    <button 
                                                        key={f.id} 
                                                        onClick={() => handleFileClick(f)}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 15px',
                                                            background: isActive ? '#1e293b' : '#334155',
                                                            border: `1px solid ${isActive ? (isSegmented ? '#10b981' : '#3b82f6') : 'transparent'}`,
                                                            borderRadius: '8px', cursor: 'pointer', transition: '0.2s',
                                                            minWidth: '220px', textAlign: 'left'
                                                        }}
                                                    >
                                                        {isSegmented ? (
                                                            <CheckCircle size={22} color="#10b981" />
                                                        ) : (
                                                            <File size={22} color="#94a3b8" />
                                                        )}
                                                        <div>
                                                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white' }}>
                                                                {f.filename.length > 20 ? f.filename.substring(0, 20) + '...' : f.filename}
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: isSegmented ? '#10b981' : '#94a3b8', marginTop: '4px' }}>
                                                                {isSegmented ? 'Yapay Zeka Analizli' : 'Ham Görüntü (İşlem Bekliyor)'}
                                                            </div>
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}

                                    <div className="canvas-wrapper" style={{ position: 'relative', height: '500px' }}>
                                        {mainImage ? (
                                            <NiiVueViewer 
                                                mainImage={mainImage} 
                                                maskImage={maskImage} 
                                                viewMode={viewMode}
                                                interactionMode={interactionMode} 
                                            />
                                        ) : (
                                            <div className="empty-state">
                                                <Database size={48} />
                                                <p>Görüntülemek için yukarıdan yeni MR yükleyin veya listeden seçin</p>
                                            </div>
                                        )}
                                    </div>

                                    {mainImage && (
                                        <div className="viewer-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '10px 1.5rem' }}>
                                            
                                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                <div className="btn-group" style={{ borderRight: '1px solid #334155', paddingRight: '15px' }}>
                                                    <button 
                                                        className={`view-btn ${interactionMode === 'pan' ? 'active' : ''}`} 
                                                        onClick={() => setInteractionMode('pan')}
                                                        title="Yakınlaştır ve Gezin"
                                                    >
                                                        <Move size={14} /> El
                                                    </button>
                                                    <button 
                                                        className={`view-btn ${interactionMode === 'select' ? 'active' : ''}`} 
                                                        onClick={() => setInteractionMode('select')}
                                                        title="Sağ Tıkla Bölge Seç"
                                                    >
                                                        <Square size={14} /> Seçim
                                                    </button>
                                                </div>

                                                <span className="control-label" style={{ color: '#94a3b8', fontSize: '0.75rem' }}>MOD:</span>
                                                <div className="btn-group">
                                                    <button className={`view-btn ${viewMode === 'multiplanar' ? 'active' : ''}`} onClick={() => setViewMode('multiplanar')}>Çoklu-Plan</button>
                                                    <button className={`view-btn ${viewMode === '3d' ? 'active' : ''}`} onClick={() => setViewMode('3d')}>3D Model</button>
                                                </div>
                                                
                                                <div className="btn-group">
                                                    <button className={`view-btn ${viewMode === 'axial' ? 'active' : ''}`} onClick={() => setViewMode('axial')}>Axial</button>
                                                    <button className={`view-btn ${viewMode === 'coronal' ? 'active' : ''}`} onClick={() => setViewMode('coronal')}>Coronal</button>
                                                    <button className={`view-btn ${viewMode === 'sagittal' ? 'active' : ''}`} onClick={() => setViewMode('sagittal')}>Sagittal</button>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                {/* YENİ: İNDİRME BUTONLARI */}
                                                <button 
                                                    onClick={() => handleDownload(mainImage.url, mainImage.name)}
                                                    className="view-btn"
                                                    title="Orijinal Görüntüyü İndir"
                                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#334155', padding: '8px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white' }}
                                                >
                                                    <Download size={16} /> <span style={{fontSize: '0.8rem', fontWeight: 'bold'}}>Orijinal</span>
                                                </button>

                                                {maskImage && (
                                                    <button 
                                                        onClick={() => handleDownload(maskImage, `maske_${mainImage.name}`)}
                                                        className="view-btn"
                                                        title="Üretilen Maskeyi İndir"
                                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#334155', padding: '8px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#10b981' }}
                                                    >
                                                        <Download size={16} /> <span style={{fontSize: '0.8rem', fontWeight: 'bold'}}>Maske</span>
                                                    </button>
                                                )}

                                                <div style={{ width: '1px', height: '30px', background: '#334155', margin: '0 5px' }}></div>

                                                {roiCoords && <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 'bold' }}>✔ BÖLGE SEÇİLDİ</span>}
                                                <button 
                                                    onClick={handleSegmentClick} 
                                                    disabled={isSegmenting}
                                                    className="segment-btn"
                                                    style={{
                                                        background: isSegmenting ? '#475569' : (isActiveFileSegmented ? 'linear-gradient(90deg, #3b82f6, #2563eb)' : 'linear-gradient(90deg, #10b981, #059669)'),
                                                        color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px',
                                                        display: 'flex', alignItems: 'center', gap: '8px', cursor: isSegmenting ? 'not-allowed' : 'pointer',
                                                        fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', transition: '0.3s'
                                                    }}
                                                >
                                                    {isSegmenting ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
                                                    {isSegmenting ? 'AI İşleniyor...' : (isActiveFileSegmented ? 'Yeniden Analiz Et' : 'AI Analizini Başlat')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="viewer-card" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '500px' }}>
                                    <div className="empty-state">
                                        <UserIcon size={64} color="#334155" />
                                        <h3 style={{ color: '#94a3b8', marginTop: '1rem' }}>Lütfen Bir Hasta Seçin</h3>
                                        <p style={{ color: '#64748b' }}>MR incelemek için sol listeden bir hasta seçin.</p>
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