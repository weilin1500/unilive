
import React, { useState, useEffect, useRef, useCallback } from 'react';
import AISearch from './AISearch';
import UniLiveLogo from './UniLiveLogo';
import { geminiService } from '../services/geminiService';

interface FindFriendsProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQR: () => void;
  onNavigateToChat?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
  userRegistry?: Record<string, any>;
  onFollowUser?: (userId: string) => void;
}

interface FriendUser {
  id: string;
  username: string;
  name: string;
  avatar: string;
  isFollowing: boolean;
  mutuals: number;
  source: 'contact' | 'facebook' | 'suggested';
  bio?: string;
}

const FindFriends: React.FC<FindFriendsProps> = ({ isOpen, onClose, onOpenQR, onViewProfile, userRegistry, onFollowUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'SUGGESTED' | 'CONTACTS' | 'FACEBOOK'>('SUGGESTED');
  
  // Data States
  const [initialUsers, setInitialUsers] = useState<FriendUser[]>([]);
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  
  // Loading & UI States
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [showAISearch, setShowAISearch] = useState(false);
  
  // Voice Search States
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // Debounce Ref
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- 1. Load Initial Mock Data ---
  useEffect(() => {
    if (isOpen) {
        setLoadingInitial(true);
        // Simulate loading "suggested" users from a backend
        setTimeout(() => {
            const mockUsers = Array.from({ length: 20 }).map((_, i) => {
                const id = `u${i + 100}`;
                // Check if user exists in global registry to sync follow state
                const regUser = userRegistry?.[id];
                
                return {
                    id: id,
                    username: regUser ? regUser.username : `user_${Math.floor(Math.random() * 10000)}`,
                    name: regUser ? regUser.name : ['Sarah Jenkins', 'Mike Ross', 'Jessica Pearson', 'Harvey Specter', 'Louis Litt', 'Donna Paulsen', 'Rachel Zane'][i % 7] + (i > 6 ? ` ${i}` : ''),
                    avatar: regUser ? regUser.avatar : `https://picsum.photos/seed/${i + 555}/100`,
                    isFollowing: regUser ? regUser.isFollowing : Math.random() > 0.8,
                    mutuals: Math.floor(Math.random() * 30),
                    source: i % 3 === 0 ? 'contact' : i % 3 === 1 ? 'facebook' : 'suggested'
                };
            }) as FriendUser[];
            setInitialUsers(mockUsers);
            setLoadingInitial(false);
        }, 800);
    } else {
        setSearchQuery('');
        setSearchResults([]);
    }
  }, [isOpen, userRegistry]);

  // Clean up recognition
  useEffect(() => {
      return () => {
          if (recognitionRef.current) recognitionRef.current.stop();
      };
  }, []);

  // --- 2. Real-Time Search Logic (Debounced) ---
  useEffect(() => {
      // Clear previous timer
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

      if (!searchQuery.trim()) {
          setSearchResults([]);
          setIsSearching(false);
          return;
      }

      setIsSearching(true);

      // Debounce 600ms
      searchTimeoutRef.current = setTimeout(async () => {
          await performSearch(searchQuery);
      }, 600);

      return () => {
          if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      };
  }, [searchQuery]);

  const toggleListening = () => {
      if (isListening) {
          if (recognitionRef.current) recognitionRef.current.stop();
          setIsListening(false);
          return;
      }

      if ('webkitSpeechRecognition' in window) {
          const recognition = new (window as any).webkitSpeechRecognition();
          recognitionRef.current = recognition;
          recognition.lang = 'my-MM'; // Restore Burmese
          recognition.continuous = false;
          recognition.interimResults = true;

          recognition.onstart = () => setIsListening(true);
          recognition.onend = () => setIsListening(false);
          recognition.onerror = (e: any) => {
              if (e.error !== 'no-speech') {
                  console.error("Speech recognition error", e.error);
              }
              setIsListening(false);
          };
          
          recognition.onresult = (event: any) => {
              let transcript = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                  transcript += event.results[i][0].transcript;
              }
              if (transcript) {
                  setSearchQuery(transcript);
              }
          };

          recognition.start();
      } else {
          alert("Voice search is not supported in this browser.");
      }
  };

  const performSearch = async (query: string) => {
      const lowerQ = query.toLowerCase();

      // A. Local Search (Fast)
      const localMatches = initialUsers.filter(user => 
          user.username.toLowerCase().includes(lowerQ) || 
          user.name.toLowerCase().includes(lowerQ)
      );

      // B. AI Search (Contextual) - Only if query is substantial
      // If the user searches for an interest like "Photographer" and no local user matches, use AI.
      let aiMatches: FriendUser[] = [];
      
      // Heuristic: If local matches are low, or query length > 3, try to find "Interest based" users via Gemini
      if (query.length > 2) {
          try {
              const generated = await geminiService.findUsersByInterest(query);
              aiMatches = generated;
          } catch (e) {
              console.error("AI search failed", e);
          }
      }

      // Combine results, prioritizing local exact matches
      // Use a Map to deduplicate by username just in case
      const combined = [...localMatches, ...aiMatches];
      const uniqueResults = Array.from(new Map(combined.map(item => [item.username, item])).values());

      setSearchResults(uniqueResults);
      setIsSearching(false);
  };

  const handleFollowToggle = (id: string, isSearch: boolean) => {
      // Update Global State
      if (onFollowUser) onFollowUser(id);

      // Optimistic Local Update
      const updater = (prev: FriendUser[]) => prev.map(u => u.id === id ? { ...u, isFollowing: !u.isFollowing } : u);
      if (isSearch) setSearchResults(updater);
      else setInitialUsers(updater);
  };

  const handleDismissUser = (id: string, isSearch: boolean) => {
      const updater = (prev: FriendUser[]) => prev.filter(u => u.id !== id);
      if (isSearch) setSearchResults(updater);
      else setInitialUsers(updater);
  };

  const handleSyncContacts = () => {
      setIsSyncing(true);
      setTimeout(() => {
          setHasSynced(true);
          setIsSyncing(false);
      }, 1500);
  };

  // Determine which list to show
  const displayList = searchQuery ? searchResults : initialUsers.filter(u => {
      if (activeTab === 'CONTACTS') return u.source === 'contact';
      if (activeTab === 'FACEBOOK') return u.source === 'facebook';
      return u.source === 'suggested';
  });

  const isLoading = searchQuery ? isSearching : loadingInitial;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-slide-in-right">
      
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-800 bg-black/90 backdrop-blur-md sticky top-0 z-20">
          <button onClick={onClose} className="p-2 -ml-2 text-white hover:text-cyan-400 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-lg font-black tracking-tight flex-1">Find Friends</h1>
          <button onClick={onOpenQR} className="p-2 text-white bg-white/5 rounded-lg active:scale-95 transition-transform">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zM5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
          </button>
      </div>

      {/* Real-time Search Input */}
      <div className="px-4 py-3 bg-black sticky top-[60px] z-10">
          <div className={`bg-gray-900 rounded-2xl flex items-center px-4 py-3 border transition-all group relative ${isListening ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : searchQuery ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'border-gray-800'}`}>
              {isSearching ? (
                  <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mr-3"></div>
              ) : (
                  <svg className={`w-5 h-5 mr-3 ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              )}
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isListening ? "Listening (Burmese)..." : "Search people, interests, or tags..."}
                className={`bg-transparent border-none outline-none text-white w-full text-sm font-medium ${isListening ? 'placeholder-red-400 animate-pulse' : 'placeholder-gray-600'}`}
                autoFocus
              />
              {searchQuery && !isListening && (
                  <button onClick={() => setSearchQuery('')} className="bg-gray-800 rounded-full p-1 text-gray-400 hover:text-white mr-2">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
              )}

              {/* Mic Button */}
              <button 
                  onClick={toggleListening}
                  className={`p-1.5 rounded-full transition-all active:scale-90 ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
              >
                  {isListening ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                  ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  )}
              </button>
          </div>
          {!searchQuery && !isListening && (
             <div 
                onClick={() => setShowAISearch(true)}
                className="mt-3 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-cyan-900/20 to-purple-900/20 rounded-xl border border-white/5 cursor-pointer active:scale-[0.98] transition-transform"
             >
                 <UniLiveLogo size="xs" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Try Advanced AI Search</span>
             </div>
          )}
      </div>

      {/* Tabs (Only when not searching) */}
      {!searchQuery && (
          <div className="flex border-b border-gray-800 shrink-0">
              {[
                  { id: 'SUGGESTED', label: 'Suggested' },
                  { id: 'CONTACTS', label: 'Contacts' },
                  { id: 'FACEBOOK', label: 'Facebook' }
              ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-4 text-[11px] font-black tracking-[1px] uppercase relative transition-colors ${activeTab === tab.id ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
                  >
                      {tab.label}
                      {activeTab === tab.id && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>}
                  </button>
              ))}
          </div>
      )}

      {/* Results List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4">
          {isLoading ? (
              <div className="space-y-4 pt-2">
                  {/* Realistic Skeleton Loader */}
                  {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                          <div className="w-14 h-14 rounded-2xl bg-gray-800/50"></div>
                          <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-800/50 rounded w-1/3"></div>
                              <div className="h-3 bg-gray-800/30 rounded w-1/4"></div>
                          </div>
                          <div className="w-20 h-8 bg-gray-800/50 rounded-lg"></div>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="space-y-4 pb-safe">
                  {/* Empty State */}
                  {searchQuery && displayList.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 opacity-50">
                          <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          <p className="font-bold text-gray-400">No matching users found.</p>
                          <p className="text-xs text-gray-600 mt-1">Try searching for an interest like "Music"</p>
                      </div>
                  )}

                  {/* Sync Contacts Prompt */}
                  {activeTab === 'CONTACTS' && !searchQuery && !hasSynced && (
                      <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 p-5 rounded-[24px] flex items-center justify-between mb-6 border border-cyan-500/20 animate-fade-in">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>
                              <div className="flex-1 min-w-0"><h3 className="text-sm font-black text-white">Sync Contacts</h3><p className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-widest mt-1">Find people you know</p></div>
                          </div>
                          <button onClick={handleSyncContacts} disabled={isSyncing} className={`bg-white text-black px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${isSyncing ? 'opacity-70 cursor-wait' : 'hover:scale-105 active:scale-95 shadow-lg'}`}>
                            {isSyncing ? 'Syncing...' : 'Sync'}
                          </button>
                      </div>
                  )}

                  {/* Search Header for AI Results */}
                  {searchQuery && displayList.length > 0 && (
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-[2px] mb-2 px-1">
                          Results for "{searchQuery}"
                      </div>
                  )}

                  {displayList.map((user, idx) => (
                      <div key={user.id} className="flex items-center gap-3 animate-slide-up group" style={{ animationDelay: `${idx * 0.05}s` }}>
                          <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => onViewProfile && onViewProfile(user.id)}>
                            <div className="relative shrink-0">
                                <img src={user.avatar} className="w-14 h-14 rounded-2xl object-cover border border-white/5 group-hover:scale-105 transition-transform shadow-lg" />
                                {user.source === 'facebook' && (
                                    <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-0.5 border-2 border-black"><span className="text-[8px] font-bold text-white px-1">f</span></div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm text-white truncate flex items-center gap-1">
                                    {user.name}
                                    {/* Verification Check for random users to look cool */}
                                    {idx % 5 === 0 && <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>}
                                </h3>
                                <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                                {user.bio && (
                                    <p className="text-[10px] text-gray-400 truncate mt-0.5 italic">"{user.bio}"</p>
                                )}
                                {!user.bio && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className={`w-1 h-1 rounded-full ${user.mutuals > 10 ? 'bg-green-500' : 'bg-cyan-400'}`}></span>
                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-tighter truncate">{user.mutuals > 0 ? `${user.mutuals} mutuals` : 'Recommended'}</p>
                                    </div>
                                )}
                            </div>
                          </div>

                          <button 
                            onClick={(e) => { e.stopPropagation(); handleFollowToggle(user.id, !!searchQuery); }}
                            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${user.isFollowing ? 'bg-gray-800 text-gray-400 border border-white/5' : 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/30 active:scale-95 hover:bg-cyan-500'}`}
                          >
                              {user.isFollowing ? 'Joined' : 'Follow'}
                          </button>
                          
                          <button onClick={(e) => { e.stopPropagation(); handleDismissUser(user.id, !!searchQuery); }} className="p-2 text-gray-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6" /></svg>
                          </button>
                      </div>
                  ))}
              </div>
          )}
      </div>

      {showAISearch && (
          <AISearch 
            onClose={() => setShowAISearch(false)} 
            onResultSelect={(id) => { setShowAISearch(false); onViewProfile?.(id); }}
          />
      )}
    </div>
  );
};

export default FindFriends;
