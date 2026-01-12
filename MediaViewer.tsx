
import React, { useRef, useState } from 'react';

interface MediaViewerProps {
    url: string;
    type: 'image' | 'video';
    onClose: () => void;
    onRestore?: () => void; // New prop to restore parent context
    onSwitchToMiniPlayer?: (currentTime: number) => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({ url, type, onClose, onRestore, onSwitchToMiniPlayer }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasError, setHasError] = useState(false);

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `unilive_media_${Date.now()}.${type === 'video' ? 'mp4' : 'jpg'}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            window.open(url, '_blank');
        }
    };

    const handleMinimize = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onSwitchToMiniPlayer && videoRef.current) {
            onSwitchToMiniPlayer(videoRef.current.currentTime);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-fade-in pointer-events-auto" onClick={onClose}>
            {/* Top Bar Actions */}
            <div className="absolute top-4 right-4 z-30 flex items-center gap-3">
                <button 
                    onClick={handleDownload} 
                    className="p-2.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-all backdrop-blur-md border border-white/10 active:scale-95"
                    title="Download"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
                
                {type === 'video' && onSwitchToMiniPlayer && (
                    <button 
                        onClick={handleMinimize} 
                        className="p-2.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-all backdrop-blur-md border border-white/10 active:scale-95"
                        title="Minimize"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    </button>
                )}

                <button 
                    onClick={onClose} 
                    className="p-2.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-all backdrop-blur-md border border-white/10 active:scale-95"
                    title="Close"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div 
                className="w-full h-full relative flex items-center justify-center p-0 md:p-4" 
                onClick={e => e.stopPropagation()}
            >
                {hasError ? (
                    <div className="flex flex-col items-center justify-center text-gray-500 gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm font-medium">Content unavailable</p>
                    </div>
                ) : type === 'image' ? (
                    <img 
                        src={url} 
                        className="max-w-full max-h-full object-contain shadow-2xl" 
                        onError={() => setHasError(true)}
                    />
                ) : (
                    <video 
                        ref={videoRef}
                        src={url}
                        className="w-full h-full max-h-full object-contain shadow-2xl"
                        controls
                        autoPlay
                        playsInline
                        onError={() => setHasError(true)}
                    />
                )}
            </div>
        </div>
    );
};

export default MediaViewer;
