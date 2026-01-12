
import React, { useRef, useEffect, useState } from 'react';
import { tencentService } from '../services/tencentService';
import { 
    tencentEffectService, 
    TE_ICONS, 
    EFFECT_CATEGORIES, 
    TE_DATA, 
    EffectType 
} from '../services/tencentEffectService';

interface CreateProps {
    onClose?: () => void;
}

const Create: React.FC<CreateProps> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // App State
  const [mode, setMode] = useState<'POST' | 'LIVE' | 'GAME' | 'ECOMMERCE'>('POST');
  const [isRecording, setIsRecording] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  // TRTC Effect Panel State
  const [showPanel, setShowPanel] = useState(false);
  const [activeCategory, setActiveCategory] = useState<EffectType>('beauty');
  const [activeItem, setActiveItem] = useState<string>(TE_DATA.beauty[0].id);
  const [isComparing, setIsComparing] = useState(false); // Press & Hold

  // Parameters State
  const [params, setParams] = useState({
      beauty: { ...TE_DATA.beauty.reduce((acc, item) => ({...acc, [item.id]: item.value}), {}) },
      reshape: { ...TE_DATA.reshape.reduce((acc, item) => ({...acc, [item.id]: item.value}), {}) },
      filter: { id: 'origin', style: '' },
      makeup: { id: 'none', color: '' },
      sticker: { id: 'none', emoji: '' },
  });

  // --- CAMERA INIT ---
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        if (stream) { (stream as MediaStream).getTracks().forEach(t => t.stop()); }
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: facingMode, width: 1280, height: 720 }, 
            audio: true 
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
        await tencentEffectService.init();
      } catch (err) { console.error("Camera Error:", err); }
    };
    startCamera();
    return () => { if (stream) (stream as MediaStream).getTracks().forEach(t => t.stop()); }
  }, [facingMode]);

  // --- HANDLERS ---
  const toggleCamera = () => setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  
  const handleCapture = () => {
     setIsRecording(!isRecording);
     if (!isRecording) setTimeout(() => setIsRecording(false), 1000);
  };

  const handleValueChange = (val: number) => {
      if (activeCategory === 'beauty') {
          setParams(p => ({ ...p, beauty: { ...p.beauty, [activeItem]: val } }));
      } else if (activeCategory === 'reshape') {
          setParams(p => ({ ...p, reshape: { ...p.reshape, [activeItem]: val } }));
      }
  };

  const handleItemSelect = (item: any) => {
      setActiveItem(item.id);
      if (activeCategory === 'filter') setParams(p => ({ ...p, filter: { id: item.id, style: item.filterStyle } }));
      if (activeCategory === 'makeup') setParams(p => ({ ...p, makeup: { id: item.id, color: item.color } }));
      if (activeCategory === 'sticker') setParams(p => ({ ...p, sticker: { id: item.id, emoji: item.emoji } }));
  };

  const handleReset = () => {
      setParams({
        beauty: { ...TE_DATA.beauty.reduce((acc, item) => ({...acc, [item.id]: item.defaultValue}), {}) },
        reshape: { ...TE_DATA.reshape.reduce((acc, item) => ({...acc, [item.id]: item.defaultValue}), {}) },
        filter: { id: 'origin', style: '' },
        makeup: { id: 'none', color: '' },
        sticker: { id: 'none', emoji: '' },
      });
  };

  // --- COMPUTED STYLES FOR SIMULATION ---
  const getCurrentValue = () => {
      if (activeCategory === 'beauty') return (params.beauty as any)[activeItem];
      if (activeCategory === 'reshape') return (params.reshape as any)[activeItem];
      return 0;
  };

  const computedStyle = {
      filter: isComparing ? '' : tencentEffectService.getSimulationStyle(params.filter.style, params.beauty),
      transform: (facingMode === 'user' ? 'scaleX(-1) ' : '') + 
                 (!isComparing && (params.reshape as any).slimFace > 0 ? `scaleY(${1 + (params.reshape as any).slimFace * 0.001})` : '')
  };

  return (
    <div className="h-full w-full bg-black relative overflow-hidden font-sans select-none">
      
      {/* 1. CAMERA LAYER */}
      <div className="absolute inset-0 z-0">
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={computedStyle} />
          
          {/* AR OVERLAY SIMULATION */}
          {!isComparing && (
            <div className="absolute inset-0 pointer-events-none">
                {params.makeup.id !== 'none' && <div className="absolute inset-0 mix-blend-overlay" style={{ backgroundColor: params.makeup.color }}></div>}
                {params.sticker.id !== 'none' && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10rem] animate-pulse">{params.sticker.emoji}</div>}
            </div>
          )}
      </div>

      {/* 2. TOP CONTROLS */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-safe flex justify-between z-20 pointer-events-none">
          <button onClick={onClose} className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white pointer-events-auto active:scale-95">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <button onClick={toggleCamera} className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white pointer-events-auto active:scale-95">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          </button>
      </div>

      {/* 3. MAIN UI (When Panel is CLOSED) */}
      {!showPanel && (
        <div className="absolute bottom-0 w-full pb-safe z-30 flex flex-col items-center bg-gradient-to-t from-black/80 to-transparent pt-20">
            {/* Mode Switcher */}
            <div className="flex gap-6 mb-8 text-sm font-bold text-gray-300">
                {['POST', 'LIVE', 'GAME'].map(m => (
                    <span key={m} onClick={() => setMode(m as any)} className={`${mode === m ? 'text-white border-b-2 border-white' : ''} pb-1 cursor-pointer`}>{m}</span>
                ))}
            </div>

            <div className="flex items-center justify-around w-full px-10 mb-8">
                 <button onClick={() => setShowPanel(true)} className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
                     <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/50 backdrop-blur-md flex items-center justify-center text-white">
                         <svg className="w-6 h-6" viewBox="0 0 24 24" dangerouslySetInnerHTML={{__html: TE_ICONS.cat_beauty}}></svg>
                     </div>
                     <span className="text-[10px] text-white font-medium">Beauty</span>
                 </button>

                 <button onClick={handleCapture} className={`w-20 h-20 rounded-full border-[5px] border-white/40 flex items-center justify-center transition-all ${isRecording ? 'scale-110' : ''}`}>
                     <div className={`transition-all duration-300 ${mode === 'LIVE' ? 'bg-red-500' : 'bg-white'} ${isRecording ? 'w-8 h-8 rounded' : 'w-16 h-16 rounded-full'}`}></div>
                 </button>

                 <div className="w-10 h-10"></div> {/* Spacer for symmetry */}
            </div>
        </div>
      )}

      {/* 4. TRTC DEMO PANEL (When Panel is OPEN) */}
      {showPanel && (
        <div className="absolute inset-x-0 bottom-0 z-40 bg-[#000000]/90 backdrop-blur-xl rounded-t-2xl animate-slide-up flex flex-col safe-area-bottom">
            
            {/* PANEL HEADER: Compare & Reset */}
            <div className="flex justify-between items-center px-4 h-12 border-b border-gray-800/50">
                 {/* Compare (Left) - Touch Down Logic */}
                 <button 
                    className={`p-2 transition-colors ${isComparing ? 'text-cyan-400' : 'text-gray-400'}`}
                    onMouseDown={() => setIsComparing(true)} onMouseUp={() => setIsComparing(false)}
                    onTouchStart={() => setIsComparing(true)} onTouchEnd={() => setIsComparing(false)}
                 >
                     <svg className="w-6 h-6" viewBox="0 0 24 24" dangerouslySetInnerHTML={{__html: TE_ICONS.compare}}></svg>
                 </button>

                 {/* Reset (Right) */}
                 <button onClick={handleReset} className="p-2 text-gray-400 active:text-white">
                     <svg className="w-6 h-6" viewBox="0 0 24 24" dangerouslySetInnerHTML={{__html: TE_ICONS.reset}}></svg>
                 </button>
            </div>

            {/* SLIDER SECTION (Only for Beauty/Reshape) */}
            <div className="h-16 flex items-center px-6 justify-center">
                {(activeCategory === 'beauty' || activeCategory === 'reshape') && (
                    <div className="w-full flex items-center gap-4">
                        <span className="text-white text-xs font-mono w-6">{getCurrentValue()}</span>
                        <input 
                            type="range" 
                            min="0" max="100" 
                            value={getCurrentValue()} 
                            onChange={(e) => handleValueChange(Number(e.target.value))}
                            className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>
                )}
            </div>

            {/* ITEMS LIST (Scrollable) */}
            <div className="flex-1 overflow-x-auto no-scrollbar py-2">
                <div className="flex px-4 gap-2">
                    {/* Dynamic Items based on Category */}
                    {(TE_DATA[activeCategory] || []).map((item: any) => (
                        <button 
                            key={item.id} 
                            onClick={() => handleItemSelect(item)}
                            className={`flex-shrink-0 flex flex-col items-center gap-2 w-[72px]`}
                        >
                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2 
                                ${activeItem === item.id ? 'border-cyan-500 text-cyan-500 bg-white/10' : 'border-transparent text-gray-400 bg-white/5'}`}>
                                 {/* Render Icon or Color Block or Image */}
                                 {activeCategory === 'filter' ? (
                                     <div className="w-full h-full rounded-[10px]" style={{ background: item.id === 'origin' ? '#333' : 'linear-gradient(45deg, #f3ec78, #af4261)', filter: item.filterStyle }}></div>
                                 ) : (
                                     <svg className="w-7 h-7" viewBox="0 0 24 24" dangerouslySetInnerHTML={{__html: TE_ICONS[item.icon] || TE_ICONS.none}}></svg>
                                 )}
                             </div>
                             <span className={`text-[10px] ${activeItem === item.id ? 'text-cyan-500 font-bold' : 'text-gray-500'}`}>{item.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* BOTTOM TABS (Categories) */}
            <div className="h-14 border-t border-white/10 flex items-center bg-black/50">
                <div className="flex w-full overflow-x-auto no-scrollbar px-2">
                    {EFFECT_CATEGORIES.map(cat => (
                        <button 
                            key={cat.id} 
                            onClick={() => { setActiveCategory(cat.id); setActiveItem(TE_DATA[cat.id][0].id); }}
                            className={`flex-shrink-0 px-4 h-full flex flex-col justify-center items-center relative min-w-[70px] ${activeCategory === cat.id ? 'text-white' : 'text-gray-500'}`}
                        >
                             <span className="text-xs font-bold mb-1">{cat.name}</span>
                             {activeCategory === cat.id && <div className="w-1 h-1 bg-cyan-500 rounded-full"></div>}
                        </button>
                    ))}
                     {/* Close Button at the end of tabs or separate? Standard demo puts close on top or overlays. We put a close area above panel to dismiss */}
                </div>
            </div>
            
        </div>
      )}
      
      {/* Invisible closer for panel */}
      {showPanel && <div className="absolute inset-0 z-30" onClick={() => setShowPanel(false)}></div>}
    </div>
  );
};

export default Create;
