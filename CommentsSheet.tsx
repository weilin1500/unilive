
import React, { useState, useEffect, useRef } from 'react';
import { MOCK_COMMENTS, LANGUAGES } from '../constants';
import { Comment, User } from '../types';
import { geminiService } from '../services/geminiService';
import MediaViewer from './MediaViewer';

interface CommentsSheetProps { 
    isOpen: boolean; 
    onClose: () => void; 
    onViewProfile?: (userId: string) => void;
    currentUser: User;
}

interface MediaAttachment {
    file: File | Blob;
    preview: string;
    type: 'image' | 'video' | 'audio';
}

const EMOJIS = [
    '❤️', '😂', '😮', '😢', '🔥', '👍', '🙌', '🥰', 
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😊',
    '😇', '🙂', '🙃', '😉', '😌', '😍', '😘', '😗',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓',
    '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟',
    '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺',
    '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵',
    '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔',
    '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄',
    '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤',
    '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷',
    '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻',
    '💀', '👽', '🤖', '🎃', '😺', '😸', '😹', '😻',
    '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️',
    '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👉', '👆',
    '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤙', '💪',
    '🙏', '🤝', '💪', '🧠', '🫀', '👀', '👁️', '💋',
    '✨', '⭐️', '🌟', '💫', '💥', '💢', '💦', '💤'
];

const GIPHY_API_KEY = 'JMG0ZCcDfgTH4P2Kl2oRiuhnpIlDqttI';

