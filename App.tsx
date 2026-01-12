
import React, { useState, useEffect, useCallback } from 'react';
import { AppScreen, MainTab, User, MiniPlayerState } from './types';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Create from './pages/Create';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import BottomNav from './components/BottomNav';
import UserProfilePreview from './components/UserProfilePreview';
import MiniPlayer from './components/MiniPlayer';
import { tencentService } from './services/tencentService';
import UniLiveLogo from './components/UniLiveLogo';
import { MOCK_USER, MOCK_POSTS, MOCK_STORIES } from './constants';

// --- MOCK DATABASE INITIALIZATION ---
const generateInitialUsers = () => {
    const registry: Record<string, any> = {};
    registry[MOCK_USER.id] = { ...MOCK_USER, isFollowing: false, isBlocked: false };
    const addUser = (id: string, name: string, avatar: string) => {
        if (!registry[id]) {
            registry[id] = {
                id,
                username: name.toLowerCase().replace(/\s/g, '_'),
                name,
                avatar,
                bio: 'Content Creator | Living the dream 🚀',
                followers: Math.floor(Math.random() * 10000),
                following: Math.floor(Math.random() * 500),
                likes: Math.floor(Math.random() * 50000),
                isFollowing: false,
                isBlocked: false
            };
        }
    };
    MOCK_POSTS.forEach(p => addUser(p.userId || p.id, p.username, p.userAvatar));
    MOCK_STORIES.forEach(s => addUser(s.id, s.username, s.avatar));
    ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'ai-assistant'].forEach(id => {
        addUser(id, `User ${id}`, `https://picsum.photos/seed/${id}/200`);
    });
    return registry;
};

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.SPLASH);
  const [activeTab, setActiveTab] = useState<MainTab>(MainTab.HOME);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [pendingChatId, setPendingChatId] = useState<string | null>(null);
  
  // --- CENTRALIZED STATE ---
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USER);
  const [userRegistry, setUserRegistry] = useState<Record<string, any>>(() => generateInitialUsers());
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  // --- MINI PLAYER STATE ---
  const [miniPlayer, setMiniPlayer] = useState<MiniPlayerState | null>(null);

  useEffect(() => {
    if (screen === AppScreen.SPLASH) {
      const timer = setTimeout(() => {
        setScreen(AppScreen.AUTH);
      }, 3000); 
      return () => clearTimeout(timer);
    }
    
    if (screen === AppScreen.MAIN) {
        tencentService.init();
    }
  }, [screen]);

  useEffect(() => {
    setIsNavVisible(true);
  }, [activeTab]);

  // --- ACTIONS ---

  const handleNavigateToChat = (targetUserId: string) => {
    if (!userRegistry[targetUserId]) {
        setUserRegistry(prev => ({
            ...prev,
            [targetUserId]: {
                id: targetUserId,
                username: `user_${targetUserId}`,
                name: 'Unknown User',
                avatar: `https://picsum.photos/seed/${targetUserId}/200`,
                isFollowing: false,
                isBlocked: false
            }
        }));
    }
    setPendingChatId(targetUserId);
    setViewingProfileId(null); 
    setActiveTab(MainTab.MESSAGES);
  };

  const handleViewProfile = (userId: string) => {
      if (!userRegistry[userId]) {
          setUserRegistry(prev => ({
              ...prev,
              [userId]: {
                  id: userId,
                  username: `user_${userId.substr(0,5)}`,
                  name: `User ${userId.substr(0,5)}`,
                  avatar: `https://picsum.photos/seed/${userId}/200`,
                  bio: 'New to UniLive! 👋',
                  followers: 12,
                  following: 5,
                  likes: 0,
                  isFollowing: false,
                  isBlocked: false
              }
          }));
      }
      setViewingProfileId(userId);
  };

  const handleUpdateUser = (updates: Partial<User>) => {
      setCurrentUser(prev => ({ ...prev, ...updates }));
  };

  const handleFollowUser = (userId: string) => {
      setUserRegistry(prev => ({
          ...prev,
          [userId]: {
              ...prev[userId],
              isFollowing: !prev[userId].isFollowing,
              followers: prev[userId].isFollowing 
                ? (Number(prev[userId].followers) - 1) 
                : (Number(prev[userId].followers) + 1)
          }
      }));
  };

  const handleBlockUser = (userId: string) => {
      setUserRegistry(prev => ({
          ...prev,
          [userId]: {
              ...prev[userId],
              isBlocked: true,
              isFollowing: false
          }
      }));
      setViewingProfileId(null);
  };

  // --- MINI PLAYER HANDLERS ---
  const handleStartMiniPlayer = (url: string, currentTime: number, sourceTab: MainTab, postId?: string) => {
      setMiniPlayer({
          isActive: true,
          url,
          currentTime,
          sourceTab,
          postId,
          isMinimized: false
      });
  };

  const handleCloseMiniPlayer = () => {
      setMiniPlayer(null);
  };

  const handleRestoreMiniPlayer = (time: number) => {
      if (miniPlayer) {
          // Navigate to source tab
          setActiveTab(miniPlayer.sourceTab);
          
          // Emit a custom event so child components can catch the restore time
          const event = new CustomEvent('unilive-restore-video', { 
              detail: { postId: miniPlayer.postId, time: time } 
          });
          window.dispatchEvent(event);
          
          setMiniPlayer(null);
      }
  };

  const commonProps = { 
      onToggleNav: setIsNavVisible, 
      onViewProfile: handleViewProfile,
      currentUser: currentUser,
      userRegistry: userRegistry,
      onTabChange: setActiveTab,
      onStartMiniPlayer: handleStartMiniPlayer // Inject mini player starter
  };

  if (screen === AppScreen.SPLASH) {
    return (
      <div className="h-[100dvh] w-full bg-black flex flex-col justify-center items-center">
        <UniLiveLogo size="lg" className="mb-6" />
        <h1 className="text-3xl font-black text-white tracking-[0.3em] animate-fade-in">UNILIVE</h1>
        <div className="mt-4 flex gap-1 animate-pulse">
            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (screen === AppScreen.AUTH) {
    return <Auth onLogin={() => setScreen(AppScreen.MAIN)} />;
  }

  const activeProfileUser = viewingProfileId ? userRegistry[viewingProfileId] : null;

  return (
    <div className="h-[100dvh] w-full bg-black relative overflow-hidden">
      {/* Main Content Area */}
      <div className="absolute inset-0 w-full h-full z-0">
        
        {/* HOME */}
        <div style={{ display: activeTab === MainTab.HOME ? 'block' : 'none', height: '100%', width: '100%' }}>
             <Home 
                {...commonProps} 
                onFollowUser={handleFollowUser}
                isActiveTab={activeTab === MainTab.HOME}
            />
        </div>

        {/* EXPLORE */}
        <div style={{ display: activeTab === MainTab.EXPLORE ? 'block' : 'none', height: '100%', width: '100%' }}>
            <Explore {...commonProps} />
        </div>

        {/* MESSAGES */}
        <div style={{ display: activeTab === MainTab.MESSAGES ? 'block' : 'none', height: '100%', width: '100%' }}>
            <Messages 
                {...commonProps} 
                initialChatId={pendingChatId} 
                onChatOpened={() => setPendingChatId(null)} 
            />
        </div>

        {/* PROFILE */}
        <div style={{ display: activeTab === MainTab.PROFILE ? 'block' : 'none', height: '100%', width: '100%' }}>
            <Profile 
                {...commonProps} 
                onNavigateToChat={handleNavigateToChat} 
                onUpdateUser={handleUpdateUser} 
                onFollowUser={handleFollowUser}
            />
        </div>

        {/* CREATE */}
        {activeTab === MainTab.CREATE && <Create onClose={() => setActiveTab(MainTab.HOME)} />}

      </div>

      {/* Global Profile Preview Modal */}
      {viewingProfileId && activeProfileUser && (
          <UserProfilePreview 
              user={activeProfileUser}
              onClose={() => setViewingProfileId(null)} 
              onNavigateToChat={handleNavigateToChat}
              onViewProfile={handleViewProfile}
              onFollowToggle={() => handleFollowUser(viewingProfileId)}
              onBlockUser={() => handleBlockUser(viewingProfileId)}
          />
      )}

      {/* GLOBAL MINI PLAYER */}
      {miniPlayer && (
          <MiniPlayer 
              url={miniPlayer.url}
              initialTime={miniPlayer.currentTime}
              onClose={handleCloseMiniPlayer}
              onRestore={handleRestoreMiniPlayer}
          />
      )}

      {/* Floating Bottom Navigation */}
      {activeTab !== MainTab.CREATE && (
        <div 
          className={`absolute bottom-0 w-full z-50 transition-transform duration-300 ease-in-out ${
            isNavVisible ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      )}
    </div>
  );
};

export default App;
