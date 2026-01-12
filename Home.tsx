
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MOCK_POSTS, MOCK_STORIES } from '../constants';
import { Post, Story, User, MainTab } from '../types';
import CommentsSheet from '../components/CommentsSheet';
import ShareSheet from '../components/ShareSheet';
import FeedItem from '../components/FeedItem';
import NotificationsSheet from '../components/NotificationsSheet';
import AISearch from '../components/AISearch';
import UniLiveLogo from '../components/UniLiveLogo';
import GiftPanel from '../components/GiftPanel';

interface HomeProps {
  onToggleNav: (visible: boolean) => void;
  onViewProfile?: (userId: string) => void;
  currentUser: User;
  userRegistry?: Record<string, any>;
  onFollowUser?: (userId: string) => void;
  isActiveTab?: boolean; // Prop to indicate if Home tab is currently visible
  onTabChange?: (tab: MainTab) => void; // New prop to switch tabs programmatically
  onStartMiniPlayer?: (url: string, time: number, tab: MainTab, postId: string) => void;
}

const STORY_REACTIONS = ['❤️', '😂', '😮', '😢', '🔥', '👏', '💯', '🙌'];

const Home: React.FC<HomeProps> = ({ onToggleNav, onViewProfile, currentUser, userRegistry, onFollowUser, isActiveTab = true, onTabChange, onStartMiniPlayer }) => {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAISearch, setShowAISearch] = useState(false);
  const [autoMicSearch, setAutoMicSearch] = useState(false); // State for auto-triggering mic
  const [sharingPost, setSharingPost] = useState<Post | null>(null);
  const [isImmersive, setIsImmersive] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [storyInput, setStoryInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [floatingEmojis, setFloatingEmojis] = useState<{id: number, emoji: string, x: number}[]>([]);
  const feedContainerRef = useRef<HTMLDivElement>(null);
  
  // Gift State for Stories
  const [showStoryGiftPanel, setShowStoryGiftPanel] = useState(false);

  const [isMuted, setIsMuted] = useState(true);

  // Merge current user into stories
  const stories = useMemo(() => {
      const myStory: Story = { 
          id: currentUser.id, 
          username: 'You', 
          avatar: currentUser.avatar, 
          isLive: false, 
          hasUnseen: false 
      };
      // Filter out the static 's1' if it exists in constants, replace with dynamic user
      return [myStory, ...MOCK_STORIES.filter(s => s.id !== 's1')];
  }, [currentUser]);

  useEffect(() => {
    onToggleNav(!(isImmersive || showComments || sharingPost || selectedStory || showNotifications || showAISearch || showStoryGiftPanel));
  }, [isImmersive, showComments, sharingPost, selectedStory, showNotifications, showAISearch, showStoryGiftPanel, onToggleNav]);

  // Listen for Restore Event from MiniPlayer (Global Restore Logic)
  useEffect(() => {
      const handleRestoreScroll = (e: any) => {
          const postId = e.detail?.postId;
          if (postId && feedContainerRef.current) {
              const index = MOCK_POSTS.findIndex(p => p.id === postId);
              if (index !== -1) {
                  const height = feedContainerRef.current.clientHeight;
                  // Scroll immediately to the post
                  feedContainerRef.current.scrollTo({ top: index * height, behavior: 'auto' });
                  setActiveVideoIndex(index);
              }
          }
      };
      window.addEventListener('unilive-restore-video', handleRestoreScroll);
      return () => window.removeEventListener('unilive-restore-video', handleRestoreScroll);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight } = e.currentTarget;
    const index = Math.round(scrollTop / clientHeight);
    setActiveVideoIndex(index);
  };

  const handleOpenPost = (postId: string) => {
    const index = MOCK_POSTS.findIndex(p => p.id === postId);
    if (index !== -1 && feedContainerRef.current) {
        const height = feedContainerRef.current.clientHeight;
        feedContainerRef.current.scrollTo({ top: index * height, behavior: 'smooth' });
        setActiveVideoIndex(index);
        showToast('Jumped to post 🚀');
    }
  };

  // Callback to restore view from PiP (Legacy/Backup)
  const handleRestoreFromPiP = (index: number) => {
      if (onTabChange) onTabChange(MainTab.HOME);
      if (feedContainerRef.current) {
          const height = feedContainerRef.current.clientHeight;
          feedContainerRef.current.scrollTo({ top: index * height, behavior: 'auto' });
          setActiveVideoIndex(index);
      }
  };

  const handleToggleImmersive = (shouldBeImmersive?: boolean) => {
      setIsImmersive(prev => shouldBeImmersive ?? !prev);
  };

  const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 2000);
  };

  const handleSendStoryComment = () => {
      if (!storyInput.trim()) return;
      showToast('Comment Sent! 📨');
      setStoryInput('');
  };

  const handleStoryReaction = useCallback((emoji: string, e: React.MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const newFloating = { id: Date.now(), emoji, x: rect.left + rect.width / 2 };
      setFloatingEmojis(prev => [...prev, newFloating]);
      showToast(`Sent ${emoji}!`);
      setTimeout(() => setFloatingEmojis(prev => prev.filter(f => f.id !== newFloating.id)), 1000);
  }, []);

  const openSearch = (autoMic: boolean = false) => {
      setAutoMicSearch(autoMic);
      setShowAISearch(true);
  };

  const handleSendGift = (gift: any) => {
      setShowStoryGiftPanel(false);
      showToast(`Sent ${gift.name} x${gift.combo || 1} to Story! 🎁`);
  };

  if (selectedStory) {
      return (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-fade-in">
           {toastMessage && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-3 rounded-full backdrop-blur-md z-[120] animate-fade-in text-sm font-bold shadow-xl border border-white/10 whitespace-nowrap">
                  {toastMessage}
              </div>
           )}
           {floatingEmojis.map(f => (
               <div key={f.id} className="absolute z-[110] text-3xl pointer-events-none animate-float-up" style={{ left: f.x, bottom: '150px' }}>{f.emoji}</div>
           ))}
           <div className="absolute top-4 left-2 right-2 flex gap-1 z-20"><div className="h-1 bg-white/30 flex-1 rounded-full overflow-hidden"><div className="h-full bg-white animate-progress"></div></div></div>
           <div className="absolute top-8 left-4 flex items-center gap-2 z-20 cursor-pointer" onClick={() => onViewProfile && onViewProfile(selectedStory.id)}>
               <img src={selectedStory.avatar} className="w-8 h-8 rounded-full border border-white" />
               <span className="font-bold text-sm text-white">{selectedStory.username}</span>
               {selectedStory.isLive && <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm ml-1">LIVE</span>}
           </div>
           <button onClick={() => setSelectedStory(null)} className="absolute top-8 right-4 z-30 p-2 text-white">✕</button>
           <div className="w-full h-full relative bg-gray-900" onClick={() => setSelectedStory(null)}>
               <img src={selectedStory.id === currentUser.id ? currentUser.avatar : `https://picsum.photos/seed/${selectedStory.id}/400/800`} className="w-full h-full object-cover" />
           </div>
           
           <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col gap-3">
               <div className="flex justify-between items-center bg-black/20 backdrop-blur-md rounded-2xl px-2 py-2 border border-white/10">
                   {STORY_REACTIONS.map((emoji) => (<button key={emoji} onClick={(e) => handleStoryReaction(emoji, e)} className="text-2xl hover:scale-125 transition-transform p-1">{emoji}</button>))}
               </div>
               <div className="flex gap-2 items-center">
                    <input type="text" value={storyInput} onChange={(e) => setStoryInput(e.target.value)} placeholder="Send a message..." className="flex-1 bg-transparent border border-white/50 rounded-full px-4 py-3 text-white outline-none backdrop-blur-md" />
                    
                    {/* Gift Button in Story */}
                    <button onClick={() => setShowStoryGiftPanel(true)} className="p-3 bg-white/10 rounded-full text-yellow-400 border border-white/20 active:scale-90 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                    </button>

                    <button onClick={handleSendStoryComment} className="p-3 bg-cyan-600 rounded-full text-white active:scale-90 transition-transform disabled:opacity-50">
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                    </button>
               </div>
           </div>

           <GiftPanel 
             isOpen={showStoryGiftPanel} 
             onClose={() => setShowStoryGiftPanel(false)} 
             onSendGift={handleSendGift} 
           />
        </div>
      );
  }

  return (
    <div className="h-full w-full relative bg-black">
      {!isImmersive && (
        <div className="absolute top-0 left-0 right-0 z-40 p-2 bg-gradient-to-b from-black/90 to-transparent">
            <div className="flex items-center gap-3 px-2 pt-2 mb-3">
                 {/* TRIGGER AI SEARCH */}
                 <div className="flex-1 flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-1 border border-white/20 shadow-lg">
                     <div 
                        onClick={() => openSearch(false)}
                        className="flex-1 flex items-center px-2 py-2 cursor-text active:scale-[0.98] transition-all"
                     >
                          <UniLiveLogo size="xs" className="mr-2" />
                          <span className="text-gray-400 text-sm flex-1 truncate flex flex-wrap">Search with AI...</span>
                     </div>
                     {/* Mic Button on Bar */}
                     <button 
                        onClick={() => openSearch(true)}
                        className="p-2 rounded-full hover:bg-white/10 text-white transition-colors active:scale-90"
                     >
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                     </button>
                 </div>

                 <button onClick={() => setShowNotifications(true)} className="relative active:scale-95 transition-transform p-1">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                     <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black"></div>
                 </button>
            </div>
             <div className="flex gap-4 overflow-x-auto no-scrollbar px-2 pb-2">
                {stories.map(story => (
                    <div key={story.id} className="flex flex-col items-center min-w-[64px] cursor-pointer" onClick={() => setSelectedStory(story)}>
                        <div className="relative w-16 h-16">
                            <div className={`w-full h-full rounded-full p-[2px] ${story.isLive ? 'bg-red-500' : 'bg-cyan-500'}`}>
                                <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-black"><img src={story.avatar} className="w-full h-full object-cover" /></div>
                            </div>
                        </div>
                        <span className="text-[10px] mt-2 font-medium text-gray-300 truncate w-16 text-center">{story.username}</span>
                    </div>
                ))}
             </div>
        </div>
      )}

      <div 
        ref={feedContainerRef}
        className="h-full w-full overflow-y-scroll snap-y-mandatory no-scrollbar"
        onScroll={handleScroll}
      >
        {MOCK_POSTS.map((post, index) => {
            const authorId = post.userId || post.id;
            const authorInRegistry = userRegistry?.[authorId];
            const isFollowing = authorInRegistry?.isFollowing || false;

            return (
              <FeedItem 
                key={post.id} 
                post={post} 
                isActive={index === activeVideoIndex} 
                onCommentClick={() => setShowComments(true)}
                onShareClick={() => setSharingPost(post)}
                onToggleImmersive={handleToggleImmersive}
                onViewProfile={onViewProfile}
                isImmersive={isImmersive}
                isMuted={isMuted}
                onToggleMute={() => setIsMuted(!isMuted)}
                isFollowing={isFollowing}
                onFollow={() => onFollowUser && onFollowUser(authorId)}
                isPageVisible={isActiveTab} // Pass the visibility prop
                onRestoreFromPiP={() => handleRestoreFromPiP(index)}
                onStartMiniPlayer={onStartMiniPlayer}
              />
            );
        })}
      </div>

      <CommentsSheet isOpen={showComments} onClose={() => setShowComments(false)} onViewProfile={onViewProfile} currentUser={currentUser} />
      <ShareSheet isOpen={!!sharingPost} onClose={() => setSharingPost(null)} post={sharingPost} />
      <NotificationsSheet 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
        onViewProfile={onViewProfile}
        onOpenPost={handleOpenPost}
      />

      {showAISearch && (
          <AISearch 
            initialAutoMic={autoMicSearch}
            onClose={() => { setShowAISearch(false); setAutoMicSearch(false); }}
            onResultSelect={(id) => { 
                setShowAISearch(false); 
                setAutoMicSearch(false); 
                if (id.startsWith('user_')) {
                    const cleanId = id.replace('user_', '');
                    onViewProfile?.(cleanId);
                } else if (id.startsWith('live_')) {
                    showToast('Joining live...');
                } else {
                    showToast(`Viewing result: ${id}`); 
                }
            }}
          />
      )}
    </div>
  );
};

export default Home;
