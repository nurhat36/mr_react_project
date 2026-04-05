import React, { useState, useEffect } from 'react';
import NiiVueViewer from '../components/NiiVueViewer';
import PatientList from '../components/PatientList';
import { 
    getPatientFiles, 
    uploadPatientFile, 
    startSegmentation,
    getMasksByFile, // YENİ EKLENDİ
    deleteFile,     // YENİ EKLENDİ
    deleteMask      // YENİ EKLENDİ
} from '../services/fileService';
import { 
    Upload, Activity, Database, LogOut, User as UserIcon, 
    File, Loader2, BrainCircuit, Move, Square, CheckCircle, 
    Download, ChevronDown, ChevronUp, CornerDownRight, Trash2 
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
    const [activeMaskId, setActiveMaskId] = useState(null);
    const [isSegmenting, setIsSegmenting] = useState(false);
    
    const [mainImage, setMainImage] = useState(null);
    const [maskImage, setMaskImage] = useState(null);
    
    const [interactionMode, setInteractionMode] = useState('pan');
    const [roiCoords, setRoiCoords] = useState(null);

    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadDetails, setDownloadDetails] = useState('');

    // --- ACCORDION (AÇILIR MENÜ) DURUMLARI ---
    const [expandedFileId, setExpandedFileId] = useState(null);
    const [fileMasks, setFileMasks] = useState({});
    const [isLoadingMasks, setIsLoadingMasks] = useState({});

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
        setActiveMaskId(null);
        setExpandedFileId(null);
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

    // ==========================================
    // ALT MENÜ AÇMA / KAPATMA (API SERVICE KULLANARAK)
    // ==========================================
    const toggleFileExpand = async (e, fileId) => {
        e.stopPropagation(); 
        if (expandedFileId === fileId) {
            setExpandedFileId(null); 
            return;
        }

        setExpandedFileId(fileId);

        if (!fileMasks[fileId]) {
            setIsLoadingMasks(prev => ({ ...prev, [fileId]: true }));
            try {
                // YENİ: Doğrudan fileService.js içindeki fonksiyonu kullanıyoruz
                const data = await getMasksByFile(fileId);
                setFileMasks(prev => ({ ...prev, [fileId]: data }));
            } catch (err) {
                console.error("Maskeler çekilirken hata:", err);
            } finally {
                setIsLoadingMasks(prev => ({ ...prev, [fileId]: false }));
            }
        }
    };

    // ==========================================
    // SİLME İŞLEMLERİ (API SERVICE KULLANARAK)
    // ==========================================
    const handleDeleteFile = async (e, fileId, filename) => {
        e.stopPropagation();
        if (!window.confirm(`'${filename}' dosyasını ve ona ait tüm maskeleri silmek istediğinize emin misiniz?`)) return;

        try {
            await deleteFile(fileId);
            if (activeFileId === fileId) {
                setMainImage(null); setMaskImage(null);
                setActiveFileId(null); setActiveMaskId(null);
            }
            fetchFiles(selectedPatient.id);
        } catch (error) {
            console.error(error);
            alert("Silme sırasında hata oluştu.");
        }
    };

    const handleDeleteMask = async (e, maskId, fileId) => {
        e.stopPropagation();
        if (!window.confirm(`Bu yapay zeka analizini silmek istediğinize emin misiniz?`)) return;

        try {
            await deleteMask(maskId);
            // Sadece arayüzü güncelle (Komple sayfayı yenilemeye gerek yok)
            setFileMasks(prev => ({
                ...prev,
                [fileId]: prev[fileId].filter(m => m.id !== maskId)
            }));
            
            if (activeMaskId === maskId) {
                setMaskImage(null); setActiveMaskId(null);
            }
        } catch (error) {
            console.error(error);
            alert("Maske silinemedi.");
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
            setActiveMaskId(null);
            setExpandedFileId(null);
            setMainImage({ url: URL.createObjectURL(file), name: file.name }); 
            setMaskImage(null); 
            setRoiCoords(null);
        } catch (error) {
            console.error("Yükleme hatası:", error);
            alert("Dosya yüklenirken bir hata oluştu.");
        } finally {
            setUploading(false);
        }
    };

    // Ana Dosyaya Tıklanınca
    const handleFileClick = (fileRecord) => {
        setActiveFileId(fileRecord.id); 
        setActiveMaskId(null); 
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

    // Alt Maskeye Tıklanınca
    const handleSpecificMaskClick = (fileRecord, maskRecord) => {
        setActiveFileId(fileRecord.id);
        setActiveMaskId(maskRecord.id); 
        setRoiCoords(null);

        const cleanPath = fileRecord.file_path.replace(/\\/g, '/');
        const fullUrl = cleanPath.startsWith('/') ? `${BASE_URL}${cleanPath}` : `${BASE_URL}/${cleanPath}`;
        setMainImage({ url: fullUrl, name: fileRecord.filename });

        const cleanMaskPath = maskRecord.mask_url.replace(/\\/g, '/');
        const fullMaskUrl = cleanMaskPath.startsWith('/') ? `${BASE_URL}${cleanMaskPath}` : `${BASE_URL}/${cleanMaskPath}`;
        setMaskImage(fullMaskUrl);
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
            
            if (selectedPatient) await fetchFiles(selectedPatient.id);
            
            // YENİ: Analiz bitince alt menüyü API SERVICE ile güncelle
            setIsLoadingMasks(prev => ({ ...prev, [activeFileId]: true }));
            try {
                const data = await getMasksByFile(activeFileId);
                setFileMasks(prev => ({ ...prev, [activeFileId]: data }));
                setExpandedFileId(activeFileId);
            } catch(e) { console.error(e); }
            setIsLoadingMasks(prev => ({ ...prev, [activeFileId]: false }));

            setRoiCoords(null); 
        } catch (error) {
            console.error("Segmentasyon hatası:", error);
            alert("Analiz sırasında bir hata oluştu.");
        } finally {
            setIsSegmenting(false);
        }
    };

    const handleDownload = async (url, defaultFilename) => {
        if (!url) return;
        setIsDownloading(true);
        setDownloadProgress(0);
        setDownloadDetails('Sunucuya bağlanıyor...');

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Ağ hatası');

            const contentLength = response.headers.get('content-length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;
            let loaded = 0;

            const reader = response.body.getReader();
            const chunks = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                chunks.push(value);
                loaded += value.length;

                if (total > 0) {
                    const percent = (loaded / total) * 100;
                    setDownloadProgress(percent);
                    const mbLoaded = (loaded / (1024 * 1024)).toFixed(2);
                    const mbTotal = (total / (1024 * 1024)).toFixed(2);
                    setDownloadDetails(`${mbLoaded} MB / ${mbTotal} MB (%${Math.round(percent)})`);
                } else {
                    const mbLoaded = (loaded / (1024 * 1024)).toFixed(2);
                    setDownloadDetails(`${mbLoaded} MB İndirildi...`);
                }
            }

            const blob = new Blob(chunks);
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
            alert("İndirme başarısız.");
        } finally {
            setTimeout(() => {
                setIsDownloading(false);
                setDownloadProgress(0);
                setDownloadDetails('');
            }, 1000);
        }
    };

    const currentActiveFile = patientFiles.find(f => f.id === activeFileId);
    const isActiveFileSegmented = currentActiveFile?.status === 'segmented';

    const totalFiles = patientFiles.length;
    const segmentedFiles = patientFiles.filter(f => f.status === 'segmented').length;
    const pendingFiles = totalFiles - segmentedFiles;
    const aiProgressPercent = totalFiles > 0 ? Math.round((segmentedFiles / totalFiles) * 100) : 0;

    return (
        <div className="dashboard-layout">
            {isDownloading && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{
                        background: '#1e293b', padding: '30px', borderRadius: '12px',
                        width: '400px', textAlign: 'center', border: '1px solid #334155',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                    }}>
                        <Download size={48} color="#60a5fa" style={{ marginBottom: '15px' }} />
                        <h3 style={{ color: 'white', marginBottom: '15px' }}>Dosya İndiriliyor</h3>
                        <div style={{ width: '100%', height: '10px', background: '#334155', borderRadius: '5px', overflow: 'hidden' }}>
                            <div style={{ width: `${downloadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #10b981)', transition: 'width 0.2s ease-out' }}></div>
                        </div>
                        <p style={{ color: '#94a3b8', marginTop: '15px', fontSize: '0.9rem', fontWeight: 'bold' }}>{downloadDetails}</p>
                    </div>
                </div>
            )}

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
                                            <h3 style={{ color: 'white', marginBottom: '5px' }}>{selectedPatient.name} - MR Görüntüleri</h3>
                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ID: {selectedPatient.id}</span>
                                        </div>
                                        <label className="upload-label" style={{ opacity: uploading ? 0.7 : 1 }}>
                                            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} 
                                            {uploading ? 'Yükleniyor...' : 'Yeni MR Yükle'}
                                            <input type="file" hidden accept=".nii,.nii.gz" onChange={handleFileUpload} disabled={uploading} />
                                        </label>
                                    </div>

                                    

                                    {/* DOSYA LİSTESİ VE AKORDEON MENÜ */}
                                    {patientFiles.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px', background: '#0f172a', borderBottom: '1px solid #1e293b' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-start' }}>
                                                {patientFiles.map(f => {
                                                    const isSegmented = f.status === 'segmented';
                                                    const isActive = activeFileId === f.id;
                                                    const isExpanded = expandedFileId === f.id;
                                                    
                                                    return (
                                                        <div key={f.id} style={{ display: 'flex', flexDirection: 'column', width: '280px', background: '#334155', borderRadius: '8px', border: `1px solid ${isActive ? (isSegmented ? '#10b981' : '#3b82f6') : 'transparent'}`, transition: 'all 0.3s ease' }}>
                                                            
                                                            {/* ANA KART */}
                                                            <div style={{ display: 'flex', alignItems: 'stretch' }}>
                                                                <button 
                                                                    onClick={() => handleFileClick(f)}
                                                                    style={{
                                                                        flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', 
                                                                        background: isActive ? '#1e293b' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: '8px 0 0 8px'
                                                                    }}
                                                                >
                                                                    {isSegmented ? <CheckCircle size={20} color="#10b981" /> : <File size={20} color="#94a3b8" />}
                                                                    <div style={{ overflow: 'hidden' }}>
                                                                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                                            {f.filename}
                                                                        </div>
                                                                        <div style={{ fontSize: '0.7rem', color: isSegmented ? '#10b981' : '#94a3b8', marginTop: '2px' }}>
                                                                            {isSegmented ? 'Yapay Zeka Analizli' : 'İşlem Bekliyor'}
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                                
                                                                {/* SİLME BUTONU (ÇÖP KUTUSU) */}
                                                                <button 
                                                                    onClick={(e) => handleDeleteFile(e, f.id, f.filename)}
                                                                    style={{ width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.1)', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                                                    title="Dosyayı Sil"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>

                                                                {/* OK BUTONU (Sadece Segmentli ise çıkar) */}
                                                                {isSegmented && (
                                                                    <button 
                                                                        onClick={(e) => toggleFileExpand(e, f.id)}
                                                                        style={{ width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '0 8px 8px 0', cursor: 'pointer', color: '#94a3b8' }}
                                                                    >
                                                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* AÇILAN ALT MENÜ (MASKELER) */}
                                                            {isExpanded && (
                                                                <div style={{ padding: '8px', background: '#1e293b', borderRadius: '0 0 8px 8px', borderTop: '1px solid #334155' }}>
                                                                    {isLoadingMasks[f.id] ? (
                                                                        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
                                                                            <Loader2 size={18} className="animate-spin" color="#94a3b8" />
                                                                        </div>
                                                                    ) : fileMasks[f.id]?.length > 0 ? (
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                            {fileMasks[f.id].map((mask, idx) => {
                                                                                const isMaskActive = activeMaskId === mask.id;
                                                                                return (
                                                                                    <div key={mask.id} style={{ display: 'flex', alignItems: 'center', background: isMaskActive ? '#3b82f6' : '#334155', borderRadius: '6px' }}>
                                                                                        <button
                                                                                            onClick={() => handleSpecificMaskClick(f, mask)}
                                                                                            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.75rem', textAlign: 'left' }}
                                                                                        >
                                                                                            <CornerDownRight size={14} color={isMaskActive ? 'white' : '#94a3b8'} />
                                                                                            <div style={{ flex: 1 }}>
                                                                                                <strong>Analiz {fileMasks[f.id].length - idx}</strong>
                                                                                                <div style={{ fontSize: '0.65rem', color: isMaskActive ? '#e2e8f0' : '#94a3b8' }}>
                                                                                                    {new Date(mask.created_at).toLocaleDateString('tr-TR')}
                                                                                                </div>
                                                                                            </div>
                                                                                        </button>
                                                                                        
                                                                                        {/* MASKEYE ÖZEL SİLME BUTONU */}
                                                                                        <button 
                                                                                            onClick={(e) => handleDeleteMask(e, mask.id, f.id)}
                                                                                            style={{ padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#f87171' }}
                                                                                            title="Bu Analizi Sil"
                                                                                        >
                                                                                            <Trash2 size={14} />
                                                                                        </button>
                                                                                    </div>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                    ) : (
                                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', padding: '5px' }}>
                                                                            Kayıtlı maske bulunamadı.
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
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
                                                    <button className={`view-btn ${interactionMode === 'pan' ? 'active' : ''}`} onClick={() => setInteractionMode('pan')} title="Yakınlaştır ve Gezin"><Move size={14} /> El</button>
                                                    <button className={`view-btn ${interactionMode === 'select' ? 'active' : ''}`} onClick={() => setInteractionMode('select')} title="Sağ Tıkla Bölge Seç"><Square size={14} /> Seçim</button>
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
                                                <button onClick={() => handleDownload(mainImage.url, mainImage.name)} className="view-btn" title="Orijinal Görüntüyü İndir" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#334155', padding: '8px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white' }}>
                                                    <Download size={16} /> <span style={{fontSize: '0.8rem', fontWeight: 'bold'}}>Orijinal</span>
                                                </button>

                                                {maskImage && (
                                                    <button onClick={() => handleDownload(maskImage, `maske_${mainImage.name}`)} className="view-btn" title="Üretilen Maskeyi İndir" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#334155', padding: '8px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#10b981' }}>
                                                        <Download size={16} /> <span style={{fontSize: '0.8rem', fontWeight: 'bold'}}>Maske</span>
                                                    </button>
                                                )}

                                                <div style={{ width: '1px', height: '30px', background: '#334155', margin: '0 5px' }}></div>

                                                {roiCoords && <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 'bold' }}>✔ BÖLGE SEÇİLDİ</span>}
                                                <button 
                                                    onClick={handleSegmentClick} disabled={isSegmenting} className="segment-btn"
                                                    style={{
                                                        background: isSegmenting ? '#475569' : (isActiveFileSegmented ? 'linear-gradient(90deg, #3b82f6, #2563eb)' : 'linear-gradient(90deg, #10b981, #059669)'),
                                                        color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: isSegmenting ? 'not-allowed' : 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', transition: '0.3s'
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