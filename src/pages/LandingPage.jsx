// src/pages/LandingPage.jsx
import React from 'react';
import '../styles/LandingPage.css';
import { useNavigate } from 'react-router-dom';
// Temiz dosya adıyla import et (Yolun kendi klasör yapına uygun olduğundan emin ol)
import logo from '../assets/logo.svg';
import { 
  Brain, Activity, Monitor, UploadCloud, 
  Cpu, Layers, ShieldCheck, ArrowRight, CheckCircle2 
} from 'lucide-react';

function LandingPage({ onLoginClick, onRegisterClick }) {
    const navigate = useNavigate();
  return (
    <div className="landing-container">
      {/* 1. Üst Menü (Navbar) */}
      <header className="navbar">
       <div className="logo">
        <div className="logo-icon-bg">
            <img src={logo} alt="OncoVisionAI Logo" width="32" height="32" />
        </div>
        <span>OncoVisionAI</span>
        </div>
        <div className="nav-buttons">
          <button onClick={() => navigate('/login')} className="btn-login">Giriş Yap</button>
          <button onClick={() => navigate('/register')} className="btn-register">Kayıt Ol</button>
        </div>
      </header>

      {/* 2. Ana Tanıtım Alanı (Hero Section - İki Kolonlu Tasarım) */}
      <main className="hero-section">
        <div className="hero-content">
          <div className="badge">🚀 Yeni Nesil Medikal Görüntüleme</div>
          <h1>Nörolojik Görüntülemede <br/><span className="highlight">Yapay Zeka Devrimi</span></h1>
          <p>
            Gelişmiş derin öğrenme algoritmalarıyla beyin MR (T1, T2, FLAIR) görüntülerini otomatik olarak analiz edin. 
            Tümör ve doku segmentasyon işlemlerini klinik düzeyde hassasiyetle, dakikalar yerine saniyeler içinde tamamlayın.
          </p>
          <div className="hero-actions">
            <button onClick={onRegisterClick} className="btn-cta">
              Platformu Deneyin <ArrowRight size={20} />
            </button>
            <button onClick={onLoginClick} className="btn-secondary">
              Daha Fazla Bilgi
            </button>
          </div>
          <div className="hero-trust">
            <span className="trust-item"><CheckCircle2 size={16} color="#16a34a"/> %98.5 Segmentasyon Başarısı</span>
            <span className="trust-item"><CheckCircle2 size={16} color="#16a34a"/> DICOM ve NIfTI Format Desteği</span>
          </div>
        </div>
        
        {/* Sağ Taraftaki Görsel Alanı (Gelecekte buraya projenin bir ekran görüntüsünü koyabilirsin) */}
        <div className="hero-visual">
          <div className="visual-card main-card">
            <div className="scan-line"></div>
            <Brain size={120} color="#2563EB" strokeWidth={1} className="floating-brain" />
            <div className="data-box data-1">AI Analizi Sürüyor...</div>
            <div className="data-box data-2">Tümör Sınırları Tespit Edildi</div>
          </div>
        </div>
      </main>

      {/* 3. Nasıl Çalışır Alanı (Adım Adım) */}
      <section className="how-it-works">
        <h2>Sistem Nasıl Çalışır?</h2>
        <p className="section-subtitle">Sadece üç basit adımla analiz sonuçlarınıza ulaşın.</p>
        
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <UploadCloud size={36} className="step-icon" />
            <h3>Görüntüyü Yükle</h3>
            <p>Hastaya ait MR taramalarını (NIfTI formatında) güvenli sisteme yükleyin.</p>
          </div>
          <div className="step-connector"></div>
          <div className="step-card">
            <div className="step-number">2</div>
            <Cpu size={36} className="step-icon" />
            <h3>AI İşleme & Analiz</h3>
            <p>Modelimiz, milimetrik pikselleri tarayarak anomalileri ve dokuları ayrıştırır.</p>
          </div>
          <div className="step-connector"></div>
          <div className="step-card">
            <div className="step-number">3</div>
            <Layers size={36} className="step-icon" />
            <h3>3D Sonuç ve Çıktı</h3>
            <p>Segmentasyon maskelerini detaylı olarak inceleyin ve rapor olarak indirin.</p>
          </div>
        </div>
      </section>

      {/* 4. Detaylı Özellikler Alanı */}
      <section className="features-section">
        <h2>Neden OncoVisionAI?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <Activity size={32} className="feature-icon" />
            <h3>Hızlı Görüntü İşleme</h3>
            <p>Manuel olarak saatler süren tümör ve doku işaretleme işlemleri, özel donanım hızlandırıcımız ile saniyeler içinde tamamlanır.</p>
          </div>
          <div className="feature-card">
            <ShieldCheck size={32} className="feature-icon" />
            <h3>Yüksek Güvenilirlik</h3>
            <p>Binlerce klinik veri ile eğitilmiş modelimiz, hekim kararlarını destekleyici ve ikinci bir görüş niteliğinde sonuçlar üretir.</p>
          </div>
          <div className="feature-card">
            <Monitor size={32} className="feature-icon" />
            <h3>Modern Arayüz (UI)</h3>
            <p>Doktorlar ve radyologlar için tasarlanmış temiz arayüz sayesinde teknik bilgi gerekmeden rahatça kullanım imkanı.</p>
          </div>
        </div>
      </section>

      {/* 5. Alt Bilgi (Footer) */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <Brain size={20} color="#2563EB" /> 
            <span>OncoVisionAI</span>
          </div>
          <p>© 2024 MR SegAI Platformu. Tüm Hakları Saklıdır.</p>
          <div className="footer-links">
            <span>Gizlilik Politikası</span>
            <span>Kullanım Koşulları</span>
            <span>İletişim</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;