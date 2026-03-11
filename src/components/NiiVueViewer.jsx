import React, { useEffect, useRef } from 'react';
import { Niivue } from '@niivue/niivue';

const NiiVueViewer = ({ mainImage, maskImage }) => {
  const canvas = useRef();

  useEffect(() => {
    const nv = new Niivue({
      backColor: [0, 0, 0, 1],
      show3DCrosshair: true,
      loadingText: 'MR Görüntüsü Yükleniyor...',
    });

    nv.attachToCanvas(canvas.current);
    
    const volumes = [];
    
    // Ana MR Görüntüsü
    if (mainImage) {
      volumes.push({ url: mainImage, colorMap: 'gray', opacity: 1, visible: true });
    }
    
    // AI'dan gelen Segmentasyon Maskesi (Varsa)
    if (maskImage) {
      volumes.push({ url: maskImage, colorMap: 'red', opacity: 0.6, visible: true });
    }

    if (volumes.length > 0) {
      nv.loadVolumes(volumes);
    }
  }, [mainImage, maskImage]);

  return (
    <div className="viewer-container">
      <canvas ref={canvas} style={{ width: '100%', height: '500px', borderRadius: '8px' }} />
    </div>
  );
};

export default NiiVueViewer;