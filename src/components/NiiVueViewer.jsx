import React, { useEffect, useRef, useState } from 'react';
import { Niivue } from '@niivue/niivue';
import { Loader2 } from 'lucide-react';

const NiiVueViewer = ({ mainImage, maskImage }) => {
    // Uygulamanın 3 farklı durumu var: 'idle' (beklemede), 'downloading' (indiriyor), 'ready' (çizime hazır)
    const [appState, setAppState] = useState('idle');
    const [localVolumes, setLocalVolumes] = useState([]); // RAM'e alınan dosyalar
    const [viewMode, setViewMode] = useState('multiplanar'); // Görünüm Modu State'ini buraya aldık
    const nvRef = useRef(null);

    // ====================================================================
    // 1. AŞAMA: ARKAPLANDA RAHAT RAHAT İNDİRME İŞLEMİ
    // ====================================================================
    useEffect(() => {
        if (!mainImage) return;

        const downloadDataInBg = async () => {
            setAppState('downloading'); // Yükleme ekranını tetikle

            try {
                const mainUrl = typeof mainImage === 'string' ? mainImage : mainImage.url;
                const mainName = typeof mainImage === 'string' ? 'image.nii.gz' : mainImage.name;

                // Dosya zaten yerel (blob) ise fetch yapma, direkt kullan
                let finalMainUrl = mainUrl;
                if (!mainUrl.startsWith('blob:')) {
                     const mainResponse = await fetch(mainUrl);
                     if (!mainResponse.ok) throw new Error("Ana MR dosyası indirilemedi");
                     const mainBlob = await mainResponse.blob();
                     finalMainUrl = URL.createObjectURL(mainBlob);
                }

                const volumesToLoad = [{
                    url: finalMainUrl, 
                    name: mainName,
                    colorMap: 'gray'
                }];

                // Maske (tümör) dosyası varsa onu da indir
                if (maskImage) {
                    const maskUrl = typeof maskImage === 'string' ? maskImage : maskImage.url;
                    const maskName = typeof maskImage === 'string' ? 'mask.nii.gz' : maskImage.name;

                    if (!maskUrl.startsWith('blob:')) {
                        const maskResponse = await fetch(maskUrl);
                        if (maskResponse.ok) {
                            const maskBlob = await maskResponse.blob();
                            volumesToLoad.push({
                                url: URL.createObjectURL(maskBlob),
                                name: maskName,
                                colorMap: 'red',
                                opacity: 0.5
                            });
                        }
                    } else {
                         volumesToLoad.push({ url: maskUrl, name: maskName, colorMap: 'red', opacity: 0.5 });
                    }
                }

                setLocalVolumes(volumesToLoad);
                setAppState('ready');

            } catch (error) {
                console.error("Arkaplan İndirme Hatası:", error);
                setAppState('error');
            }
        };

        downloadDataInBg();

        return () => {
            if (nvRef.current) nvRef.current.volumes = [];
        }
    }, [mainImage, maskImage]);

    // ====================================================================
    // 2. AŞAMA: VERİLER HAZIR OLDUĞUNDA 3D MOTORU ÇALIŞTIRMA
    // ====================================================================
    useEffect(() => {
        if (appState !== 'ready' || localVolumes.length === 0) return;

        const timer = setTimeout(async () => {
            if (!nvRef.current) {
                nvRef.current = new Niivue({
                    logging: false,
                    isSliceScroll: true,
                    backColor: [0, 0, 0, 1] // Siyah arka plan
                });
                nvRef.current.attachTo('niivue-solid-canvas'); 
            }

            try {
                await nvRef.current.loadVolumes(localVolumes);

                const modeMap = {
                    'axial': nvRef.current.sliceTypeAxial,
                    'coronal': nvRef.current.sliceTypeCoronal,
                    'sagittal': nvRef.current.sliceTypeSagittal,
                    'multiplanar': nvRef.current.sliceTypeMultiplanar,
                    '3d': nvRef.current.sliceTypeRender
                };
                nvRef.current.setSliceType(modeMap[viewMode] || nvRef.current.sliceTypeMultiplanar);

            } catch (err) {
                console.error("Motor Çizim Hatası:", err);
            }
        }, 100);

        return () => clearTimeout(timer);

    }, [appState, localVolumes]);

    // ====================================================================
    // 3. AŞAMA: GÖRÜNÜM BUTONLARI (SADECE KAMERA AÇISINI DEĞİŞTİRİR)
    // ====================================================================
    useEffect(() => {
        if (appState !== 'ready' || !nvRef.current || nvRef.current.volumes.length === 0) return;

        const modeMap = {
            'axial': nvRef.current.sliceTypeAxial,
            'coronal': nvRef.current.sliceTypeCoronal,
            'sagittal': nvRef.current.sliceTypeSagittal,
            'multiplanar': nvRef.current.sliceTypeMultiplanar,
            '3d': nvRef.current.sliceTypeRender
        };
        nvRef.current.setSliceType(modeMap[viewMode] || nvRef.current.sliceTypeMultiplanar);
    }, [viewMode, appState]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
            
            {/* GÖRÜNTÜLEYİCİ ALANI (ÜST KISIM) */}
            <div style={{ position: 'relative', flex: 1, minHeight: '450px', background: '#000' }}>
                
                {appState === 'downloading' && (
                    <div className="loading-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.95)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10, borderRadius: '8px' }}>
                        <Loader2 size={56} className="animate-spin" color="#3b82f6" />
                        <h3 style={{ marginTop: '20px', color: 'white', letterSpacing: '1px' }}>MR Verisi İndiriliyor...</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '8px' }}>Lütfen bekleyin, 17MB veri tarayıcı hafızasına işleniyor.</p>
                    </div>
                )}

                {appState === 'error' && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#f87171', zIndex: 10 }}>
                        <h3>Görüntü indirilirken bir hata oluştu. Lütfen bağlantınızı kontrol edin.</h3>
                    </div>
                )}

                <canvas
                    id="niivue-solid-canvas"
                    style={{
                        width: '100%',
                        height: '100%',
                        display: appState === 'ready' ? 'block' : 'none', 
                        outline: 'none'
                    }}
                />
            </div>

            {/* ALT KONTROL PANELİ (SENİN TASARIMIN) */}
            <div className="viewer-controls">
                <span className="control-label">Görünüm Modu:</span>
                <div className="btn-group">
                    <button className={`view-btn ${viewMode === 'multiplanar' ? 'active' : ''}`} onClick={() => setViewMode('multiplanar')}>Çoklu-Plan</button>
                    <button className={`view-btn ${viewMode === '3d' ? 'active' : ''}`} onClick={() => setViewMode('3d')}>3D Model</button>
                </div>
                
                <span className="control-label" style={{ marginLeft: '15px' }}>Tekli Kesitler:</span>
                <div className="btn-group">
                    <button className={`view-btn ${viewMode === 'axial' ? 'active' : ''}`} onClick={() => setViewMode('axial')}>Axial (Üst)</button>
                    <button className={`view-btn ${viewMode === 'coronal' ? 'active' : ''}`} onClick={() => setViewMode('coronal')}>Coronal (Ön)</button>
                    <button className={`view-btn ${viewMode === 'sagittal' ? 'active' : ''}`} onClick={() => setViewMode('sagittal')}>Sagittal (Yan)</button>
                </div>
                
                <div className="scroll-hint">
                    Kesitleri gezmek için fare tekerleğini (scroll) kullanın.
                </div>
            </div>

        </div>
    );
};

export default NiiVueViewer;