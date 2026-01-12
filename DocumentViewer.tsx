
import React, { useState, useEffect, useMemo, useRef } from 'react';

interface DocumentViewerProps {
    fileName: string;
    onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ fileName, onClose }) => {
    const [page, setPage] = useState(1);
    const totalPages = 12;
    const [isLoading, setIsLoading] = useState(true);
    const [zoom, setZoom] = useState(100);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [showShareSheet, setShowShareSheet] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    
    // Voice Search State
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Determine if file is "previewable"
    const isPreviewable = useMemo(() => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        return ['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext || '');
    }, [fileName]);

    // Mock content for search simulation
    const pageContent = useMemo(() => {
        return [
            "Introduction to the Unified System Protocol V4.2",
            "Confidential Data Architecture and Neural Mapping",
            "End-to-End Encryption Standards for Global Communication",
            "Administrative Privileges and Access Control Lists",
            "Hardware Compatibility Layers for Quantum Interlink",
            "Emergency Protocol: Total Data Sanitization Procedures",
            "User Interface Guidelines for Holographic Displays",
            "Optimization of Distributed Ledger Transactions",
            "Security Audit Logs and Behavioral Analysis Modules",
            "Satellite Uplink Synchronization and Latency Management",
            "Integration with Legacy Mainframe Infrastructure",
            "Conclusion and Future Roadmap for UniLive Ecosystem"
        ];
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsListening(false);
            return;
        }

        if ('webkitSpeechRecognition' in window) {
            const recognition = new (window as any).webkitSpeechRecognition();
            recognitionRef.current = recognition;
            recognition.lang = 'my-MM'; // Defaulting to Burmese as per restoration request
            recognition.continuous = false;
            recognition.interimResults = true;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = (e: any) => {
                if (e.error !== 'no-speech') {
                    console.error("Speech error", e);
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
            alert("Voice search not supported.");
        }
    };

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2500);
    };

    const handleDownload = () => {
        showToast("Preparing Secure Download...");
        setTimeout(() => {
            const content = `File: ${fileName}\nSource: UniLive Secure Protocol\nTimestamp: ${new Date().toISOString()}\n\n-- CONFIDENTIAL CONTENT --`;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName.includes('.') ? fileName : `${fileName}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast("Asset saved to local storage.");
        }, 800);
    };

    const highlightText = (text: string, query: string) => {
        if (!query.trim()) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) => 
                    part.toLowerCase() === query.toLowerCase() ? 
                    <span key={i} className="bg-cyan-500 text-white px-0.5 rounded animate-pulse">{part}</span> : 
                    part
                )}
            </span>
        );
    };

    const fileMetadata = useMemo(() => ({
        type: fileName.split('.').pop()?.toUpperCase() || 'DAT',
        size: '4.82 MB',
        modified: new Date().toLocaleDateString(),
        owner: 'System Admin',
        encryption: 'AES-256-GCM',
        permissions: 'Read/Write/Share',
        checksum: '0x' + Math.floor(Math.random()*16777215).toString(16).toUpperCase()
    }), [fileName]);

    return (
        <div className="fixed inset-0 z-[400] bg-[#0B1017] flex flex-col animate-fade-in pointer-events-auto overflow-hidden">
            {/* Toast Message */}
            {toastMessage && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-cyan-600 text-white px-6 py-3 rounded-full shadow-2xl z-[700] font-bold text-sm animate-slide-up border border-cyan-400 backdrop-blur-md">
                    {toastMessage}
                </div>
            )}

            {/* Header */}
            <div className="h-16 flex items-center justify-between px-5 bg-[#17212B] border-b border-white/10 shadow-2xl relative z-[450]">
                <button onClick={onClose} className="p-2 -ml-2 text-gray-400 hover:text-white active:scale-90 transition-all">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </button>
                
                {/* Header Title with Avatar */}
                <div className="flex-1 flex items-center justify-center gap-3 cursor-pointer group px-4 overflow-hidden" onClick={() => setShowDetails(!showDetails)}>
                    <div className="w-8 h-8 rounded-full bg-cyan-900/30 border border-cyan-500/20 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h3 className="text-[13px] font-black text-white uppercase tracking-tight truncate group-hover:text-cyan-400 transition-colors">
                            {fileName}
                        </h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_5px_rgba(6,182,212,0.8)]"></span>
                            <p className="text-[8px] font-black text-cyan-400/60 uppercase tracking-[2px]">SECURE_PROTOCOL_V4.2</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-1">
                    {isPreviewable && (
                        <button onClick={() => setShowSearch(!showSearch)} className={`p-2 rounded-lg transition-colors ${showSearch ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </button>
                    )}
                    <button onClick={handleDownload} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg active:scale-95 transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                </div>
            </div>

            {/* SEARCH PANEL */}
            {showSearch && (
                <div className="bg-[#1C2733] px-5 py-3 border-b border-white/5 animate-fade-in flex items-center gap-3 relative z-[440]">
                    <div className={`flex-1 bg-black/30 rounded-xl px-4 py-2 border flex items-center gap-2 transition-all ${isListening ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/10'}`}>
                        {isListening ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin mr-2 shrink-0"></div> : <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                        <input 
                            autoFocus 
                            placeholder={isListening ? "Listening (Burmese)..." : "Find in document..."}
                            className={`bg-transparent border-none outline-none text-xs text-white w-full font-bold ${isListening ? 'placeholder-red-400 animate-pulse' : 'placeholder-gray-600'}`} 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {/* Mic Button */}
                        <button onClick={toggleListening} className={`p-1 rounded-full transition-colors active:scale-90 ${isListening ? 'text-red-500' : 'text-gray-500 hover:text-white'}`}>
                            {isListening ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
                        </button>
                        {searchQuery && !isListening && (
                            <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-white">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>
                    <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Done</button>
                </div>
            )}

            {/* DETAILS OVERLAY */}
            {showDetails && (
                <div className="absolute inset-0 z-[460] bg-black/60 backdrop-blur-md animate-fade-in flex items-center justify-center p-6" onClick={() => setShowDetails(false)}>
                    <div className="bg-[#17212B] w-full max-w-sm rounded-[32px] border border-white/10 p-8 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <h4 className="text-sm font-black text-white uppercase tracking-widest">Document Details</h4>
                            <button onClick={() => setShowDetails(false)} className="text-gray-500 hover:text-white p-1">✕</button>
                        </div>
                        
                        <div className="space-y-4">
                            {[
                                { label: 'Format', value: fileMetadata.type },
                                { label: 'File Size', value: fileMetadata.size },
                                { label: 'Security', value: fileMetadata.encryption },
                                { label: 'Last Modified', value: fileMetadata.modified },
                                { label: 'Integrity', value: fileMetadata.checksum },
                                { label: 'Permissions', value: fileMetadata.permissions }
                            ].map((detail, idx) => (
                                <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{detail.label}</span>
                                    <span className="text-xs font-bold text-cyan-400">{detail.value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-3">
                            <button onClick={handleDownload} className="py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white hover:bg-white/10 transition-all">Download</button>
                            <button onClick={() => { setShowDetails(false); setShowShareSheet(true); }} className="py-3 bg-cyan-600 rounded-xl text-[10px] font-black uppercase text-white shadow-lg shadow-cyan-900/40 active:scale-95 transition-all">Share File</button>
                        </div>
                    </div>
                </div>
            )}

            {/* SHARE SHEET OVERLAY */}
            {showShareSheet && (
                <div className="absolute inset-0 z-[500] bg-black/70 backdrop-blur-sm animate-fade-in flex items-end justify-center pointer-events-auto" onClick={() => setShowShareSheet(false)}>
                    <div className="bg-[#1C2733] w-full rounded-t-[40px] p-8 pb-12 animate-slide-up shadow-[0_-20px_60px_rgba(0,0,0,0.8)] border-t border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mb-8"></div>
                        <h3 className="text-white font-black uppercase tracking-[3px] text-center mb-10">Share Confidential Asset</h3>
                        
                        <div className="grid grid-cols-4 gap-6 mb-10">
                            {[
                                { id: 'wa', label: 'WhatsApp', color: 'bg-green-600', icon: 'M17 21l-7-7 7-7' },
                                { id: 'copy', label: 'Copy Link', color: 'bg-gray-700', icon: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z' },
                                { id: 'qr', label: 'QR Code', color: 'bg-cyan-600', icon: 'M12 4v1m6 11h2m-6 0h-2v4h2v-4z' },
                                { id: 'sys', label: 'System', color: 'bg-white text-black', icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' }
                            ].map(item => (
                                <button key={item.id} onClick={() => { setShowShareSheet(false); showToast(`Shared via ${item.label}`); }} className="flex flex-col items-center gap-3 active:scale-90 transition-transform">
                                    <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center shadow-2xl`}>
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                                    </div>
                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{item.label}</span>
                                </button>
                            ))}
                        </div>
                        
                        <button onClick={() => setShowShareSheet(false)} className="w-full py-4 bg-white/5 border border-white/5 rounded-2xl text-gray-400 text-xs font-black uppercase tracking-[2px]">Cancel</button>
                    </div>
                </div>
            )}

            {/* Viewer Content */}
            <div className={`flex-1 overflow-y-auto no-scrollbar relative flex flex-col items-center ${isPreviewable ? 'bg-[#0B1017]' : 'bg-[#0B1017]'}`}>
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-fade-in">
                        <div className="relative">
                            <div className="w-24 h-24 border-[3px] border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-10 h-10 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <span className="text-[12px] font-black text-white uppercase tracking-[6px] animate-pulse">Decrypting Asset</span>
                            <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 animate-progress origin-left"></div>
                            </div>
                            <div className="flex gap-4 mt-2">
                                <span className="text-[9px] font-mono text-cyan-500/40 tracking-tight">CRC32: {fileMetadata.checksum}</span>
                                <span className="text-[9px] font-mono text-cyan-500/40 tracking-tight">SIZE: {fileMetadata.size}</span>
                            </div>
                        </div>
                    </div>
                ) : isPreviewable ? (
                    <div className="w-full flex flex-col items-center gap-10 py-10 px-4 transition-transform duration-300 ease-out" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
                        <div className={`w-full max-w-2xl aspect-[1/1.414] rounded-lg shadow-2xl transition-all border border-white/10 p-12 flex flex-col gap-8 relative overflow-hidden animate-fade-in ${isDarkMode ? 'bg-[#1C2733] text-gray-300 border-white/5' : 'bg-white text-gray-800'}`}>
                            <div className={`h-1 w-full absolute top-0 left-0 bg-gradient-to-r ${isDarkMode ? 'from-cyan-900' : 'from-cyan-500'} to-transparent opacity-30`}></div>
                            
                            {/* Page Header */}
                            <div className="flex justify-between items-start">
                                <div className={`h-5 rounded w-3/4 ${isDarkMode ? 'bg-white/10' : 'bg-gray-100'} flex items-center px-3`}>
                                    <span className="text-[10px] font-black uppercase tracking-widest truncate">{highlightText(pageContent[page-1], searchQuery)}</span>
                                </div>
                                <div className={`text-[9px] font-bold ${isDarkMode ? 'text-cyan-500/50' : 'text-cyan-600/50'}`}>#{page.toString().padStart(3, '0')}</div>
                            </div>

                            {/* Body Simulation */}
                            <div className="space-y-6">
                                {[...Array(5)].map((_, j) => (
                                    <div key={j} className="space-y-2">
                                        <div className={`h-2.5 rounded-full w-full ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`} style={{ width: `${85 + Math.random() * 15}%` }}></div>
                                        <div className={`h-2.5 rounded-full w-2/3 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`} style={{ width: `${60 + Math.random() * 20}%` }}></div>
                                    </div>
                                ))}
                            </div>

                            {/* Image/Asset Simulation */}
                            <div className={`h-48 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center gap-4 transition-colors ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-gray-50/50 border-gray-100'}`}>
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/5 text-cyan-500/30' : 'bg-white text-gray-200'}`}>
                                    <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-[4px] text-white/10">Unified_Asset_Ref_{page}.bin</span>
                            </div>

                            {/* More Text */}
                            <div className="space-y-4">
                                {[...Array(3)].map((_, j) => (
                                    <div key={j} className={`h-2 rounded-full w-full ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`} style={{ width: `${70 + Math.random() * 30}%` }}></div>
                                ))}
                            </div>

                            <div className={`absolute bottom-8 right-12 text-[10px] font-black uppercase tracking-widest border-b pb-1 ${isDarkMode ? 'text-white/20 border-white/5' : 'text-gray-300 border-gray-100'}`}>
                                Page {page} of {totalPages}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* NON-PREVIEWABLE FILE VIEW */
                    <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in w-full max-w-sm">
                        <div className="w-full bg-[#17212B] rounded-[32px] p-10 flex flex-col items-center gap-6 border border-white/10 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
                            
                            <div className="w-24 h-24 bg-black/40 rounded-full flex items-center justify-center text-gray-500">
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            
                            <div className="text-center">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Preview Unavailable</h3>
                                <p className="text-[10px] text-gray-500 font-medium max-w-[200px] leading-relaxed">This file type requires external software or specific biometric clearance.</p>
                            </div>

                            <button onClick={handleDownload} className="w-full py-4 bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[2px] text-white">
                                Download to Device
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            {isPreviewable && (
                <div className="h-20 bg-[#17212B] border-t border-white/10 flex items-center justify-between px-6 safe-area-bottom z-[450]">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setPage(Math.max(1, page - 1))} className="p-3 bg-black/30 rounded-xl text-gray-400 hover:text-white disabled:opacity-30 active:scale-95 transition-all" disabled={page === 1}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="text-xs font-black text-white/50 w-8 text-center">{page}/{totalPages}</span>
                        <button onClick={() => setPage(Math.min(totalPages, page + 1))} className="p-3 bg-black/30 rounded-xl text-gray-400 hover:text-white disabled:opacity-30 active:scale-95 transition-all" disabled={page === totalPages}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 rounded-xl transition-all ${isDarkMode ? 'bg-yellow-500/10 text-yellow-500' : 'bg-black/30 text-gray-400'}`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </button>
                        <div className="h-8 w-[1px] bg-white/10"></div>
                        <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="p-3 bg-black/30 rounded-xl text-gray-400 hover:text-white active:scale-95 transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg></button>
                        <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="p-3 bg-black/30 rounded-xl text-gray-400 hover:text-white active:scale-95 transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentViewer;
