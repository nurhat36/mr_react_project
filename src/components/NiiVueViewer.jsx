import React, { useEffect, useRef, useState } from 'react';
import { Niivue } from '@niivue/niivue';
import { Loader2 } from 'lucide-react';

const NiiVueViewer = ({ mainImage, maskImage, viewMode, interactionMode = 'pan' }) => {
    const [appState, setAppState] = useState('idle');
    const [localVolumes, setLocalVolumes] = useState([]); 
    const nvRef = useRef(null);

    // ====================================================================
    // 1. AŞAMA: ETKİLEŞİM MODU (EL VS SEÇİM) GÜNCELLEME
    // ====================================================================
    useEffect(() => {
        if (!nvRef.current) return;

        if (interactionMode === 'select') {
            // SEÇİM MODU: Sağ tıkla sarı kutu çizilir
            nvRef.current.setDragMode(nvRef.current.dragModes.slicer3D);
            nvRef.current.opts.isRightClickDragPan = false; // Yakınlaştırmayı sağ tıktan ayır
        } else {
            // PAN/ZOOM MODU: Sağ tıkla yakınlaştırma yapılır
            nvRef.current.setDragMode(nvRef.current.dragModes.pan);
            nvRef.current.opts.isRightClickDragPan = true;
        }
    }, [interactionMode]);

    // ====================================================================
    // 2. AŞAMA: DOSYALARI RAM'E İNDİRME
    // ====================================================================
    useEffect(() => {
        if (!mainImage) return;

        const downloadDataInBg = async () => {
            setAppState('downloading');
            try {
                const mainUrl = typeof mainImage === 'string' ? mainImage : mainImage.url;
                const mainName = typeof mainImage === 'string' ? 'image.nii.gz' : mainImage.name;

                let finalMainUrl = mainUrl;
                if (!mainUrl.startsWith('blob:')) {
                     const mainResponse = await fetch(mainUrl);
                     if (!mainResponse.ok) throw new Error("Dosya indirilemedi");
                     const mainBlob = await mainResponse.blob();
                     finalMainUrl = URL.createObjectURL(mainBlob);
                }

                const volumesToLoad = [{ url: finalMainUrl, name: mainName, colorMap: 'gray' }];

                if (maskImage) {
                    const maskUrl = typeof maskImage === 'string' ? maskImage : maskImage.url;
                    let finalMaskUrl = maskUrl;
                    if (!maskUrl.startsWith('blob:')) {
                        const maskRes = await fetch(maskUrl);
                        if (maskRes.ok) finalMaskUrl = URL.createObjectURL(await maskRes.blob());
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

                // Seçim yapıldığında koordinatları ilet
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
                
                // İlk yüklemede modu ayarla
                applyViewMode();
                
                // Seçim modunu tekrar zorla
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

    // Görünüm değiştiğinde sadece açıyı değiştir
    useEffect(() => {
        applyViewMode();
    }, [viewMode]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
            {appState === 'downloading' && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.95)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
                    <Loader2 size={56} className="animate-spin" color="#3b82f6" />
                    <h3 style={{ marginTop: '20px', color: 'white' }}>Veri Hazırlanıyor...</h3>
                </div>
            )}
            <canvas id="niivue-solid-canvas" style={{ width: '100%', height: '100%', outline: 'none' }} />
        </div>
    );
};

export default NiiVueViewer;