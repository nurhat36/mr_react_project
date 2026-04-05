import React, { useEffect, useRef, useState } from 'react';
import { Niivue } from '@niivue/niivue';
import { Loader2 } from 'lucide-react';

const NiiVueViewer = ({ mainImage, maskImage, viewMode, interactionMode = 'pan' }) => {
    const [appState, setAppState] = useState('idle');
    const [localVolumes, setLocalVolumes] = useState([]); 
    
    // YENİ: İndirme detaylarını tutacak state'ler
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadDetails, setDownloadDetails] = useState('');
    
    const nvRef = useRef(null);

    // ====================================================================
    // 1. AŞAMA: ETKİLEŞİM MODU (EL VS SEÇİM) GÜNCELLEME
    // ====================================================================
    useEffect(() => {
        if (!nvRef.current) return;

        if (interactionMode === 'select') {
            nvRef.current.setDragMode(nvRef.current.dragModes.slicer3D);
            nvRef.current.opts.isRightClickDragPan = false;
        } else {
            nvRef.current.setDragMode(nvRef.current.dragModes.pan);
            nvRef.current.opts.isRightClickDragPan = true;
        }
    }, [interactionMode]);

    // ====================================================================
    // YENİ: STREAM (AKIŞ) OKUYUCU FONKSİYON (MB ve Yüzde Hesaplar)
    // ====================================================================
    const fetchWithProgress = async (url, fileLabel) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`${fileLabel} indirilemedi.`);

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
                setDownloadDetails(`${fileLabel}: ${mbLoaded} MB / ${mbTotal} MB (%${Math.round(percent)})`);
            } else {
                const mbLoaded = (loaded / (1024 * 1024)).toFixed(2);
                setDownloadDetails(`${fileLabel}: ${mbLoaded} MB İndirildi...`);
            }
        }

        const blob = new Blob(chunks);
        return URL.createObjectURL(blob);
    };

    // ====================================================================
    // 2. AŞAMA: DOSYALARI RAM'E İNDİRME
    // ====================================================================
    useEffect(() => {
        if (!mainImage) return;

        const downloadDataInBg = async () => {
            setAppState('downloading');
            setDownloadProgress(0);
            setDownloadDetails('Bağlanıyor...');

            try {
                const mainUrl = typeof mainImage === 'string' ? mainImage : mainImage.url;
                const mainName = typeof mainImage === 'string' ? 'image.nii.gz' : mainImage.name;

                let finalMainUrl = mainUrl;
                // Blob değilse (yani sunucudansa) ilerleme çubuklu fonksiyonla indir
                if (!mainUrl.startsWith('blob:')) {
                     finalMainUrl = await fetchWithProgress(mainUrl, 'Ana Görüntü');
                }

                const volumesToLoad = [{ url: finalMainUrl, name: mainName, colorMap: 'gray' }];

                if (maskImage) {
                    const maskUrl = typeof maskImage === 'string' ? maskImage : maskImage.url;
                    let finalMaskUrl = maskUrl;
                    if (!maskUrl.startsWith('blob:')) {
                        // Eğer maske varsa onu da ilerleme çubuğuyla indir
                        setDownloadProgress(0); // Maske için barı sıfırla
                        finalMaskUrl = await fetchWithProgress(maskUrl, 'AI Maskesi');
                    }
                    volumesToLoad.push({ url: finalMaskUrl, name: 'mask.nii.gz', colorMap: 'red', opacity: 0.5 });
                }

                setLocalVolumes(volumesToLoad);
                setAppState('ready');
            } catch (error) {
                console.error("İndirme Hatası:", error);
                setAppState('error');
            }
        };
        downloadDataInBg();
    }, [mainImage, maskImage]);

    // ====================================================================
    // 3. AŞAMA: MOTORU BAŞLATMA VE SEÇİM DİNLEME
    // ====================================================================
    useEffect(() => {
        if (appState !== 'ready' || localVolumes.length === 0) return;

        const timer = setTimeout(async () => {
            if (!nvRef.current) {
                nvRef.current = new Niivue({
                    logging: false,
                    isSliceScroll: true,
                    backColor: [0, 0, 0, 1]
                });

                nvRef.current.onLocationChange = (data) => {
                    if (data.vox && window.onROISelected) {
                        window.onROISelected({
                            x: Math.round(data.vox[0]),
                            y: Math.round(data.vox[1]),
                            z: Math.round(data.vox[2])
                        });
                    }
                };

                nvRef.current.attachTo('niivue-solid-canvas'); 
            }

            try {
                nvRef.current.volumes = [];
                await nvRef.current.loadVolumes(localVolumes);
                
                applyViewMode();
                
                if (interactionMode === 'select') {
                    nvRef.current.setDragMode(nvRef.current.dragModes.slicer3D);
                }
            } catch (err) {
                console.error("WebGL Hatası:", err);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [appState, localVolumes]);

    const applyViewMode = () => {
        if (!nvRef.current) return;
        const modeMap = {
            'axial': nvRef.current.sliceTypeAxial,
            'coronal': nvRef.current.sliceTypeCoronal,
            'sagittal': nvRef.current.sliceTypeSagittal,
            'multiplanar': nvRef.current.sliceTypeMultiplanar,
            '3d': nvRef.current.sliceTypeRender
        };
        nvRef.current.setSliceType(modeMap[viewMode] || nvRef.current.sliceTypeMultiplanar);
    };

    useEffect(() => {
        applyViewMode();
    }, [viewMode]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
            {appState === 'downloading' && (
                <div style={{ 
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                    background: 'rgba(15,23,42,0.95)', display: 'flex', flexDirection: 'column', 
                    justifyContent: 'center', alignItems: 'center', zIndex: 10 
                }}>
                    <Loader2 size={56} className="animate-spin" color="#3b82f6" style={{ marginBottom: '20px' }} />
                    <h3 style={{ color: 'white', marginBottom: '20px' }}>Veri Hazırlanıyor...</h3>
                    
                    {/* YENİ: İlerleme Çubuğu (Progress Bar) */}
                    <div style={{ width: '60%', maxWidth: '400px' }}>
                        <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${downloadProgress}%`, height: '100%',
                                background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                                transition: 'width 0.1s ease-out'
                            }}></div>
                        </div>
                        <p style={{ color: '#94a3b8', marginTop: '10px', fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold' }}>
                            {downloadDetails}
                        </p>
                    </div>
                </div>
            )}
            <canvas id="niivue-solid-canvas" style={{ width: '100%', height: '100%', outline: 'none' }} />
        </div>
    );
};

export default NiiVueViewer;