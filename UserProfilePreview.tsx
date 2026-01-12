
import React, { useState, useEffect, useRef } from 'react';
import { Post } from '../types';

interface UserProfilePreviewProps {
  user: any; // Using the registry user object
  onClose: () => void;
  onNavigateToChat: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
  onFollowToggle: () => void;
  onBlockUser: () => void;
}

const UserProfilePreview: React.FC<UserProfilePreviewProps> = ({ 
    user, 
    onClose, 
    onNavigateToChat, 
    onViewProfile,
    onFollowToggle,
    onBlockUser
}) => {
  const [showUserOptions, setShowUserOptions] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [callingState, setCallingState] = useState<'IDLE' | 'RINGING' | 'CONNECTED' | 'ENDED'>('IDLE');
  const [callTime, setCallTime] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const callIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBlock = () => {
      onBlockUser();
      showToast(`User @${user.username} has been blocked.`);
      setShowBlockConfirm(false);
  };

  const startCall = () => {
      setCallingState('RINGING');
      setTimeout(() => {
          setCallingState('CONNECTED');
          callIntervalRef.current = setInterval(() => setCallTime(prev => prev + 1), 1000);
      }, 2500);
  };

  const endCall = () => {
      if (callIntervalRef.current) clearInterval(callIntervalRef.current);
      setCallingState('ENDED');
      setTimeout(() => {
          setCallingState('IDLE');
          setCallTime(0);
      }, 1500);
  };

  const formatCallTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center pointer-events-none">
        {toastMessage && <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white text-black px-6 py-3 rounded-full shadow-xl font-bold text-sm z-[150] animate-fade-in">{toastMessage}</div>}
        <div className="absolute inset-0 bg-black/60 pointer-events-auto backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="bg-[#181818] w-full h-[85vh] rounded-t-3xl flex flex-col pointer-events-auto overflow-hidden animate-slide-up relative z-10">
            <div className="w-full flex justify-center pt-3 pb-2"><div className="w-12 h-1.5 bg-gray-600 rounded-full"></div></div>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400">✕</button>

            <div className="flex-1 overflow-y-auto no-scrollbar relative">
                <div className="flex flex-col items-center pt-4 pb-6 px-4">
                    <div className="relative mb-3">
                        <div className="w-24 h-24 rounded-full border-2 border-gray-700 p-1">
                            <img src={user.avatar} className="w-full h-full rounded-full object-cover" />
                        </div>
                        {/* Only show add button if NOT following */}
                        {!user.isFollowing && (
                            <button onClick={onFollowToggle} className="absolute bottom-1 right-0 bg-cyan-500 rounded-full w-7 h-7 flex items-center justify-center border-2 border-[#181818] shadow-lg animate-fade-in active:scale-90 transition-transform">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                            </button>
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-white">@{user.username}</h2>
                    <p className="text-center text-sm text-gray-400 mt-2 max-w-xs">{user.bio || 'UniLive Creator'}</p>

                    <div className="flex gap-8 my-6 border-y border-gray-800 py-4 w-full justify-center">
                        <button className="text-center"><div className="font-bold text-white">{user.following}</div><div className="text-xs text-gray-500">Following</div></button>
                        <button className="text-center"><div className="font-bold text-white">{user.followers}</div><div className="text-xs text-gray-500">Followers</div></button>
                        <button className="text-center"><div className="font-bold text-white">{user.likes}</div><div className="text-xs text-gray-500">Likes</div></button>
                    </div>

                    <div className="flex gap-2 w-full max-w-sm">
                        <button 
                            onClick={onFollowToggle} 
                            className={`flex-1 py-3 rounded-xl font-bold transition-all active:scale-95 ${user.isFollowing ? 'bg-gray-800 text-gray-300' : 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20'}`}
                        >
                            {user.isFollowing ? 'Following' : 'Follow'}
                        </button>
                        <button 
                            onClick={() => onNavigateToChat(user.id)} 
                            className="flex-1 py-3 rounded-xl font-bold bg-gray-800 text-white active:scale-95 transition-transform"
                        >
                            Message
                        </button>
                        <button onClick={startCall} className="px-4 py-3 rounded-xl bg-gray-800 text-cyan-400 active:scale-95 transition-transform"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></button>
                        <button onClick={() => setShowUserOptions(!showUserOptions)} className="px-3 py-3 rounded-xl bg-gray-800 text-gray-400 active:scale-95 transition-transform"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg></button>
                    </div>
                </div>
            </div>

            {/* Calling Modal Simulation */}
            {callingState !== 'IDLE' && (
                <div className="absolute inset-0 z-[200] bg-black/95 flex flex-col items-center justify-between p-12 text-white animate-fade-in">
                    <div className="flex flex-col items-center mt-10">
                        <div className={`w-32 h-32 rounded-full border-4 ${callingState === 'RINGING' ? 'border-cyan-500 animate-pulse' : 'border-green-500'} p-1 mb-6`}>
                            <img src={user.avatar} className="w-full h-full rounded-full object-cover" />
                        </div>
                        <h2 className="text-2xl font-black">{user.name}</h2>
                        <p className={`mt-2 font-bold tracking-widest uppercase ${callingState === 'RINGING' ? 'text-cyan-400 animate-bounce' : 'text-green-500'}`}>
                            {callingState === 'RINGING' ? 'Calling...' : callingState === 'CONNECTED' ? formatCallTime(callTime) : 'Call Ended'}
                        </p>
                    </div>

                    <div className="flex gap-8 mb-10">
                        <button onClick={endCall} className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center shadow-xl active:scale-90 transition-transform">
                            <svg className="w-10 h-10 text-white transform rotate-[135deg]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 005.516 5.516l.773-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Options Overlay */}
            {showUserOptions && (
                <div className="absolute inset-0 z-40 bg-black/40 flex items-end" onClick={() => setShowUserOptions(false)}>
                    <div className="bg-[#252525] w-full rounded-t-3xl p-6 space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
                         <button onClick={() => { setShowBlockConfirm(true); setShowUserOptions(false); }} className="w-full p-4 text-left font-bold text-red-500 bg-white/5 rounded-xl">Block @{user.username}</button>
                         <button onClick={() => { showToast('Reported'); setShowUserOptions(false); }} className="w-full p-4 text-left font-bold text-white bg-white/5 rounded-xl">Report User</button>
                         <button onClick={() => setShowUserOptions(false)} className="w-full p-4 text-center font-black text-gray-500 uppercase tracking-widest">Cancel</button>
                    </div>
                </div>
            )}

            {/* Block Confirmation */}
            {showBlockConfirm && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
                    <div className="bg-[#181818] p-8 rounded-[40px] w-full max-w-xs text-center border border-white/10">
                        <h3 className="text-xl font-black mb-2">Block {user.name}?</h3>
                        <p className="text-sm text-gray-400 mb-8">They won't be able to find your profile, posts or stories on UniLive.</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleBlock} className="w-full py-4 bg-red-600 rounded-2xl font-black uppercase text-xs tracking-widest">Block User</button>
                            <button onClick={() => setShowBlockConfirm(false)} className="w-full py-4 text-gray-400 font-bold">Not Now</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default UserProfilePreview;
