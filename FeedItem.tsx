
import React, { useRef, useState, useEffect } from 'react';
import { Post, MainTab } from '../types';
import GiftPanel from './GiftPanel';

interface FeedItemProps {
    post: Post;
    isActive: boolean;
    onCommentClick: () => void;
    onShareClick: () => void;
    onToggleImmersive?: (shouldBeImmersive?: boolean) => void;
    onViewProfile?: (userId: string) => void;
    isImmersive?: boolean;
    isMuted: boolean;
    onToggleMute: () => void;
    isFollowing?: boolean;
    onFollow?: () => void;
    isPageVisible?: boolean; 
    onRestoreFromPiP?: () => void; 
    onStartMiniPlayer?: (url: string, time: number, tab: MainTab, postId: string) => void;
}

const FeedItem: React.FC<FeedItemProps> = ({ 
    post, 
    isActive, 
    onCommentClick, 
    onShareClick, 
    onToggleImmersive,
    onViewProfile,
    isImmersive = false, 
    isMuted, 
    onToggleMute,
    isFollowing = false,
    onFollow,
    isPageVisible = true,
    onRestoreFromPiP,
    onStartMiniPlayer
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Local Social States
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showHeart, setShowHeart] = useState(false);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [giftNotification, setGiftNotification] = useState<string | null>(null);
  const lastTapRef = useRef(0);

  // Listen for Restore Event from MiniPlayer
  useEffect(() => {
      const handleRestoreEvent = (e: any) => {
          if (e.detail?.postId === post.id && videoRef.current) {
              videoRef.current.currentTime = e.detail.time;
              const playPromise = videoRef.current.play();
              if (playPromise !== undefined) {
                  playPromise.catch(err => {
                      if (err.name !== 'AbortError') console.error('Restore playback failed', err);
                  });
              }
              setIsPlaying(true);
          }
      };
      window.addEventListener('unilive-restore-video', handleRestoreEvent);
      return () => window.removeEventListener('unilive-restore-video', handleRestoreEvent);
  }, [post.id]);

  // Playback Control Logic
  useEffect(() => {
    const video = videoRef.current;
    const currentMedia = post.media[activeMediaIndex];
    const isVideo = currentMedia.type === 'video';

    if (!video || !isVideo || hasError) return;

    const shouldPlay = isActive && isPageVisible && isPlaying;

    if (shouldPlay) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                // Ignore AbortError which happens when pausing rapidly after playing
                if (e.name !== 'AbortError') console.log('Autoplay prevented', e);
            });
        }
    } else {
        video.pause();
    }

    // Reset playing state when scrolling away so it auto-plays when returning
    if (!isActive && !isPlaying) {
        setIsPlaying(true);
    }
  }, [isActive, activeMediaIndex, post.media, isPlaying, hasError, isPageVisible]);

  const toggleMiniPlayer = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onStartMiniPlayer && videoRef.current) {
          const currentMedia = post.media[activeMediaIndex];
          if (currentMedia.type === 'video') {
              onStartMiniPlayer(
                  currentMedia.url, 
                  videoRef.current.currentTime, 
                  MainTab.HOME, // Assuming FeedItem is mostly used in Home/Profile. For profile we might need to pass tab prop.
                  post.id
              );
              // Pause local video since mini player takes over
              setIsPlaying(false);
          }
      }
  };

  const handleSwipe = (direction: 'left' | 'right', e: React.MouseEvent) => {
      e.stopPropagation(); 
      if (isImmersive && onToggleImmersive) onToggleImmersive(false);
      
      if (direction === 'left' && activeMediaIndex < post.media.length - 1) {
          setActiveMediaIndex(prev => prev + 1);
          setProgress(0);
          setHasError(false);
      } else if (direction === 'right' && activeMediaIndex > 0) {
          setActiveMediaIndex(prev => prev - 1);
          setProgress(0);
          setHasError(false);
      }
  };

  const toggleLike = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (liked) {
          setLiked(false);
          setLikeCount(prev => prev - 1);
      } else {
          setLiked(true);
          setLikeCount(prev => prev + 1);
      }
  };

  const toggleFollow = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onFollow) onFollow();
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!liked) {
          setLiked(true);
          setLikeCount(prev => prev + 1);
      }
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
  };

  const handleInteraction = (e: React.MouseEvent) => {
      e.stopPropagation();
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;
      
      if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
          handleDoubleTap(e);
      } else {
          if (onToggleImmersive) {
              onToggleImmersive(!isImmersive);
          }
      }
      lastTapRef.current = now;
  };

  const handleTimeUpdate = () => {
      if(videoRef.current) {
          const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
          setProgress(p);
      }
  }

  const handleDownload = async (e: React.MouseEvent) => {
      e.stopPropagation();
      const media = post.media[activeMediaIndex];
      try {
          const response = await fetch(media.url);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `unilive_post_${post.id}_${Date.now()}.${media.type === 'video' ? 'mp4' : 'jpg'}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
      } catch (err) {
          console.error('Download failed', err);
          window.open(media.url, '_blank');
      }
  };

  const handleSendGift = (gift: any) => {
      setShowGiftPanel(false);
      setGiftNotification(`Sent ${gift.name} x${gift.combo || 1} 🎁`);
      setTimeout(() => setGiftNotification(null), 3000);
  };

  return (
    <div className="h-full w-full snap-start relative bg-gray-900 flex items-center justify-center overflow-hidden">
      
      <style>{`
        @keyframes like-heart-animation {
            0% { transform: scale(0); opacity: 0; }
            15% { transform: scale(1.2); opacity: 1; }
            30% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-like-heart {
            animation: like-heart-animation 0.8s ease-out forwards;
        }
      `}</style>

      {/* Double Tap Heart Animation */}
      {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 text-red-500 drop-shadow-2xl animate-like-heart" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
          </div>
      )}

      {/* Gift Notification Toast */}
      {giftNotification && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[60] animate-fade-in flex flex-col items-center">
              <div className="bg-gradient-to-r from-purple-600 to-cyan-600 p-1 rounded-full shadow-2xl">
                  <div className="bg-black/80 px-6 py-2 rounded-full backdrop-blur-md flex items-center gap-2">
                      <span className="text-2xl">🎁</span>
                      <span className="font-bold text-white">{giftNotification}</span>
                  </div>
              </div>
          </div>
      )}

      {/* Media Carousel */}
      <div className="w-full h-full relative group">
          {post.media.map((media, idx) => (
              <div 
                key={idx} 
                className={`absolute inset-0 transition-opacity duration-300 ${idx === activeMediaIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                  {media.type === 'video' ? (
                     <div className="w-full h-full relative bg-black flex items-center justify-center">
                         {!hasError ? (
                             <video
                                ref={idx === activeMediaIndex ? videoRef : null}
                                src={media.url}
                                className="h-full w-full object-cover"
                                loop
                                playsInline
                                muted={isMuted}
                                onTimeUpdate={handleTimeUpdate}
                                onError={() => setHasError(true)}
                             />
                         ) : (
                             <div className="text-center text-gray-500">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                 </svg>
                                 <span className="text-xs">Video unavailable</span>
                             </div>
                         )}
                         
                         {/* Play Button Overlay */}
                         {!isPlaying && isActive && idx === activeMediaIndex && !hasError && (
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                                 <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                 </div>
                             </div>
                         )}
                     </div>
                  ) : (
                      <img src={media.url} className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  )}
              </div>
          ))}
          
          {post.media.length > 1 && (
              <>
                <div className="absolute left-0 top-0 bottom-0 w-1/4 z-20" onClick={(e) => handleSwipe('right', e)}></div>
                <div className="absolute right-0 top-0 bottom-0 w-1/4 z-20" onClick={(e) => handleSwipe('left', e)}></div>
                <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-1.5 pointer-events-none">
                    {post.media.map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === activeMediaIndex ? 'bg-white' : 'bg-white/40'}`}></div>
                    ))}
                </div>
              </>
          )}

          {post.media[activeMediaIndex].type === 'video' && !hasError && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 z-20">
                  <div className="h-full bg-white transition-all duration-100 ease-linear" style={{ width: `${progress}%` }}></div>
              </div>
          )}
          
          {/* Interaction Layer */}
          <div className="absolute inset-0 z-10" onClick={handleInteraction}></div>
      </div>

      {/* Right Sidebar Actions */}
      <div 
          className={`absolute bottom-24 right-2 z-30 flex flex-col items-center gap-5 text-white transition-opacity duration-300 ${isImmersive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          onClick={(e) => e.stopPropagation()}
      >
        {/* Avatar */}
        <div className="relative mb-4">
             <div className="w-12 h-12 rounded-full bg-white border border-white overflow-hidden p-[1px] cursor-pointer" onClick={() => onViewProfile && onViewProfile(post.userId || post.id)}>
                 <img src={post.userAvatar} className="w-full h-full rounded-full object-cover" />
             </div>
             {!isFollowing && (
                <button onClick={toggleFollow} className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center border-2 border-black active:scale-90 transition-all shadow-lg animate-fade-in">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                </button>
             )}
        </div>

        {/* Like */}
        <div className="flex flex-col items-center cursor-pointer" onClick={toggleLike}>
             <div className="p-2 rounded-full transition-transform active:scale-75 text-shadow">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 drop-shadow-lg transition-colors duration-300 ${liked ? 'text-red-500' : 'text-white'}`} fill="currentColor" viewBox="0 0 24 24">
                     <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
             </div>
             <span className="text-xs font-semibold drop-shadow-md">{likeCount}</span>
        </div>

        {/* Comment */}
        <div className="flex flex-col items-center cursor-pointer" onClick={onCommentClick}>
            <div className="p-2 rounded-full transition-transform active:scale-75">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
            </div>
            <span className="text-xs font-semibold drop-shadow-md">{post.comments}</span>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center cursor-pointer" onClick={onShareClick}>
             <div className="p-2 rounded-full transition-transform active:scale-75">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.66 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                </svg>
             </div>
             <span className="text-xs font-semibold drop-shadow-md">{post.shares}</span>
        </div>

        {/* Gift */}
        <div className="flex flex-col items-center cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowGiftPanel(true); }}>
             <div className="p-2 rounded-full transition-transform active:scale-75 animate-bounce-slow">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
             </div>
             <span className="text-xs font-semibold drop-shadow-md text-yellow-400">Gift</span>
        </div>

        {/* Download */}
        <div className="flex flex-col items-center cursor-pointer" onClick={handleDownload}>
             <div className="p-2 rounded-full transition-transform active:scale-75">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
             </div>
             <span className="text-xs font-semibold drop-shadow-md">Save</span>
        </div>
      </div>

      {/* Bottom Text Overlay & Playback Controls */}
      <div 
        className={`absolute bottom-20 left-4 right-16 z-30 text-white drop-shadow-md pointer-events-none transition-opacity duration-300 ${isImmersive ? 'opacity-0' : 'opacity-100'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-2 pointer-events-auto">
            <h3 className="font-bold text-lg cursor-pointer" onClick={() => onViewProfile && onViewProfile(post.userId || post.id)}>@{post.username}</h3>
            
            <button 
                onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }} 
                className="p-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 active:scale-90 transition-transform"
            >
                {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                )}
            </button>
        </div>

        <p className="text-sm mb-3 pointer-events-auto">{post.description}</p>
        
        <div className="flex items-center gap-4 text-xs opacity-90 pointer-events-auto">
          <div className="flex items-center gap-2 overflow-hidden max-w-[150px]">
            <div className="w-4 h-4 rounded-full bg-gray-200 animate-spin-slow shrink-0"></div>
            <span className="scrolling-text whitespace-nowrap">♫ Original Audio - {post.username}</span>
          </div>

          <div className="flex items-center gap-2">
              {post.media[activeMediaIndex].type === 'video' && (
                  <button 
                    onClick={toggleMiniPlayer} 
                    className="p-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 active:scale-90 transition-transform text-white"
                    title="Minimize"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                  </button>
              )}

              <button 
                onClick={(e) => { e.stopPropagation(); onToggleMute(); }} 
                className="p-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 active:scale-90 transition-transform flex items-center justify-center"
              >
                 {isMuted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                )}
              </button>
          </div>
        </div>
      </div>

      <GiftPanel 
        isOpen={showGiftPanel} 
        onClose={() => setShowGiftPanel(false)} 
        onSendGift={handleSendGift} 
      />

    </div>
  );
};

export default FeedItem;
