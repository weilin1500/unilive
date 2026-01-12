
import React, { useRef, useEffect, useState } from 'react';

interface MiniPlayerProps {
    url: string;
    initialTime: number;
    onClose: () => void;
    onRestore: (time: number) => void;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ url, initialTime, onClose, onRestore }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: window.innerWidth - 140, y: window.innerHeight - 200 }); // Default bottom right
    const dragStartRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.currentTime = initialTime;
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    // Auto-play might be blocked or interrupted
                    console.log("MiniPlayer playback prevented", e);
                });
            }
        }
    }, [initialTime]);

    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        // Only drag if not clicking controls
        if ((e.target as HTMLElement).closest('button')) return;
        
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        dragStartRef.current = {
            x: clientX - position.x,
            y: clientY - position.y
        };
    };

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isDragging) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        
        // Simple bounds check (keep within screen mostly)
        const newX = clientX - dragStartRef.current.x;
        const newY = clientY - dragStartRef.current.y;

        setPosition({ x: newX, y: newY });
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        // Optional: Snap logic could go here
    };

    const handleRestore = (e: React.MouseEvent) => {
        if (!isDragging && videoRef.current) {
            onRestore(videoRef.current.currentTime);
        }
    };

    return (
        <div 
            className="fixed z-[999] w-32 aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-2xl border border-white/20 touch-none animate-fade-in"
            style={{ 
                left: position.x, 
                top: position.y,
                cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseMove={handleTouchMove}
            onMouseUp={handleTouchEnd}
            onClick={handleRestore}
        >
            <video 
                ref={videoRef}
                src={url}
                className="w-full h-full object-cover pointer-events-none"
                muted
                loop
                playsInline
            />
            
            {/* Controls Overlay */}
            <div className="absolute inset-0 bg-black/10 hover:bg-black/30 transition-colors">
                <button 
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition-colors pointer-events-auto active:scale-90"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
                
                {/* Maximize Icon Hint */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </div>

                <div className="absolute bottom-1 left-1 bg-cyan-600/80 px-1.5 rounded text-[8px] text-white font-bold pointer-events-none">
                    PLAYING
                </div>
            </div>
        </div>
    );
};

export default MiniPlayer;
