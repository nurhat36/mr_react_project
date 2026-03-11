import React, { useState } from 'react';
import NiiVueViewer from '../components/NiiVueViewer';
import { Upload, Activity, Database, LogOut, User as UserIcon } from 'lucide-react';

const MainDashboard = ({ user, onLogout }) => {
    const [mainImage, setMainImage] = useState(null);
    const [maskImage, setMaskImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMainImage(URL.createObjectURL(file));
        }
    };

    return (
       // MainDashboard.jsx içindeki yapıyı bu şekildeClassName'lerle güncelle
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
                        <div className="viewer-card">
                            <div className="card-top">
                                <h3>3D Görüntüleyici</h3>
                                <label className="upload-label">
                                    <Upload size={16} /> Veri Yükle
                                    <input type="file" hidden onChange={handleFileChange} />
                                </label>
                            </div>
                            <div className="canvas-wrapper">
                                {mainImage ? (
                                    <NiiVueViewer mainImage={mainImage} maskImage={maskImage} />
                                ) : (
                                    <div className="empty-state">
                                        <Database size={48} />
                                        <p>Görüntülemek için .nii veya .nii.gz dosyası sürükleyin</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default MainDashboard;