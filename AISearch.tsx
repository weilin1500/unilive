
import React, { useState, useEffect, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import UniLiveLogo from './UniLiveLogo';

interface AISearchProps {
    placeholder?: string;
    onClose: () => void;
    onResultSelect: (id: string) => void;
    initialAutoMic?: boolean;
}

type TabType = 'ALL' | 'USERS' | 'LIVE' | 'POSTS' | 'MUSIC' | 'TAGS' | 'EVENTS';

const AISearch: React.FC<AISearchProps> = ({ placeholder = "Search Unilive...", onClose, onResultSelect, initialAutoMic = false }) => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('ALL');
    const [results, setResults] = useState<any>({ users: [], posts: [], lives: [], hashtags: [], music: [], events: [] });
    const [isListening, setIsListening] = useState(false);
    
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (initialAutoMic) {
            startListening();
        } else {
            inputRef.current?.focus();
        }
        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    const startListening = () => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new (window as any).webkitSpeechRecognition();
            recognitionRef.current = recognition;
            recognition.lang = 'my-MM'; // Restore Burmese
            recognition.continuous = false;
            recognition.interimResults = true;

            recognition.onstart = () => setIsListening(true);
            
            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        // Interim results can be displayed if needed
                        setQuery(event.results[i][0].transcript);
                    }
                }
                if (finalTranscript) {
                    setQuery(finalTranscript);
                    handleSearch(finalTranscript);
                }
            };

            recognition.onerror = (event: any) => {
                if (event.error !== 'no-speech') {
                    console.error("Speech recognition error", event.error);
                }
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
                inputRef.current?.focus();
            };

            recognition.start();
        } else {
            alert("Voice search is not supported in this browser.");
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const toggleListening = () => {
        if (isListening) stopListening();
        else startListening();
    };

    const handleSearch = (val: string) => {
        setQuery(val);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (val.length < 2) {
            setResults({ users: [], posts: [], lives: [], hashtags: [], music: [], events: [] });
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(async () => {
            const data = await geminiService.searchUniversal(val);
            setResults(data);
            setIsSearching(false);
        }, 600);
    };

    const hasResults = Object.values(results).some((arr: any) => arr?.length > 0);

    const renderSectionHeader = (title: string, tab: TabType) => (
        <div className="flex justify-between items-end mb-3 px-1 mt-6 border-b border-white/5 pb-2">
            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[2px] flex items-center gap-2">
                <span className="w-1 h-3 bg-cyan-500 rounded-full"></span>
                {title}
            </h4>
            <button onClick={() => setActiveTab(tab)} className="text-[10px] text-cyan-500 font-bold hover:text-cyan-400 transition-colors">View All</button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl animate-fade-in flex flex-col pointer-events-auto">
            {/* Search Header */}
            <div className="px-4 pt-4 pb-2 flex items-center gap-3 border-b border-white/10 bg-black/40">
                <button onClick={onClose} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors active:scale-90">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                
                <div className={`flex-1 relative group rounded-xl overflow-hidden transition-all bg-white/10 border ${isListening ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : isSearching ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'border-white/10 focus-within:border-white/30'}`}>
                    <div className="relative flex items-center px-3 py-2.5">
                         {isSearching ? (
                             <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mr-3 shrink-0"></div>
                         ) : (
                             <svg className="w-4 h-4 text-gray-400 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                         )}
                         <input 
                            ref={inputRef}
                            type="text" 
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder={isListening ? "Listening (Burmese)..." : placeholder}
                            className={`bg-transparent border-none outline-none text-white w-full text-sm font-medium ${isListening ? 'placeholder-red-400 animate-pulse' : 'placeholder-gray-500'}`}
                         />
                         
                         {/* Mic Button */}
                         <button 
                            onClick={toggleListening}
                            className={`p-1.5 rounded-full ml-2 transition-all active:scale-90 ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'hover:bg-white/10 text-gray-400'}`}
                         >
                             {isListening ? (
                                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                             ) : (
                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                             )}
                         </button>

                         {query && !isListening && (
                             <button onClick={() => handleSearch('')} className="p-1 bg-white/10 rounded-full hover:bg-white/20 ml-2 text-gray-300">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                             </button>
                         )}
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3 border-b border-white/5 bg-black/20 shrink-0">
                {['ALL', 'USERS', 'LIVE', 'POSTS', 'MUSIC', 'TAGS', 'EVENTS'].map((tab) => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab as TabType)}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-all whitespace-nowrap border ${activeTab === tab ? 'bg-cyan-600 text-white border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto p-4 no-scrollbar space-y-2 pb-20">
                {isSearching && !hasResults ? (
                    <div className="flex flex-col items-center justify-center pt-20 gap-4 opacity-50">
                        {/* Skeleton Loading could go here, but using simple spinner for now */}
                        <div className="text-xs font-bold text-gray-500 animate-pulse">Thinking...</div>
                    </div>
                ) : !query ? (
                    /* Initial Empty State */
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center opacity-60">
                         <UniLiveLogo size="md" className="mb-4 grayscale opacity-50" />
                         <h3 className="text-lg font-bold text-white mb-1">Explore UniLive</h3>
                         <p className="text-xs text-gray-500 max-w-[200px]">Search for creators, live streams, trending beats, and local events.</p>
                    </div>
                ) : !hasResults ? (
                    <div className="text-center py-20 text-gray-500 text-sm font-medium flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        No results found for "{query}"
                    </div>
                ) : (
                    <div className="space-y-4">
                        
                        {/* 1. LIVES */}
                        {((activeTab === 'ALL' || activeTab === 'LIVE') && results.lives?.length > 0) && (
                            <div className="animate-slide-up">
                                {activeTab === 'ALL' && renderSectionHeader('Live Now', 'LIVE')}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {results.lives.map((live: any, i: number) => (
                                        <div key={i} onClick={() => onResultSelect(`live_${live.id}`)} className="group cursor-pointer relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/5 hover:border-red-500/50 transition-all shadow-lg">
                                            <img src={live.avatar || `https://picsum.photos/seed/live_${i}/300/400`} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80"></div>
                                            
                                            {/* Live Badge */}
                                            <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600/90 backdrop-blur-md px-2 py-1 rounded text-white shadow-lg">
                                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                                <span className="text-[9px] font-black uppercase tracking-wider">LIVE</span>
                                            </div>

                                            {/* Details */}
                                            <div className="absolute bottom-3 left-3 right-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-6 h-6 rounded-full border border-white/50 overflow-hidden bg-black">
                                                        <img src={live.avatar} className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="text-xs font-bold text-white truncate flex-1">{live.streamer}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-gray-300">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
                                                    <span className="text-[9px] font-medium">{live.viewers.toLocaleString()} watching</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 2. USERS */}
                        {((activeTab === 'ALL' || activeTab === 'USERS') && results.users?.length > 0) && (
                            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                                {activeTab === 'ALL' && renderSectionHeader('People', 'USERS')}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {results.users.map((user: any, i: number) => (
                                        <div key={i} onClick={() => onResultSelect(`user_${user.id}`)} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/10 hover:border-white/10 transition-all group">
                                            <div className="relative">
                                                <img src={user.avatar || `https://picsum.photos/seed/u_${i}/100`} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                                                {user.isVerified && (
                                                    <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-0.5 border-2 border-[#121212]">
                                                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm text-white truncate flex items-center gap-1">
                                                    {user.name}
                                                </h4>
                                                <p className="text-xs text-gray-500 truncate">@{user.username || user.name.replace(/\s+/g, '').toLowerCase()}</p>
                                                <p className="text-[9px] text-gray-600 mt-0.5">{user.followers || '1.2k'} followers</p>
                                            </div>
                                            <button className="px-4 py-1.5 bg-cyan-600/10 text-cyan-400 border border-cyan-500/30 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-cyan-600 hover:text-white transition-all shadow-lg active:scale-95">
                                                Follow
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. MUSIC */}
                        {((activeTab === 'ALL' || activeTab === 'MUSIC') && results.music?.length > 0) && (
                            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                                {activeTab === 'ALL' && renderSectionHeader('Audio', 'MUSIC')}
                                <div className="grid grid-cols-1 gap-2">
                                    {results.music.map((track: any, i: number) => (
                                        <div key={i} className="flex items-center gap-4 p-2 pr-4 bg-gradient-to-r from-gray-900 to-transparent border border-white/5 rounded-2xl group hover:border-cyan-500/30 transition-all cursor-pointer">
                                            <div className="w-14 h-14 rounded-xl bg-gray-800 overflow-hidden relative shrink-0 shadow-lg">
                                                <img src={track.cover || `https://picsum.photos/seed/m_${i}/200`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border border-white/30">
                                                        <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="text-sm font-bold text-white truncate">{track.title}</h5>
                                                <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                                                    {track.artist}
                                                </p>
                                            </div>
                                            <div className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded-md border border-white/5">0:30</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 4. EVENTS */}
                        {((activeTab === 'ALL' || activeTab === 'EVENTS') && results.events?.length > 0) && (
                            <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                                {activeTab === 'ALL' && renderSectionHeader('Events', 'EVENTS')}
                                <div className="space-y-3">
                                    {results.events.map((evt: any, i: number) => (
                                        <div key={i} className="flex gap-4 p-4 bg-[#181818] rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all relative overflow-hidden group">
                                            {/* Gradient Accent */}
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-cyan-500"></div>
                                            
                                            {/* Date Box */}
                                            <div className="w-12 h-14 flex flex-col rounded-xl overflow-hidden shrink-0 shadow-lg">
                                                <div className="h-5 bg-red-600 flex items-center justify-center text-[9px] font-black text-white uppercase tracking-wider">{evt.date?.split(' ')[0] || 'DEC'}</div>
                                                <div className="flex-1 bg-white flex items-center justify-center text-black text-xl font-black">{evt.date?.split(' ')[1] || '25'}</div>
                                            </div>

                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <h4 className="text-sm font-bold text-white truncate">{evt.title}</h4>
                                                <div className="flex items-center gap-1.5 mt-1 text-gray-400">
                                                    <svg className="w-3.5 h-3.5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    <p className="text-[11px] truncate">{evt.location}</p>
                                                </div>
                                            </div>

                                            <button className="self-center px-4 py-2 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-white/20 transition-colors border border-white/10">
                                                RSVP
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 5. HASHTAGS */}
                        {((activeTab === 'ALL' || activeTab === 'TAGS') && results.hashtags?.length > 0) && (
                            <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
                                {activeTab === 'ALL' && renderSectionHeader('Hashtags', 'TAGS')}
                                <div className="flex flex-wrap gap-2">
                                    {results.hashtags.map((tag: any, i: number) => (
                                        <button key={i} onClick={() => onResultSelect(`tag_${tag.tag}`)} className="flex items-center gap-2 pl-1 pr-3 py-1 bg-gray-900 border border-white/10 rounded-full hover:border-cyan-500/50 hover:bg-gray-800 transition-all group">
                                            <div className="w-6 h-6 rounded-full bg-cyan-900/30 flex items-center justify-center text-cyan-400 text-xs font-black group-hover:text-cyan-300">#</div>
                                            <div className="flex flex-col items-start leading-none">
                                                <span className="text-xs font-bold text-white">{tag.tag}</span>
                                                <span className="text-[8px] text-gray-500 font-mono mt-0.5">{tag.count} posts</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 6. POSTS Grid */}
                        {((activeTab === 'ALL' || activeTab === 'POSTS') && results.posts?.length > 0) && (
                            <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
                                {activeTab === 'ALL' && renderSectionHeader('Posts', 'POSTS')}
                                <div className="grid grid-cols-3 gap-1">
                                    {results.posts.map((post: any, i: number) => (
                                        <div key={i} onClick={() => onResultSelect(`post_${post.id}`)} className="aspect-[3/4] bg-gray-800 relative cursor-pointer group overflow-hidden rounded-md">
                                            <img src={post.thumbnail || `https://picsum.photos/seed/p_${i}/200`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            {post.type === 'video' && <div className="absolute top-1.5 right-1.5 text-white drop-shadow-md"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg></div>}
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AISearch;