const GiphyPicker: React.FC<{ onClose: () => void; onSelect: (url: string) => void }> = ({ onClose, onSelect }) => {
    const [activeTab, setActiveTab] = useState<'GIFS' | 'STICKERS' | 'AI'>('GIFS');
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // AI State
    const [aiPrompt, setAiPrompt] = useState('');
    const [generatedSticker, setGeneratedSticker] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Voice State
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => { return () => { if (recognitionRef.current) recognitionRef.current.stop(); } }, []);

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
            recognition.onerror = (e: any) => { if (e.error !== 'no-speech') { console.error("Speech error", e); } setIsListening(false); }; 
            recognition.onresult = (event: any) => { 
                let transcript = ''; 
                for (let i = event.resultIndex; i < event.results.length; ++i) { 
                    transcript += event.results[i][0].transcript; 
                } 
                if (transcript) {
                    if (activeTab === 'AI') {
                        setAiPrompt(transcript);
                    } else {
                        setSearch(transcript);
                    }
                }
            }; 
            recognition.start(); 
        } else { alert("Voice search not supported."); } 
    };

    useEffect(() => {
        if (activeTab === 'AI') return;

        const fetchGiphy = async () => {
            setIsLoading(true);
            try {
                const type = activeTab === 'GIFS' ? 'gifs' : 'stickers';
                const endpoint = search 
                    ? `https://api.giphy.com/v1/${type}/search?api_key=${GIPHY_API_KEY}&q=${search}&limit=20&rating=g` 
                    : `https://api.giphy.com/v1/${type}/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`;
                
                const res = await fetch(endpoint);
                const data = await res.json();
                if (data.data) {
                    setResults(data.data.map((item: any) => item.images.fixed_height.url));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(fetchGiphy, 500);
        return () => clearTimeout(timer);
    }, [search, activeTab]);

    const handleAiGenerate = async (overridePrompt?: string) => {
        const promptToUse = overridePrompt || aiPrompt;
        if (!promptToUse.trim()) return;
        
        setIsGenerating(true);
        setGeneratedSticker(null);
        setIsSaved(false);
        try {
            // Use Gemini to generate a sticker
            const result = await geminiService.generateImage(`${promptToUse}, sticker style, die-cut, white border, vector art, transparent background`, '1K');
            if (result) {
                setGeneratedSticker(result);
            }
        } catch (e: any) {
            console.error("AI Generation failed", e);
            // Handle Permission Error / Key Not Found
            if (e.message === 'KEY_NOT_FOUND' && (window as any).aistudio) {
                try {
                    await (window as any).aistudio.openSelectKey();
                } catch(err) { console.error(err); }
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveSticker = async () => {
        if (!generatedSticker) return;
        try {
            // Check if it's base64 (which it usually is from Gemini) or URL
            let blob: Blob;
            if (generatedSticker.startsWith('data:')) {
                const res = await fetch(generatedSticker);
                blob = await res.blob();
            } else {
                // If it's a remote URL (unlikely for Gemini gen in this context but good practice)
                const res = await fetch(generatedSticker);
                blob = await res.blob();
            }
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `unilive_sticker_${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        } catch (e) {
            console.error("Failed to save sticker", e);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-end justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-[#1C1C1C] w-full h-[60vh] rounded-t-3xl flex flex-col animate-slide-up border-t border-white/10 relative z-10">
                
                {/* Tabs */}
                <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-white/5">
                    <div className="flex gap-6">
                        {['GIFS', 'STICKERS', 'AI'].map(tab => (
                            <button 
                                key={tab}
                                onClick={() => { setActiveTab(tab as any); setSearch(''); }}
                                className={`text-sm font-bold pb-2 border-b-2 transition-all tracking-wide ${activeTab === tab ? 'border-cyan-500 text-white' : 'border-transparent text-gray-500'}`}
                            >
                                {tab === 'AI' ? 'AI Creator ✨' : tab === 'GIFS' ? 'GIFs' : 'Stickers'}
                            </button>
                        ))}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {activeTab === 'AI' ? (
                        <div className="flex-1 p-6 flex flex-col items-center overflow-y-auto no-scrollbar">
                            <div className="w-full bg-gray-900/50 rounded-2xl p-4 border border-white/10 mb-6 shrink-0 relative">
                                <textarea 
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder={isListening ? "Listening..." : "Describe your sticker (e.g. 'Cyberpunk Cat')..."}
                                    className={`w-full bg-transparent text-white text-sm outline-none resize-none h-20 font-medium ${isListening ? 'placeholder-red-400 animate-pulse' : 'placeholder-gray-500'}`}
                                />
                                <div className="flex justify-between items-center mt-2">
                                    <button 
                                        onClick={toggleListening}
                                        className={`p-1.5 rounded-full transition-all active:scale-90 ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        {isListening ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
                                    </button>
                                    <button 
                                        onClick={() => handleAiGenerate()}
                                        disabled={!aiPrompt.trim() || isGenerating}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!aiPrompt.trim() || isGenerating ? 'bg-gray-800 text-gray-500' : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg active:scale-95'}`}
                                    >
                                        {isGenerating ? 'Creating...' : 'Generate'}
                                    </button>
                                </div>
                            </div>

                            {isGenerating ? (
                                <div className="flex flex-col items-center justify-center flex-1 opacity-70">
                                    <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-xs font-bold text-cyan-400 animate-pulse">Dreaming up your sticker...</p>
                                </div>
                            ) : generatedSticker ? (
                                <div className="flex flex-col items-center gap-6 animate-fade-in flex-1 justify-center w-full">
                                    <div className="w-48 h-48 bg-gray-800/50 rounded-full flex items-center justify-center relative group shrink-0">
                                        <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-pulse"></div>
                                        <img src={generatedSticker} className="w-40 h-40 object-contain drop-shadow-2xl relative z-10 transition-transform group-hover:scale-110" />
                                    </div>
                                    <div className="flex gap-3 w-full max-w-xs">
                                        <button 
                                            onClick={handleSaveSticker}
                                            className={`flex-1 py-3 rounded-full font-bold text-sm uppercase tracking-wider transition-colors shadow-xl active:scale-95 border ${isSaved ? 'bg-green-600 text-white border-green-500' : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'}`}
                                        >
                                            {isSaved ? 'Saved!' : 'Save'}
                                        </button>
                                        <button 
                                            onClick={() => onSelect(generatedSticker!)}
                                            className="flex-1 py-3 bg-white text-black rounded-full font-black text-sm uppercase tracking-wider hover:bg-gray-200 transition-colors shadow-xl active:scale-95"
                                        >
                                            Send
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center flex-1 text-gray-600 gap-2">
                                    <span className="text-4xl grayscale opacity-30">🎨</span>
                                    <p className="text-xs font-bold">Create unique stickers with AI</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="p-4 border-b border-white/5 shrink-0">
                                <div className={`bg-gray-900 rounded-xl flex items-center px-3 py-2 border transition-colors ${isListening ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/5'}`}>
                                    {isListening ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin mr-2 shrink-0"></div> : <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                                    <input 
                                        value={search} 
                                        onChange={e => setSearch(e.target.value)} 
                                        placeholder={isListening ? "Listening (Burmese)..." : `Search ${activeTab === 'GIFS' ? 'GIFs' : 'Stickers'}...`} 
                                        className={`bg-transparent w-full text-white outline-none tracking-wide text-sm ${isListening ? 'placeholder-red-400 animate-pulse' : ''}`}
                                        autoFocus={!isLoading}
                                    />
                                    <button onClick={toggleListening} className={`p-1 rounded-full transition-colors active:scale-90 ${isListening ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}>{isListening ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}</button>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto no-scrollbar">
                                <div className="p-2 grid grid-cols-3 gap-2 pb-20">
                                    {/* Create AI Tile */}
                                    {search && (
                                        <div 
                                            onClick={() => {
                                                setActiveTab('AI');
                                                setAiPrompt(search);
                                                handleAiGenerate(search);
                                            }}
                                            className="aspect-square bg-gradient-to-br from-cyan-900/40 to-purple-900/40 rounded-xl border border-cyan-500/30 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-all relative overflow-hidden group"
                                        >
                                            <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">✨</span>
                                            <span className="text-[10px] font-bold text-cyan-400 text-center px-2 leading-tight">Create "{search}"</span>
                                        </div>
                                    )}

                                    {isLoading ? (
                                        <div className="col-span-3 flex justify-center py-10">
                                            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : (
                                        results.map((url, i) => (
                                            <div key={i} className="aspect-square bg-gray-800/30 rounded-xl overflow-hidden cursor-pointer active:scale-95 transition-transform relative z-0" onClick={() => onSelect(url)}>
                                                <img src={url} className="w-full h-full object-cover" loading="lazy" />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const CommentsSheet: React.FC<CommentsSheetProps> = ({ isOpen, onClose, onViewProfile, currentUser }) => {
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  
  // Media State (Multi-Select)
  const [selectedMedia, setSelectedMedia] = useState<MediaAttachment[]>([]);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  // GIF/Sticker/Emoji Picker State
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Reply State
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string; rootId: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  
  // Audio & Dictation State
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [currentAudioTime, setCurrentAudioTime] = useState(0);
  
  // Language & Translation State
  const [targetLang, setTargetLang] = useState(LANGUAGES[0]); // Default to Global/English
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [translatedComments, setTranslatedComments] = useState<Record<string, string>>({});
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());

  // Text-to-Speech State
  const [playingTTSId, setPlayingTTSId] = useState<string | null>(null);

  // Multi-Select State (for deleting)
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());
  
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const longPressTimerRef = useRef<any>(null);
  const commentLongPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
      if (isOpen) {
          // Simulate AI suggesting a comment sometimes
          if (Math.random() > 0.7) {
              const suggest = async () => {
                  try {
                      const suggestion = await geminiService.generateText("Write a funny 5 word comment for a viral video.");
                      setAiSuggestion(suggestion.replace(/"/g, '').trim());
                  } catch (e) {}
              };
              suggest();
          }
      } else {
          setReplyingTo(null);
          setSelectedMedia([]);
          setViewingImage(null);
          setShowGifPicker(false);
          setShowAttachMenu(false);
          setShowEmojiPicker(false);
          setShowLangMenu(false);
          setIsMultiSelect(false);
          setSelectedComments(new Set());
          stopDictation();
          stopRecording(false);
          if (audioRef.current) {
              audioRef.current.pause();
              setPlayingAudioId(null);
              setCurrentAudioTime(0);
          }
          if (ttsAudioRef.current) {
              ttsAudioRef.current.pause();
              setPlayingTTSId(null);
          }
      }
      
      return () => {
          stopDictation();
          stopRecording(false);
          if (audioRef.current) {
              audioRef.current.pause();
          }
          if (ttsAudioRef.current) {
              ttsAudioRef.current.pause();
          }
      };
  }, [isOpen]);

  // --- Dictation Logic (Blue Mic) ---
  const stopDictation = () => {
      if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch(e) {}
          recognitionRef.current = null;
      }
      setIsListening(false);
  };

  const toggleDictation = () => {
      if (isListening) {
          stopDictation();
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
          recognition.onerror = () => setIsListening(false);
          
          recognition.onresult = (event: any) => {
              let transcript = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                  transcript += event.results[i][0].transcript;
              }
              if (transcript && event.results[0].isFinal) {
                  setNewComment(prev => prev + transcript + ' ');
              }
          };

          recognition.start();
      } else {
          alert("Voice dictation not supported.");
      }
  };

  // --- Translation Logic ---
  const handleTranslate = async (commentId: string, text: string) => {
      if (translatedComments[commentId]) {
          // Toggle off
          const newMap = { ...translatedComments };
          delete newMap[commentId];
          setTranslatedComments(newMap);
          return;
      }

      setTranslatingIds(prev => new Set(prev).add(commentId));
      try {
          const translated = await geminiService.translateText(text, targetLang.full);
          setTranslatedComments(prev => ({ ...prev, [commentId]: translated }));
      } catch (e) {
          console.error(e);
      } finally {
          setTranslatingIds(prev => {
              const next = new Set(prev);
              next.delete(commentId);
              return next;
          });
      }
  };

  // --- Read Aloud Logic (TTS) ---
  const handleSpeak = async (commentId: string, text: string) => {
      if (playingTTSId === commentId) {
          // Stop
          ttsAudioRef.current?.pause();
          setPlayingTTSId(null);
          return;
      }

      if (ttsAudioRef.current) {
          ttsAudioRef.current.pause();
      }

      try {
          // Call Gemini TTS
          const base64Audio = await geminiService.speakText(text);
          if (base64Audio) {
              const binaryString = window.atob(base64Audio);
              const len = binaryString.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: 'audio/mp3' });
              const url = URL.createObjectURL(blob);
              const audio = new Audio(url);
              ttsAudioRef.current = audio;
              
              audio.onended = () => {
                  setPlayingTTSId(null);
                  URL.revokeObjectURL(url);
              };
              
              audio.play();
              setPlayingTTSId(commentId);
          }
      } catch (e) {
          console.error("TTS Error", e);
      }
  };

  // --- Multi-Select Logic (for deletion) ---
  const toggleMultiSelect = () => {
      if (isMultiSelect) {
          setIsMultiSelect(false);
          setSelectedComments(new Set());
      } else {
          setIsMultiSelect(true);
      }
  };

  const handleSelectComment = (id: string) => {
      setSelectedComments(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) newSet.delete(id);
          else newSet.add(id);
          return newSet;
      });
  };

  const handleDeleteSelected = () => {
      if (selectedComments.size === 0) return;
      
      const filterComments = (list: Comment[]): Comment[] => {
          // Filter root comments or replies that are not selected
          // And recursively filter replies of surviving comments
          return list.filter(c => !selectedComments.has(c.id)).map(c => ({
              ...c,
              replies: c.replies ? filterComments(c.replies) : []
          }));
      };

      setComments(prev => filterComments(prev));
      setIsMultiSelect(false);
      setSelectedComments(new Set());
  };

  const handleCommentTouchStart = (id: string) => {
      if (isMultiSelect) return;
      commentLongPressRef.current = setTimeout(() => {
          setIsMultiSelect(true);
          setSelectedComments(new Set([id]));
      }, 500);
  };

  const handleCommentTouchEnd = () => {
      if (commentLongPressRef.current) clearTimeout(commentLongPressRef.current);
  };

  // --- Audio Recording Logic (Red Mic) ---
  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;
          audioChunksRef.current = [];

          recorder.ondataavailable = (e) => {
              if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };

          recorder.onstop = () => {
              const tracks = stream.getTracks();
              tracks.forEach(track => track.stop());
          };

          recorder.start();
          setIsRecording(true);
          setIsListening(false); // Ensure dictation is off
      } catch (err) {
          console.error("Mic access denied", err);
      }
  };

  const stopRecording = (save: boolean) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
          if (save) {
              setTimeout(() => {
                  const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                  const url = URL.createObjectURL(blob);
                  // Add as audio attachment
                  setSelectedMedia(prev => [...prev, { file: blob, preview: url, type: 'audio' }]);
              }, 100);
          }
      }
      setIsRecording(false);
      mediaRecorderRef.current = null;
  };

  const handleMicDown = () => {
      if (newComment.trim() || selectedMedia.length > 0) return;
      // Start long press timer
      longPressTimerRef.current = setTimeout(() => {
          stopDictation(); // Stop any active dictation
          startRecording();
      }, 500); // 500ms hold to start recording
  };

  const handleMicUp = () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      
      if (isRecording) {
          stopRecording(true);
      } else {
          // If it wasn't a long press (recording didn't start), toggle dictation
          toggleDictation();
      }
  };

  // --- Playback Logic ---
  const toggleAudio = (id: string, url: string) => {
      if (playingAudioId === id) {
          audioRef.current?.pause();
          setPlayingAudioId(null);
          return;
      }

      if (audioRef.current) {
          audioRef.current.pause();
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onended = () => {
          setPlayingAudioId(null);
          setCurrentAudioTime(0);
      };
      
      audio.ontimeupdate = () => {
          setCurrentAudioTime(audio.currentTime);
      };

      audio.play().catch(e => console.error("Playback failed", e));
      setPlayingAudioId(id);
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- File & Send Logic ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const newAttachments: MediaAttachment[] = Array.from(e.target.files).map((file: File) => ({
              file,
              preview: URL.createObjectURL(file),
              type: file.type.startsWith('video') ? 'video' : 'image'
          }));
          setSelectedMedia(prev => [...prev, ...newAttachments]);
      }
  };

  const removeMedia = (index: number) => {
      setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleGifSelection = async (url: string) => {
      try {
          const res = await fetch(url);
          const blob = await res.blob();
          setSelectedMedia(prev => [...prev, { file: blob, preview: url, type: 'image' }]);
      } catch (e) {
          setSelectedMedia(prev => [...prev, { file: new Blob(), preview: url, type: 'image' }]);
      }
      setShowGifPicker(false);
  };

  const handleSend = () => {
      if (!newComment.trim() && selectedMedia.length === 0) return;
      setIsPosting(true);
      stopDictation();
      setShowEmojiPicker(false);
      
      const newCommentObj: Comment = {
          id: `new_${Date.now()}`,
          username: currentUser.username,
          avatar: currentUser.avatar,
          text: newComment,
          // Support multiple attachments
          attachments: selectedMedia.map(m => ({ type: m.type, url: m.preview })),
          // Fallback for single media view
          mediaUrl: selectedMedia[0]?.preview,
          mediaType: selectedMedia[0]?.type,
          timestamp: 'Just now',
          likes: 0,
          replies: []
      };

      setTimeout(() => {
          if (replyingTo) {
              // Add as reply
              setComments(prev => prev.map(c => {
                  if (c.id === replyingTo.rootId) {
                      return {
                          ...c,
                          replies: [...(c.replies || []), newCommentObj]
                      };
                  }
                  return c;
              }));
              setExpandedReplies(prev => new Set(prev).add(replyingTo.rootId));
          } else {
              // Add as root comment
              setComments(prev => [newCommentObj, ...prev]);
          }
          
          setNewComment('');
          setSelectedMedia([]);
          if (fileInputRef.current) fileInputRef.current.value = '';
          setReplyingTo(null);
          setIsPosting(false);
      }, 300);
  };

  const handleLikeComment = (commentId: string, isReply: boolean, rootId?: string) => {
      if (isReply && rootId) {
          setComments(prev => prev.map(c => {
              if (c.id === rootId) {
                  return {
                      ...c,
                      replies: c.replies.map(r => r.id === commentId ? { ...r, likes: r.likes + 1, userReaction: '❤️' } : r)
                  };
              }
              return c;
          }));
      } else {
          setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: c.likes + 1, userReaction: '❤️' } : c));
      }
  };

  const initiateReply = (targetUser: { id: string, username: string }, rootId: string) => {
      setReplyingTo({ id: targetUser.id, username: targetUser.username, rootId });
      inputRef.current?.focus();
  };

  const toggleReplies = (commentId: string) => {
      setExpandedReplies(prev => {
          const next = new Set(prev);
          if (next.has(commentId)) next.delete(commentId);
          else next.add(commentId);
          return next;
      });
  };

  const addEmoji = (emoji: string) => {
      setNewComment(prev => prev + emoji);
  };

  // Helper to render media content
  const renderMediaContent = (commentId: string, attachments?: { type: 'image' | 'video' | 'audio', url: string }[], mediaUrl?: string, mediaType?: 'image' | 'video' | 'audio') => {
      // Prioritize new attachments array, fall back to legacy single media
      const items = attachments && attachments.length > 0 
          ? attachments 
          : mediaUrl ? [{ type: mediaType || 'image', url: mediaUrl }] : [];

      if (items.length === 0) return null;

      // Single Item
      if (items.length === 1) {
          const item = items[0];
          return (
              <div className="mt-2 rounded-xl overflow-hidden max-w-[220px] relative">
                  {item.type === 'video' ? (
                      <div className="relative group rounded-xl overflow-hidden border border-white/10">
                          <video src={item.url} className="w-full h-full object-cover max-h-[150px]" controls />
                      </div>
                  ) : item.type === 'audio' ? (
                      <div className="flex items-center gap-3 bg-gray-800/80 p-2 pr-4 rounded-2xl border border-white/10 w-fit backdrop-blur-md">
                          <button 
                              onClick={(e) => { e.stopPropagation(); toggleAudio(commentId, item.url); }}
                              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${playingAudioId === commentId ? 'bg-cyan-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                          >
                              {playingAudioId === commentId ? (
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                              ) : (
                                  <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                              )}
                          </button>
                          
                          <div className={`flex items-center gap-0.5 h-6 ${playingAudioId === commentId ? 'wave-active' : ''}`}>
                              {[...Array(15)].map((_, i) => (
                                  <div 
                                      key={i} 
                                      className={`wave-bar ${playingAudioId === commentId ? '' : 'bg-gray-600'}`}
                                      style={{ 
                                          height: playingAudioId === commentId ? undefined : `${30 + Math.random() * 40}%`,
                                          animationDelay: `${i * 0.08}s`,
                                          animationDuration: `${0.4 + Math.random() * 0.3}s`
                                      }}
                                  ></div>
                              ))}
                          </div>
                          
                          <span className="text-[10px] text-white/70 font-mono font-bold w-8 text-right">
                              {playingAudioId === commentId ? formatTime(currentAudioTime) : "0:15"}
                          </span>
                      </div>
                  ) : (
                      <div 
                          className="rounded-xl overflow-hidden border border-white/10 cursor-pointer active:scale-95 transition-transform" 
                          onClick={(e) => { e.stopPropagation(); setViewingImage(item.url); }}
                      >
                          <img src={item.url} className="w-full h-full object-cover max-h-[150px]" />
                      </div>
                  )}
              </div>
          );
      }

      // Multiple Items (Grid)
      return (
          <div className="mt-2 grid grid-cols-2 gap-1.5 max-w-[240px]">
              {items.map((item, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40">
                      {item.type === 'video' ? (
                          <video src={item.url} className="w-full h-full object-cover" controls />
                      ) : item.type === 'audio' ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800">
                              <span className="text-xl">🎤</span>
                          </div>
                      ) : (
                          <img 
                              src={item.url} 
                              className="w-full h-full object-cover cursor-pointer" 
                              onClick={(e) => { e.stopPropagation(); setViewingImage(item.url); }}
                          />
                      )}
                  </div>
              ))}
          </div>
      );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none">
        <style>{`
            @keyframes waveform {
                0%, 100% { height: 20%; }
                50% { height: 100%; }
            }
            .wave-bar {
                width: 2px;
                background-color: #06b6d4;
                border-radius: 9999px;
            }
            .wave-active .wave-bar {
                animation: waveform 0.5s ease-in-out infinite;
            }
        `}</style>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={onClose}></div>
        <div className="bg-[#121212] w-full h-[75vh] rounded-t-3xl flex flex-col pointer-events-auto animate-slide-up border-t border-gray-800 shadow-2xl relative z-10" onClick={() => { setShowEmojiPicker(false); setShowLangMenu(false); }}>
            {/* Handle */}
            <div className="w-full flex justify-center pt-3 pb-2" onClick={onClose}>
                <div className="w-12 h-1.5 bg-gray-600 rounded-full cursor-pointer hover:bg-gray-500 transition-colors"></div>
            </div>

            {/* Header */}
            <div className="flex justify-between items-center px-4 pb-3 border-b border-gray-800 relative h-12">
                {isMultiSelect ? (
                    <>
                        <button onClick={toggleMultiSelect} className="text-gray-400 font-bold text-sm hover:text-white">Cancel</button>
                        <h3 className="font-bold text-white text-sm tracking-wide">{selectedComments.size} Selected</h3>
                        {selectedComments.size > 0 ? (
                            <button onClick={handleDeleteSelected} className="p-2 text-red-500 hover:text-red-400 transition-colors bg-red-500/10 rounded-full">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        ) : <div className="w-8"></div>}
                    </>
                ) : (
                    <>
                        {/* Language Selector (Left) */}
                        <div className="relative">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowLangMenu(!showLangMenu); }}
                                className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-gray-300"
                            >
                                <span className="text-sm">{targetLang.flag}</span>
                                <span className="text-[9px] font-bold uppercase tracking-wider">{targetLang.code}</span>
                                <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {showLangMenu && (
                                <div className="absolute top-full left-0 mt-2 w-40 bg-[#1C2733] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto no-scrollbar">
                                    {LANGUAGES.map(lang => (
                                        <button 
                                            key={lang.code} 
                                            onClick={() => { setTargetLang(lang); setShowLangMenu(false); }}
                                            className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-white/5 transition-colors text-left ${targetLang.code === lang.code ? 'bg-white/5' : ''}`}
                                        >
                                            <span className="text-base">{lang.flag}</span>
                                            <span className={`text-[10px] font-bold uppercase tracking-wide ${targetLang.code === lang.code ? 'text-cyan-400' : 'text-gray-300'}`}>{lang.full}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <h3 className="font-black text-white text-sm tracking-wide">{comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)} comments</h3>
                        
                        <div className="flex gap-2">
                            <button onClick={toggleMultiSelect} className="text-[10px] font-bold text-cyan-400 bg-cyan-900/20 px-2 py-1 rounded hover:bg-cyan-900/40 transition-colors">Select</button>
                            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white transition-colors bg-white/5 rounded-full flex items-center justify-center">✕</button>
                        </div>
                    </>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                {comments.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 opacity-50">
                        <span className="text-4xl mb-2">💬</span>
                        <p className="text-sm font-medium">No comments yet.</p>
                        <p className="text-xs">Be the first to say something!</p>
                    </div>
                )}

                {comments.map(comment => {
                    const isSelected = selectedComments.has(comment.id);
                    return (
                    <div 
                        key={comment.id} 
                        className={`flex flex-col gap-3 animate-fade-in ${isMultiSelect ? 'cursor-pointer' : ''}`}
                        onTouchStart={() => handleCommentTouchStart(comment.id)}
                        onTouchEnd={handleCommentTouchEnd}
                        onMouseDown={() => handleCommentTouchStart(comment.id)}
                        onMouseUp={handleCommentTouchEnd}
                        onClick={() => isMultiSelect && handleSelectComment(comment.id)}
                    >
                        {/* Main Comment */}
                        <div className={`flex gap-3 p-2 rounded-xl transition-colors ${isSelected ? 'bg-cyan-900/20' : ''}`}>
                            {isMultiSelect && (
                                <div className="flex items-center justify-center shrink-0">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-cyan-500 border-cyan-500' : 'border-gray-600'}`}>
                                        {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                </div>
                            )}
                            <div className="relative shrink-0">
                                <img 
                                    src={comment.avatar} 
                                    className="w-9 h-9 rounded-full object-cover border border-gray-700 cursor-pointer" 
                                    onClick={(e) => {
                                        if(!isMultiSelect) {
                                            e.stopPropagation();
                                            onViewProfile && onViewProfile(comment.username)
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-bold text-gray-300">{comment.username}</span>
                                    <span className="text-[10px] text-gray-500">{comment.timestamp}</span>
                                    {comment.likes > 5 && <span className="bg-red-500/10 text-red-500 text-[9px] px-1 rounded font-bold">Top</span>}
                                </div>
                                
                                {comment.text && (
                                    <>
                                        <p className="text-sm text-white leading-snug break-words">
                                            {translatedComments[comment.id] || comment.text}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1">
                                            {!isMultiSelect && (
                                                <>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleTranslate(comment.id, comment.text!); }}
                                                        className="text-[10px] font-bold text-gray-500 hover:text-cyan-400 transition-colors flex items-center gap-1"
                                                    >
                                                        {translatingIds.has(comment.id) ? (
                                                            <span className="animate-pulse">Translating...</span>
                                                        ) : translatedComments[comment.id] ? (
                                                            'See Original'
                                                        ) : (
                                                            'See Translation'
                                                        )}
                                                    </button>
                                                    
                                                    {/* Read Aloud Button */}
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleSpeak(comment.id, translatedComments[comment.id] || comment.text!); }}
                                                        className={`text-[10px] font-bold transition-colors flex items-center gap-1 ${playingTTSId === comment.id ? 'text-green-400' : 'text-gray-500 hover:text-white'}`}
                                                    >
                                                    {playingTTSId === comment.id ? (
                                                        <>
                                                            <span className="animate-pulse">Playing</span>
                                                            <div className="flex gap-0.5 items-end h-2">
                                                                <div className="w-0.5 h-full bg-green-400 animate-pulse"></div>
                                                                <div className="w-0.5 h-2/3 bg-green-400 animate-pulse delay-75"></div>
                                                                <div className="w-0.5 h-full bg-green-400 animate-pulse delay-150"></div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                                            Read Aloud
                                                        </>
                                                    )}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                                
                                {/* Refactored Media Rendering */}
                                {renderMediaContent(comment.id, comment.attachments, comment.mediaUrl, comment.mediaType)}
                                
                                {!isMultiSelect && (
                                    <div className="flex items-center gap-4 mt-2">
                                        <button onClick={(e) => { e.stopPropagation(); initiateReply(comment, comment.id); }} className="text-xs font-bold text-gray-500 hover:text-cyan-400 transition-colors">Reply</button>
                                        <button onClick={(e) => { e.stopPropagation(); handleLikeComment(comment.id, false); }} className={`text-xs font-bold flex items-center gap-1 transition-colors ${comment.userReaction ? 'text-red-500' : 'text-gray-500 hover:text-white'}`}>
                                            {comment.userReaction ? '❤️' : '🤍'} {comment.likes || 0}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                            <div className="pl-12">
                                {!expandedReplies.has(comment.id) ? (
                                    <button onClick={(e) => { e.stopPropagation(); toggleReplies(comment.id); }} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors group">
                                        <div className="w-6 h-[1px] bg-gray-700 group-hover:bg-gray-500"></div>
                                        View {comment.replies.length} replies
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                ) : (
                                    <div className="flex flex-col gap-4 border-l-2 border-gray-800 pl-3">
                                        {comment.replies.map(reply => {
                                            const isReplySelected = selectedComments.has(reply.id);
                                            return (
                                            <div 
                                                key={reply.id} 
                                                className={`flex gap-3 animate-slide-up p-1.5 rounded-lg transition-colors ${isReplySelected ? 'bg-cyan-900/20' : ''}`}
                                                onTouchStart={() => handleCommentTouchStart(reply.id)}
                                                onTouchEnd={handleCommentTouchEnd}
                                                onMouseDown={() => handleCommentTouchStart(reply.id)}
                                                onMouseUp={handleCommentTouchEnd}
                                                onClick={(e) => { 
                                                    if (isMultiSelect) {
                                                        e.stopPropagation();
                                                        handleSelectComment(reply.id);
                                                    }
                                                }}
                                            >
                                                {isMultiSelect && (
                                                    <div className="flex items-center justify-center shrink-0">
                                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${isReplySelected ? 'bg-cyan-500 border-cyan-500' : 'border-gray-600'}`}>
                                                            {isReplySelected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                                                        </div>
                                                    </div>
                                                )}
                                                <img src={reply.avatar} className="w-6 h-6 rounded-full object-cover border border-gray-700 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-gray-400">{reply.username}</span>
                                                        <span className="text-[9px] text-gray-600">{reply.timestamp}</span>
                                                    </div>
                                                    
                                                    {reply.text && (
                                                        <>
                                                            <p className="text-xs text-gray-200 leading-snug break-words">
                                                                {translatedComments[reply.id] || reply.text}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                {!isMultiSelect && (
                                                                    <>
                                                                        <button 
                                                                            onClick={(e) => { e.stopPropagation(); handleTranslate(reply.id, reply.text!); }}
                                                                            className="text-[9px] font-bold text-gray-500 hover:text-cyan-400 transition-colors"
                                                                        >
                                                                            {translatingIds.has(reply.id) ? 'Translating...' : translatedComments[reply.id] ? 'See Original' : 'See Translation'}
                                                                        </button>
                                                                        <button 
                                                                            onClick={(e) => { e.stopPropagation(); handleSpeak(reply.id, translatedComments[reply.id] || reply.text!); }}
                                                                            className={`text-[9px] font-bold transition-colors flex items-center gap-1 ${playingTTSId === reply.id ? 'text-green-400' : 'text-gray-500 hover:text-white'}`}
                                                                        >
                                                                            {playingTTSId === reply.id ? (
                                                                                <span className="animate-pulse">Playing</span>
                                                                            ) : 'Read Aloud'}
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                    
                                                    {/* Refactored Media Rendering for Replies */}
                                                    {renderMediaContent(reply.id, reply.attachments, reply.mediaUrl, reply.mediaType as any)}

                                                    {!isMultiSelect && (
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            <button onClick={(e) => { e.stopPropagation(); handleLikeComment(reply.id, true, comment.id); }} className={`text-[10px] font-bold flex items-center gap-1 ${reply.userReaction ? 'text-red-500' : 'text-gray-500'}`}>
                                                                {reply.userReaction ? '❤️' : '🤍'} {reply.likes || 0}
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); initiateReply(reply, comment.id); }} className="text-[10px] font-bold text-gray-500 hover:text-cyan-400 transition-colors">Reply</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )})}
                                        <button onClick={(e) => { e.stopPropagation(); toggleReplies(comment.id); }} className="text-[10px] font-bold text-gray-600 hover:text-gray-400 self-start">Hide replies</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );})}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-gray-800 bg-[#121212] safe-area-bottom relative">
                
                {/* Replying Banner */}
                {replyingTo && (
                    <div className="flex justify-between items-center px-2 py-1 mb-2 bg-gray-900 rounded-lg text-xs text-gray-400 animate-slide-up">
                        <span>Replying to <span className="text-cyan-400 font-bold">@{replyingTo.username}</span></span>
                        <button onClick={() => setReplyingTo(null)} className="p-1 hover:text-white">✕</button>
                    </div>
                )}

                {/* Media Preview Banner (Multi-Select) */}
                {selectedMedia.length > 0 && (
                    <div className="mb-3 animate-slide-up">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 py-1">
                            {selectedMedia.map((media, index) => (
                                <div key={index} className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-white/10 group">
                                    {media.type === 'video' ? (
                                        <video src={media.preview} className="w-full h-full object-cover opacity-80" />
                                    ) : media.type === 'audio' ? (
                                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                            <span className="text-xl">🎤</span>
                                        </div>
                                    ) : (
                                        <img src={media.preview} className="w-full h-full object-cover" />
                                    )}
                                    
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                                    <button 
                                        onClick={() => removeMedia(index)} 
                                        className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 text-white hover:bg-red-500 transition-colors"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                            {/* Add More Button */}
                            <button 
                                onClick={() => fileInputRef.current?.click()} 
                                className="w-16 h-16 shrink-0 rounded-lg border-2 border-dashed border-gray-700 flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-white/50 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Attachment Menu Popup */}
                {showAttachMenu && (
                    <div className="absolute bottom-[70px] left-4 z-50 animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="bg-[#1C2733]/95 backdrop-blur-xl rounded-2xl border border-white/10 p-3 shadow-2xl flex gap-4">
                            <button onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }} className="flex flex-col items-center gap-2 group active:scale-95 transition-transform">
                                <div className="w-12 h-12 rounded-full bg-cyan-900/30 flex items-center justify-center border border-cyan-500/30 group-hover:bg-cyan-500/20 transition-colors">
                                    <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">Gallery</span>
                            </button>
                            <button onClick={() => { setShowGifPicker(true); setShowAttachMenu(false); }} className="flex flex-col items-center gap-2 group active:scale-95 transition-transform">
                                <div className="w-12 h-12 rounded-full bg-purple-900/30 flex items-center justify-center border border-purple-500/30 group-hover:bg-purple-500/20 transition-colors">
                                    <span className="font-black text-xs text-purple-400">GIF</span>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">Sticker</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Emoji Picker Popup */}
                {showEmojiPicker && (
                    <div 
                        className="absolute bottom-full left-0 right-0 mb-2 mx-2 bg-[#1C2733] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-slide-up h-48 overflow-y-auto no-scrollbar"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="grid grid-cols-8 gap-2">
                            {EMOJIS.map(emoji => (
                                <button 
                                    key={emoji} 
                                    onClick={(e) => { e.stopPropagation(); addEmoji(emoji); }} 
                                    className="text-2xl hover:bg-white/10 rounded p-1 transition-colors active:scale-90"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-end gap-2">
                    <button 
                        onClick={() => setShowAttachMenu(!showAttachMenu)} 
                        className="p-2.5 bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </button>

                    <div className={`flex-1 bg-gray-900 rounded-2xl flex items-end px-3 py-2 border transition-all ${isListening ? 'border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'border-gray-800 focus-within:border-cyan-500/50'}`}>
                        <input 
                            ref={inputRef}
                            type="text" 
                            value={newComment} 
                            onChange={(e) => setNewComment(e.target.value)} 
                            placeholder={isListening ? "Listening (Burmese)..." : "Add a comment..."} 
                            className={`bg-transparent text-white text-sm w-full outline-none py-1 max-h-24 resize-none ${isListening ? 'placeholder-cyan-400 animate-pulse' : 'placeholder-gray-500'}`}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button 
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                            className="p-1 text-gray-400 hover:text-yellow-400 transition-colors active:scale-95"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                    </div>

                    {newComment.trim() || selectedMedia.length > 0 ? (
                        <button 
                            onClick={handleSend} 
                            className="p-2.5 bg-cyan-600 rounded-full text-white shadow-lg shadow-cyan-600/30 active:scale-90 transition-all hover:bg-cyan-500"
                        >
                            <svg className="w-5 h-5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    ) : (
                        <button 
                            onMouseDown={handleMicDown} 
                            onMouseUp={handleMicUp} 
                            onTouchStart={handleMicDown} 
                            onTouchEnd={handleMicUp}
                            className={`p-2.5 rounded-full transition-all shadow-lg active:scale-90 ${isRecording ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)] scale-110 animate-pulse' : isListening ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Hidden Input for File Upload */}
            <input 
                type="file" 
                ref={fileInputRef} 
                multiple 
                accept="image/*,video/*" 
                className="hidden" 
                onChange={handleFileSelect} 
            />

            {showGifPicker && <GiphyPicker onClose={() => setShowGifPicker(false)} onSelect={handleGifSelection} />}
        </div>
    </div>
  );
};

export default CommentsSheet;
