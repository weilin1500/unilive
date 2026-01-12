
import React, { useState, useEffect, useRef } from 'react';
import MediaViewer from '../components/MediaViewer';
import UniLiveLogo from '../components/UniLiveLogo';
import { geminiService } from '../services/geminiService';
import { MainTab } from '../types';

interface ExploreProps {
  onToggleNav: (visible: boolean) => void;
  onViewProfile?: (userId: string) => void;
  onTabChange?: (tab: MainTab) => void;
}

interface SearchResult {
    text: string;
    sources: { title: string; url: string }[];
}

const Explore: React.FC<ExploreProps> = ({ onToggleNav, onViewProfile, onTabChange }) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'SHOP' | 'GAME' | 'TRADING'>('ALL');
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  
  // Real-time Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  
  // Voice Search States
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onToggleNav(selectedItem === null);
  }, [selectedItem, onToggleNav]);

  useEffect(() => {
      return () => {
          if (recognitionRef.current) recognitionRef.current.stop();
      }
  }, []);

  // Debounced Search Effect
  useEffect(() => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

      if (!searchQuery.trim()) {
          setSearchResult(null);
          setIsSearching(false);
          return;
      }

      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
          const result = await geminiService.searchExplore(searchQuery);
          setSearchResult(result);
          setIsSearching(false);
      }, 800); // 800ms debounce for better UX/API conservation

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

  const tabs = [
    { id: 'ALL', label: 'For You' },
    { id: 'SHOP', label: 'Shop 🛍️' },
    { id: 'GAME', label: 'Game 🎮' },
    { id: 'TRADING', label: 'Trading 📈' },
  ];

  if (selectedItem !== null) {
      const isVideo = selectedItem % 2 === 0;
      const url = isVideo 
        ? 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' 
        : `https://picsum.photos/seed/${selectedItem + 100}/600/800`;

      return (
          <div className="h-full w-full bg-black text-white relative animate-fade-in flex flex-col z-50">
               <MediaViewer 
                  url={url} 
                  type={isVideo ? 'video' : 'image'} 
                  onClose={() => setSelectedItem(null)} 
                  onRestore={() => onTabChange && onTabChange(MainTab.EXPLORE)}
               />
          </div>
      )
  }

  return (
    <div className="h-full w-full bg-black text-white pt-4 overflow-y-auto no-scrollbar pb-20">
      {/* Search Header - Real Time */}
      <div className="px-4 mb-4 flex items-center gap-2 sticky top-0 z-30 bg-black/90 backdrop-blur-md py-2 -mt-4 pt-4">
        <div className={`flex-1 bg-gray-900 rounded-xl flex items-center px-3 py-2.5 border transition-all ${isListening ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : searchQuery ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'border-gray-800'}`}>
           {isSearching ? (
               <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mr-3"></div>
           ) : (
               <UniLiveLogo size="xs" className="mr-2" />
           )}
           <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isListening ? "Listening (Burmese)..." : "Search trends, news, topics..."}
              className={`bg-transparent border-none outline-none text-white w-full text-sm font-medium ${isListening ? 'placeholder-red-400 animate-pulse' : 'placeholder-gray-500'}`}
           />
           
           {/* Clear Button */}
           {searchQuery && !isListening && (
               <button onClick={() => { setSearchQuery(''); setSearchResult(null); }} className="bg-gray-800 rounded-full p-1 text-gray-400 hover:text-white mr-2">
                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
           )}

           {/* Mic Button */}
           <button 
                onClick={toggleListening}
                className={`p-1.5 rounded-full transition-all active:scale-90 ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
           >
               {isListening ? (
                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
               ) : (
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
               )}
           </button>
        </div>
      </div>

      {/* SEARCH RESULTS VIEW */}
      {searchQuery ? (
          <div className="px-4 animate-fade-in pb-20">
              {isSearching && !searchResult && (
                  <div className="flex flex-col items-center justify-center py-20 opacity-60">
                      <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-xs font-bold text-gray-400">Searching live web data...</p>
                  </div>
              )}

              {searchResult && (
                  <div className="space-y-6">
                      {/* AI Summary Card */}
                      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] p-5 rounded-[24px] border border-white/10 relative overflow-hidden shadow-2xl">
                          <div className="absolute top-0 right-0 p-3 opacity-20">
                              <UniLiveLogo size="md" />
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-900/20 px-2 py-1 rounded border border-cyan-500/20">Live Summary</span>
                              <span className="text-[10px] text-gray-500">Google Grounding</span>
                          </div>
                          <p className="text-sm font-medium leading-relaxed text-gray-200 relative z-10">
                              {searchResult.text}
                          </p>
                      </div>

                      {/* Source Links */}
                      {searchResult.sources.length > 0 && (
                          <div>
                              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[2px] mb-3 px-1">Sources</h3>
                              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                  {searchResult.sources.map((source, idx) => (
                                      <a 
                                        key={idx} 
                                        href={source.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="min-w-[140px] max-w-[140px] bg-gray-900 p-3 rounded-xl border border-white/5 flex flex-col justify-between hover:bg-gray-800 transition-colors h-24"
                                      >
                                          <p className="text-xs font-bold text-white line-clamp-2 leading-tight">{source.title}</p>
                                          <div className="flex items-center gap-1 mt-2">
                                              <svg className="w-3 h-3 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                              <span className="text-[9px] text-gray-500 truncate">{new URL(source.url).hostname.replace('www.','')}</span>
                                          </div>
                                      </a>
                                  ))}
                              </div>
                          </div>
                      )}

                      {/* Simulated Grid Results for Context */}
                      <div>
                          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[2px] mb-3 px-1">Related on UniLive</h3>
                          <div className="grid grid-cols-2 gap-2">
                              {Array.from({ length: 4 }).map((_, i) => (
                                  <div key={i} className="relative aspect-[4/5] rounded-xl overflow-hidden bg-gray-800" onClick={() => setSelectedItem(i + 50)}>
                                      <img src={`https://picsum.photos/seed/${searchQuery}_${i}/300/400`} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                                      <div className="absolute bottom-2 left-2 text-xs font-bold text-white shadow-black drop-shadow-md">#{searchQuery.replace(/\s+/g, '')}</div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}
          </div>
      ) : (
          <>
            {/* Tabs */}
            <div className="flex px-4 gap-4 overflow-x-auto no-scrollbar mb-6">
                {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeTab === tab.id ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20' : 'bg-gray-800 text-gray-300'
                    }`}
                >
                    {tab.label}
                </button>
                ))}
            </div>

            {/* Default Content Grid */}
            <div className="grid grid-cols-2 gap-2 px-2">
                {Array.from({ length: 10 }).map((_, i) => {
                const isVideo = i % 2 === 0;
                return (
                    <div 
                        key={i} 
                        className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-900 cursor-pointer group"
                    >
                        <div className="absolute inset-0 z-0" onClick={() => setSelectedItem(i)}>
                            <img 
                                src={`https://picsum.photos/seed/${i + 100}/300/400`} 
                                alt="explore" 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            />
                        </div>
                        
                        {isVideo && (
                            <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full z-10 pointer-events-none backdrop-blur-sm border border-white/10">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            </div>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent z-10 pointer-events-none">
                            <p className="text-xs font-bold truncate mb-1">Awesome Discover #{i+1}</p>
                            <div className="flex justify-between items-center pointer-events-auto">
                                <div className="flex items-center gap-1.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); onViewProfile && onViewProfile(`explore_${i}`); }}>
                                    <img src={`https://picsum.photos/seed/${i+500}/50`} className="w-5 h-5 rounded-full border border-white/30" />
                                    <span className="text-[10px] text-gray-300 font-bold">@User_{i}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )
                })}
            </div>
          </>
      )}
    </div>
  );
};

export default Explore;
