
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LANGUAGES, MOCK_POSTS } from '../constants';
import { Post, User, UserLink, MainTab } from '../types';
import FeedItem from '../components/FeedItem';
import CommentsSheet from '../components/CommentsSheet';
import ShareSheet from '../components/ShareSheet';
import QRScanner from '../components/QRScanner';
import FindFriends from '../components/FindFriends';
import MediaViewer from '../components/MediaViewer';

interface ProfileProps {
  onToggleNav: (visible: boolean) => void;
  onNavigateToChat: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
  currentUser: User;
  onUpdateUser: (u: Partial<User>) => void;
  userRegistry?: Record<string, any>;
  onFollowUser?: (userId: string) => void;
  onTabChange?: (tab: MainTab) => void;
}

interface ListUser {
    id: string;
    username: string;
    name: string;
    avatar: string;
    isFollowing: boolean;
    followsMe?: boolean;
    subText?: string;
}

// --- SUB-COMPONENTS ---

const ProfileViewsSheet: React.FC<{ isOpen: boolean; visitors: ListUser[]; onClose: () => void; onViewProfile?: (userId: string) => void; onFollowToggle: (userId: string) => void; }> = ({ isOpen, visitors, onClose, onViewProfile, onFollowToggle }) => { 
    if (!isOpen) return null; 
    return (
        <div className="fixed inset-0 z-[120] flex items-end justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-[#121212] w-full h-[80vh] rounded-t-3xl flex flex-col overflow-hidden animate-slide-up text-white shadow-2xl relative z-10 border-t border-gray-800">
                <div className="flex justify-between items-center p-4 border-b border-gray-800 shrink-0">
                    <div className="w-10"></div>
                    <h3 className="font-bold">Profile Views</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">✕</button>
                </div>
                <div className="p-4 bg-blue-600/10 border-b border-blue-500/20 text-center">
                    <p className="text-[11px] text-blue-400 font-medium italic">People who viewed your profile in the last 30 days will appear here.</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar pb-20">
                    {visitors.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500 opacity-50">
                            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            <span className="text-sm">No recent visitors</span>
                        </div>
                    ) : visitors.map((visitor) => (
                        <div key={visitor.id} className="flex items-center justify-between animate-fade-in">
                            <div className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0" onClick={() => { onClose(); onViewProfile?.(visitor.id); }}>
                                <div className="w-12 h-12 rounded-full p-[1.5px] bg-gradient-to-tr from-cyan-500 to-purple-600 transition-transform group-active:scale-95">
                                    <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-gray-900"><img src={visitor.avatar} className="w-full h-full object-cover" /></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold group-hover:text-cyan-400 transition-colors truncate">{visitor.name}</h4>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[11px] text-gray-500 truncate">@{visitor.username}</p>
                                        <span className="text-[10px] text-gray-600">•</span>
                                        <p className="text-[11px] text-gray-500 whitespace-nowrap">{visitor.subText}</p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); onFollowToggle(visitor.id); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-lg ${visitor.isFollowing ? 'bg-gray-800 text-gray-300 border border-gray-700 shadow-none' : 'bg-cyan-600 text-white shadow-cyan-900/20 hover:bg-cyan-500'}`}>
                                {visitor.isFollowing ? 'Unfollow' : (visitor.followsMe ? 'Follow Back' : 'Follow')}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    ); 
};

const AnalyticsSheet: React.FC<{ user: User; onClose: () => void }> = ({ user, onClose }) => { 
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CONTENT' | 'AUDIENCE'>('OVERVIEW'); 
    const [dateRange, setDateRange] = useState<'7D' | '30D' | '90D'>('7D'); 
    const [isDownloading, setIsDownloading] = useState(false); 
    const [isRefreshing, setIsRefreshing] = useState(false); 
    const [previewMedia, setPreviewMedia] = useState<{url: string, type: 'video' | 'image'} | null>(null); 
    
    const multiplier = useMemo(() => { 
        if (dateRange === '90D') return 12; 
        if (dateRange === '30D') return 4; 
        return 1; 
    }, [dateRange]); 
    
    const handleDownload = () => { 
        setIsDownloading(true); 
        setTimeout(() => { setIsDownloading(false); alert('Report successfully downloaded to your device! 📄'); }, 2000); 
    }; 
    
    useEffect(() => { 
        setIsRefreshing(true); 
        const timer = setTimeout(() => setIsRefreshing(false), 600); 
        return () => clearTimeout(timer); 
    }, [dateRange, activeTab]); 
    
    const overviewStats = useMemo(() => [
        { label: 'Video Views', value: (45.2 * multiplier).toFixed(1) + 'K', growth: multiplier > 1 ? '+15.2%' : '+12.4%', color: 'text-green-500' }, 
        { label: 'Profile Views', value: (8.1 * multiplier).toFixed(1) + 'K', growth: multiplier > 4 ? '+24.1%' : '+5.1%', color: 'text-green-500' }, 
        { label: 'Follower Growth', value: '+' + (1.2 * multiplier).toFixed(1) + 'K', growth: '+2.3%', color: 'text-cyan-500' }, 
        { label: 'Avg. Watch Time', value: (24 + (multiplier > 1 ? 4 : 0)) + 's', growth: multiplier > 1 ? '+0.8%' : '-1.2%', color: multiplier > 1 ? 'text-green-500' : 'text-red-500' }
    ], [multiplier]); 
    
    const contentStats = useMemo(() => [
        { id: 'c1', type: 'video', views: (12.4 * multiplier).toFixed(1) + 'K', likes: (2.1 * multiplier).toFixed(1) + 'K', comments: Math.floor(450 * multiplier), thumbnail: 'https://picsum.photos/seed/c1/100', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' }, 
        { id: 'c2', type: 'image', views: (8.2 * multiplier).toFixed(1) + 'K', likes: (1.4 * multiplier).toFixed(1) + 'K', comments: Math.floor(120 * multiplier), thumbnail: 'https://picsum.photos/seed/c2/300/400', url: 'https://picsum.photos/seed/c2/600/800' }, 
        { id: 'c3', type: 'video', views: (6.9 * multiplier).toFixed(1) + 'K', likes: Math.floor(900 * multiplier), comments: Math.floor(88 * multiplier), thumbnail: 'https://picsum.photos/seed/c3/100', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' }
    ], [multiplier]); 
    
    const audienceData = useMemo(() => [
        { label: 'United States', percentage: dateRange === '90D' ? 42 : 45 }, 
        { label: 'United Kingdom', percentage: dateRange === '7D' ? 18 : 20 }, 
        { label: 'Germany', percentage: 12 }, 
        { label: 'Others', percentage: dateRange === '90D' ? 34 : 25 }
    ], [dateRange]); 
    
    const barChartData = useMemo(() => { 
        const count = 10; 
        return Array.from({ length: count }).map((_, i) => { 
            const base = (i * 7 + 20) % 70 + 20; 
            const variance = (Math.sin(i + (dateRange === '30D' ? 2 : dateRange === '90D' ? 5 : 0)) * 15); 
            return Math.min(95, Math.max(10, base + variance)); 
        }); 
    }, [dateRange]); 
    
    return (
        <div className="fixed inset-0 z-[150] flex items-end justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose}></div>
            <div className="bg-[#121212] w-full h-[90vh] rounded-t-[40px] flex flex-col overflow-hidden animate-slide-up text-white shadow-2xl relative z-10 border-t border-gray-800">
                {previewMedia && <MediaViewer url={previewMedia.url} type={previewMedia.type as any} onClose={() => setPreviewMedia(null)} />}
                <div className="flex justify-between items-center p-6 shrink-0 bg-[#181818]">
                    <div className="flex flex-col"><h3 className="text-xl font-black tracking-tight">Creator Analytics</h3><p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Performance Dashboard</p></div>
                    <button onClick={onClose} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div className="flex px-6 gap-6 border-b border-gray-800 shrink-0 bg-[#181818]">
                    {['OVERVIEW', 'CONTENT', 'AUDIENCE'].map((tab) => (<button key={tab} onClick={() => setActiveTab(tab as any)} className={`py-3 text-[11px] font-black tracking-widest transition-all relative ${activeTab === tab ? 'text-white' : 'text-gray-500'}`}>{tab}{activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500 rounded-t-full"></div>}</button>))}
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-24 relative">
                    {isRefreshing && <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex items-center justify-center animate-fade-in"><div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>}
                    <div className="flex justify-between items-center bg-gray-900/50 p-2 rounded-2xl border border-gray-800">
                        <span className="text-[10px] font-black text-gray-500 uppercase ml-3">Timeframe</span>
                        <div className="flex bg-black/40 p-1 rounded-xl">
                            {['7D', '30D', '90D'].map((range) => (<button key={range} onClick={() => setDateRange(range as any)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${dateRange === range ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-500'}`}>{range}</button>))}
                        </div>
                    </div>
                    {activeTab === 'OVERVIEW' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-2 gap-4">
                                {overviewStats.map((stat, i) => (<div key={i} className="bg-gray-900/40 p-5 rounded-[24px] border border-gray-800 flex flex-col gap-1 shadow-inner"><span className="text-[10px] text-gray-500 font-black uppercase tracking-wider">{stat.label}</span><div className="flex items-end justify-between"><span className="text-2xl font-black">{stat.value}</span><span className={`text-[10px] font-black ${stat.color}`}>{stat.growth}</span></div></div>))}
                            </div>
                            <div className="bg-gray-900/40 p-6 rounded-[32px] border border-gray-800 relative overflow-hidden">
                                <div className="flex justify-between items-center mb-8"><div className="flex flex-col"><h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Profile Engagement</h4><p className="text-[8px] text-gray-500 mt-1 font-bold">Daily interactions vs views</p></div><span className="text-[10px] text-green-500 font-black">+{multiplier * 8}% Total</span></div>
                                <div className="flex items-end justify-between h-32 px-2 gap-1.5">
                                    {barChartData.map((h, i) => (<div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"><div className="relative w-full h-full flex items-end"><div className={`w-full rounded-t-lg transition-all duration-1000 ${i === 5 ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-gray-800 group-hover:bg-gray-700'}`} style={{ height: `${h}%` }}></div><div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-[8px] font-black px-1.5 py-0.5 rounded pointer-events-none">{h}%</div></div><span className="text-[8px] text-gray-600 font-black">Day {i + 1}</span></div>))}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'CONTENT' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex justify-between items-end mb-4"><h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Top Performing Posts</h4><span className="text-[10px] text-gray-600 font-bold uppercase">Tap to playback</span></div>
                            {contentStats.map((post, idx) => (
                                <div key={post.id} onClick={() => setPreviewMedia({url: post.url, type: post.type as any})} className="bg-gray-900/40 p-3 rounded-2xl border border-gray-800 flex gap-4 items-center group active:scale-[0.98] transition-all cursor-pointer">
                                    <div className="relative"><div className="w-16 h-16 rounded-xl overflow-hidden relative border border-gray-800"><img src={post.thumbnail} className="w-full h-full object-cover" />{post.type === 'video' && <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.333-5.89a1.5 1.5 0 000-2.538L6.3 2.841z" /></svg></div>}</div><div className="absolute -top-2 -left-2 w-6 h-6 bg-black border border-gray-800 rounded-full flex items-center justify-center text-[10px] font-black text-cyan-400">{idx + 1}</div></div>
                                    <div className="flex-1"><div className="flex justify-between items-center mb-1"><span className="text-sm font-black">{post.views} Views</span><span className={`text-[10px] font-black ${idx === 0 ? 'text-cyan-500' : 'text-gray-500'}`}>{idx === 0 ? 'Trending' : 'High Reach'}</span></div><div className="flex gap-4"><div className="flex items-center gap-1"><span className="text-[10px] text-gray-500">❤️</span><span className="text-[10px] font-bold text-gray-400">{post.likes}</span></div><div className="flex items-center gap-1"><span className="text-[10px] text-gray-500">💬</span><span className="text-[10px] font-bold text-gray-400">{post.comments}</span></div></div></div>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'AUDIENCE' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="bg-gray-900/40 p-6 rounded-[32px] border border-gray-800"><h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Audience Origins</h4><div className="space-y-5">{audienceData.map((data) => (<div key={data.label} className="space-y-2"><div className="flex justify-between text-[10px] font-black uppercase tracking-tighter"><span>{data.label}</span><span className="text-cyan-500">{data.percentage}%</span></div><div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-cyan-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${data.percentage}%` }}></div></div></div>))}</div></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-900/40 p-5 rounded-3xl border border-gray-800"><h5 className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Age Range</h5><div className="text-xl font-black">{dateRange === '90D' ? '18 - 34' : '18 - 24'}</div><p className="text-[9px] text-cyan-400 font-bold mt-1">{60 + (multiplier * 2)}% of total</p></div>
                                <div className="bg-gray-900/40 p-5 rounded-3xl border border-gray-800"><h5 className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Primary Gender</h5><div className="text-xl font-black">{dateRange === '7D' ? 'Female' : 'Mixed'}</div><p className="text-[9px] text-purple-400 font-bold mt-1">Growing segment</p></div>
                            </div>
                        </div>
                    )}
                    <button onClick={handleDownload} disabled={isDownloading} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[2px] transition-all flex items-center justify-center gap-2 ${isDownloading ? 'bg-gray-800 text-gray-600' : 'bg-white text-black active:scale-95 shadow-lg shadow-white/5'}`}>{isDownloading ? <><div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>Generating Report...</> : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Export Detailed Report (PDF)</>}</button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent pointer-events-none"><p className="text-[8px] text-gray-600 text-center font-black uppercase tracking-[3px]">Verified Creator Metrics • Unilive Insights</p></div>
            </div>
        </div>
    ); 
};

const EditProfileSheet: React.FC<{ user: User; onClose: () => void; onUpdate: (u: Partial<User>) => void }> = ({ user, onClose, onUpdate }) => { 
    const [view, setView] = useState<'MAIN' | 'LINKS' | 'CATEGORY'>('MAIN'); 
    const [username, setUsername] = useState(user.username); 
    const [bio, setBio] = useState(user.bio); 
    const [category, setCategory] = useState(user.category); 
    const [links, setLinks] = useState<UserLink[]>(user.links); 
    const [avatar, setAvatar] = useState(user.avatar); 
    const fileInputRef = useRef<HTMLInputElement>(null); 
    const CATEGORY_OPTIONS = ['Entertainment', 'Gaming', 'Education', 'Lifestyle', 'Tech', 'Music', 'Comedy']; 
    
    const handleSave = () => { onUpdate({ username, bio, category, links, avatar }); onClose(); }; 
    const addLink = () => { setLinks([...links, { id: Date.now().toString(), title: '', url: '' }]); }; 
    const updateLink = (id: string, field: 'title' | 'url', val: string) => { setLinks(links.map(l => l.id === id ? { ...l, [field]: val } : l)); }; 
    const removeLink = (id: string) => { setLinks(links.filter(l => l.id !== id)); }; 
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) setAvatar(URL.createObjectURL(e.target.files[0])); }; 
    
    return (
        <div className="fixed inset-0 z-[120] flex items-end justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-[#121212] w-full h-[90vh] rounded-t-3xl flex flex-col overflow-hidden animate-slide-up text-white shadow-2xl relative z-10">
                <div className="flex justify-between items-center p-4 border-b border-gray-800 shrink-0">
                    <button onClick={view === 'MAIN' ? onClose : () => setView('MAIN')} className="text-sm font-medium text-gray-400">{view === 'MAIN' ? 'Cancel' : 'Back'}</button>
                    <h3 className="font-bold">{view === 'MAIN' ? 'Edit Profile' : view === 'LINKS' ? 'Add Links' : 'Category'}</h3>
                    {view === 'MAIN' ? (<button onClick={handleSave} className="text-sm font-bold text-cyan-500">Save</button>) : <div className="w-10"></div>}
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-20">
                    {view === 'MAIN' && (
                        <>
                            <div className="flex flex-col items-center">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-700 relative"><img src={avatar} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div></div>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                </div>
                                <button className="text-xs text-cyan-500 font-bold mt-3" onClick={() => fileInputRef.current?.click()}>Change Photo</button>
                            </div>
                            <div className="space-y-6">
                                <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Username</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 focus:border-cyan-500 outline-none" /></div>
                                <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Bio</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={80} rows={3} className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 focus:border-cyan-500 outline-none resize-none text-sm" placeholder="Tell us about yourself..." /><div className="text-[10px] text-right text-gray-500 mt-1">{bio.length}/80</div></div>
                            </div>
                            <div className="space-y-4">
                                <button onClick={() => setView('LINKS')} className="w-full flex items-center justify-between p-4 bg-gray-900 rounded-xl border border-gray-800 hover:bg-gray-800 transition-colors"><span className="text-sm font-medium">Add Links</span><div className="flex items-center gap-2"><span className="text-xs text-gray-500">{links.length} links</span><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></div></button>
                                <button onClick={() => setView('CATEGORY')} className="w-full flex items-center justify-between p-4 bg-gray-900 rounded-xl border border-gray-800 hover:bg-gray-800 transition-colors"><span className="text-sm font-medium">Category</span><span className="text-sm text-gray-500 flex items-center gap-1">{category} <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></span></button>
                            </div>
                        </>
                    )}
                    {view === 'LINKS' && (
                        <div className="space-y-6 animate-fade-in">
                            <button onClick={addLink} className="w-full py-4 border-2 border-dashed border-gray-700 rounded-xl text-gray-400 flex items-center justify-center gap-2 hover:border-cyan-500 hover:text-cyan-400 transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg><span className="font-bold text-sm">Add New Link</span></button>
                            {links.map((link) => (
                                <div key={link.id} className="bg-gray-900 p-4 rounded-2xl border border-gray-800 space-y-3 relative">
                                    <button onClick={() => removeLink(link.id)} className="absolute top-2 right-2 text-gray-500 p-1 hover:text-red-500">✕</button>
                                    <input type="text" placeholder="Title (e.g. My Website)" value={link.title} onChange={(e) => updateLink(link.id, 'title', e.target.value)} className="w-full bg-black/30 border border-gray-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500" />
                                    <input type="text" placeholder="URL (e.g. site.com/user)" value={link.url} onChange={(e) => updateLink(link.id, 'url', e.target.value)} className="w-full bg-black/30 border border-gray-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500 text-cyan-400" />
                                </div>
                            ))}
                            <button onClick={() => setView('MAIN')} className="w-full bg-cyan-600 py-3 rounded-xl font-bold text-sm">Done</button>
                        </div>
                    )}
                    {view === 'CATEGORY' && (
                        <div className="space-y-1 animate-fade-in">
                            {CATEGORY_OPTIONS.map(opt => (
                                <button key={opt} onClick={() => { setCategory(opt); setView('MAIN'); }} className={`w-full p-4 flex items-center justify-between rounded-xl transition-colors ${category === opt ? 'bg-cyan-600/20 text-cyan-400' : 'hover:bg-gray-800'}`}><span className="font-medium">{opt}</span>{category === opt && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}</button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    ); 
};

const SettingsSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [view, setView] = useState<'MAIN' | 'LANGUAGE'>('MAIN');
    const [currentLang, setCurrentLang] = useState(localStorage.getItem('app_language') || 'English');

    const handleLanguageSelect = (lang: string) => {
        setCurrentLang(lang);
        localStorage.setItem('app_language', lang);
        setView('MAIN');
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-end justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-[#181818] w-full h-[70vh] rounded-t-3xl flex flex-col overflow-hidden animate-slide-up relative z-10 text-white border-t border-gray-800">
                <div className="w-full flex justify-center pt-3 pb-2 bg-[#181818]">
                    <div className="w-12 h-1.5 bg-gray-600 rounded-full"></div>
                </div>
                
                {view === 'MAIN' ? (
                    <>
                        <div className="px-4 pb-4 border-b border-gray-800 text-center relative">
                            <h3 className="font-bold">Settings</h3>
                            <button onClick={onClose} className="absolute right-4 top-0 text-gray-400">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            <div className="p-3 bg-gray-900/50 rounded-lg flex items-center gap-3 border border-gray-800">
                                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium">Creator Wallet</h4>
                                    <p className="text-xs text-gray-400">Balance: 1,540 Coins</p>
                                </div>
                                <button className="bg-cyan-600 text-[10px] font-bold px-3 py-1.5 rounded-full">Payout</button>
                            </div>
                            
                            <button onClick={() => setView('LANGUAGE')} className="w-full p-3 hover:bg-gray-800 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                    </svg>
                                    <span className="font-medium">Language</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">{currentLang}</span>
                                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </button>

                            <button className="w-full p-3 hover:bg-gray-800 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3 text-red-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    <span className="font-medium">Log Out</span>
                                </div>
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="px-4 pb-4 border-b border-gray-800 flex items-center relative">
                            <button onClick={() => setView('MAIN')} className="text-gray-400 mr-4">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <h3 className="font-bold">Language</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-1">
                            {LANGUAGES.map(lang => (
                                <button 
                                    key={lang.code} 
                                    onClick={() => handleLanguageSelect(lang.full)}
                                    className="w-full p-3 hover:bg-gray-800 rounded-lg flex items-center justify-between"
                                >
                                    <span className="flex items-center gap-3">
                                        <span className="text-xl">{lang.flag}</span>
                                        <span>{lang.full}</span>
                                    </span>
                                    {currentLang === lang.full && <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// --- MAIN PROFILE COMPONENT ---

const Profile: React.FC<ProfileProps> = ({ onToggleNav, onNavigateToChat, onViewProfile, currentUser, onUpdateUser, userRegistry, onFollowUser, onTabChange }) => {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showProfileViews, setShowProfileViews] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [sharingPost, setSharingPost] = useState<Post | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showFindFriends, setShowFindFriends] = useState(false);
  const [activeGridTab, setActiveGridTab] = useState<'POSTS' | 'PRIVATE'>('POSTS');
  const [isMuted, setIsMuted] = useState(false);
  const [isImmersive, setIsImmersive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // State for Lists (Following, Followers, Likes)
  const [showListType, setShowListType] = useState<'FOLLOWING' | 'FOLLOWERS' | 'LIKES' | null>(null);
  const [listUsers, setListUsers] = useState<ListUser[]>([]);

  // State for Profile Visitors
  const [profileVisitors, setProfileVisitors] = useState<ListUser[]>([]);

  // Manage user's posts locally to allow toggling privacy. 
  const [myPosts, setMyPosts] = useState<Post[]>(() => 
      MOCK_POSTS.map((p, i) => ({
          ...p,
          id: `my_post_${i}`,
          username: currentUser.username,
          userAvatar: currentUser.avatar,
          isPrivate: i % 4 === 0 
      }))
  );

  useEffect(() => {
      setMyPosts(prev => prev.map(p => ({
          ...p,
          username: currentUser.username,
          userAvatar: currentUser.avatar
      })));
  }, [currentUser.username, currentUser.avatar]);

  useEffect(() => {
    const isFullScreen = selectedPostId !== null || showSettings || showEditProfile || showAnalytics || showProfileViews || showComments || sharingPost || showQRScanner || showFindFriends || showListType !== null;
    onToggleNav(!isFullScreen);
  }, [selectedPostId, showSettings, showEditProfile, showAnalytics, showProfileViews, showComments, sharingPost, showQRScanner, showFindFriends, showListType, onToggleNav]);

  // Handle list data generation when tab opens
  useEffect(() => {
      if (showListType) {
          const type = showListType;
          const users = Array.from({ length: 15 }).map((_, i) => {
              const id = `u${i + 1}`; // Use IDs that might exist in registry
              const registryUser = userRegistry?.[id];
              return {
                  id: registryUser ? registryUser.id : `profile_list_${type}_${i}`,
                  username: registryUser ? registryUser.username : `${type.toLowerCase()}_user_${100 + i}`,
                  name: registryUser ? registryUser.name : ['Sarah Jenkins', 'Mike Ross', 'Jessica Pearson'][i % 3] + (i > 2 ? ` ${i}` : ''),
                  avatar: registryUser ? registryUser.avatar : `https://picsum.photos/seed/profile_list_${type}_${i}/100`,
                  isFollowing: registryUser ? registryUser.isFollowing : (type === 'FOLLOWING' ? true : false),
                  subText: type === 'LIKES' ? `Liked ${Math.floor(Math.random() * 5) + 1} of your posts` : undefined
              };
          });
          setListUsers(users);
      } else {
          setListUsers([]);
      }
  }, [showListType, userRegistry]);

  // Initialize Profile Visitors Mock Data
  useEffect(() => {
      if (showProfileViews && profileVisitors.length === 0) {
          const visitors = [
              { id: 'u1', name: 'Jessica Pearson', username: 'j_pearson', avatar: 'https://picsum.photos/seed/u1/100', isFollowing: false, followsMe: true, subText: '2m ago' },
              { id: 'u2', name: 'Harvey Specter', username: 'h_specter', avatar: 'https://picsum.photos/seed/u2/100', isFollowing: false, followsMe: true, subText: 'Yesterday' }
          ].map(v => {
              // Sync with registry if exists
              const regUser = userRegistry?.[v.id];
              return regUser ? { ...v, isFollowing: regUser.isFollowing } : v;
          });
          setProfileVisitors(visitors);
      }
  }, [showProfileViews, userRegistry]);

  const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 2000);
  };

  const handleUpdateUser = (updated: Partial<User>) => {
      onUpdateUser(updated);
      showToast('Profile updated! ✨');
  };

  const togglePostPrivacy = (postId: string) => {
      setMyPosts(prev => prev.map(p => {
          if (p.id === postId) {
              const newState = !p.isPrivate;
              showToast(newState ? 'Post hidden to private vault 🔒' : 'Post unhidden to public feed 🌐');
              return { ...p, isPrivate: newState };
          }
          return p;
      }));
  };

  const handleListUserFollowToggle = (userId: string) => {
      // Call global handler
      if (onFollowUser) onFollowUser(userId);
      
      // Update local optimistic state for smoother UI
      setListUsers(prev => prev.map(u => {
          if (u.id === userId) {
              const newStatus = !u.isFollowing;
              // showToast(newStatus ? `Following @${u.username}` : `Unfollowed @${u.username}`); // Optional toast
              return { ...u, isFollowing: newStatus };
          }
          return u;
      }));
  };

  const handleVisitorFollowToggle = (userId: string) => {
      if (onFollowUser) onFollowUser(userId);
      
      setProfileVisitors(prev => prev.map(v => {
          if (v.id === userId) {
              const newStatus = !v.isFollowing;
              return { ...v, isFollowing: newStatus };
          }
          return v;
      }));
  };

  const filteredPosts = useMemo(() => {
      return myPosts.filter(p => activeGridTab === 'PRIVATE' ? p.isPrivate : !p.isPrivate);
  }, [myPosts, activeGridTab]);

  if (selectedPostId !== null) {
      const post = myPosts.find(p => p.id === selectedPostId);
      if (!post) return null;
      return (
          <div className="h-full w-full bg-black relative animate-fade-in flex flex-col z-50">
               {!isImmersive && (
                   <div className="h-14 flex items-center px-4 absolute top-0 left-0 right-0 z-[60] bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300">
                      <button onClick={() => setSelectedPostId(null)} className="mr-4 text-white p-2 bg-black/20 rounded-full backdrop-blur-sm pointer-events-auto active:scale-90 transition-transform">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <span className="font-bold text-white text-shadow flex-1">{post.isPrivate ? 'Private Content' : 'Public Post'}</span>
                      <button 
                        onClick={() => togglePostPrivacy(post.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border transition-all active:scale-95 ${post.isPrivate ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/10 border-white/20 text-white'}`}
                      >
                           {post.isPrivate ? (
                               <>
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                   <span className="text-xs font-bold uppercase tracking-wider">Unhide</span>
                               </>
                           ) : (
                               <>
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                   <span className="text-xs font-bold uppercase tracking-wider">Hide</span>
                               </>
                           )}
                      </button>
                  </div>
               )}
              <div className="flex-1 bg-black relative">
                  <FeedItem 
                    post={post} 
                    isActive={true} 
                    isMuted={isMuted} 
                    onToggleMute={() => setIsMuted(!isMuted)} 
                    onCommentClick={() => !post.isPrivate && setShowComments(true)} 
                    onShareClick={() => setSharingPost(post)} 
                    onToggleImmersive={(v) => setIsImmersive(v ?? !isImmersive)} 
                    isImmersive={isImmersive} 
                    onViewProfile={onViewProfile} 
                    onRestoreFromPiP={() => onTabChange && onTabChange(MainTab.PROFILE)} 
                  />
                  {post.isPrivate && (
                      <div className="absolute top-20 right-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                           <span className="text-[10px] font-bold uppercase tracking-wider text-white font-mono">Vault Mode</span>
                      </div>
                  )}
              </div>
              <CommentsSheet isOpen={showComments} onClose={() => setShowComments(false)} onViewProfile={onViewProfile} currentUser={currentUser} />
              <ShareSheet isOpen={!!sharingPost} onClose={() => setSharingPost(null)} post={sharingPost} />
          </div>
      )
  }

  return (
    <div className="h-full w-full bg-black text-white overflow-y-auto no-scrollbar pb-20 relative">
      {toastMessage && <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white text-black px-6 py-3 rounded-full shadow-2xl font-bold text-sm z-[150] animate-fade-in whitespace-nowrap">{toastMessage}</div>}

      <div className="flex justify-between items-center p-4 border-b border-gray-800 sticky top-0 bg-black/80 backdrop-blur-md z-10">
        <button onClick={() => setShowFindFriends(true)} className="relative p-1 active:scale-95 transition-transform">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
             <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black"></div>
        </button>
        <div className="font-bold text-lg flex items-center gap-1">{currentUser.username} <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
        <div className="flex gap-4">
            <button onClick={() => setShowProfileViews(true)} className="active:scale-95 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            </button>
            <button onClick={() => setShowSettings(true)} className="active:scale-95 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
        </div>
      </div>

      {/* Main Profile Info */}
      <div className="flex flex-col items-center py-6">
        <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 p-[2px] mb-4">
                <div className="w-full h-full rounded-full border-4 border-black overflow-hidden bg-gray-900"><img src={currentUser.avatar} className="w-full h-full object-cover" /></div>
            </div>
            <button onClick={() => setShowEditProfile(true)} className="absolute bottom-4 right-0 bg-cyan-500 rounded-full p-1.5 border-2 border-black active:scale-90 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg></button>
        </div>
        <h2 className="text-xl font-bold">@{currentUser.username}</h2>
        <p className="text-sm text-gray-400 mt-1 px-8 text-center line-clamp-2">{currentUser.bio}</p>
        <span className="text-[10px] bg-cyan-600/20 text-cyan-400 px-2 py-0.5 rounded mt-2 border border-cyan-500/30 uppercase font-bold">{currentUser.category}</span>

        {/* INTERACTIVE STATS */}
        <div className="flex gap-8 mt-6">
            <button 
                onClick={() => setShowListType('FOLLOWING')}
                className="flex flex-col items-center group active:scale-95 transition-transform"
            >
                <span className="font-bold group-hover:text-cyan-400 transition-colors">{currentUser.following}</span>
                <span className="text-xs text-gray-400">Following</span>
            </button>
            <button 
                onClick={() => setShowListType('FOLLOWERS')}
                className="flex flex-col items-center group active:scale-95 transition-transform"
            >
                <span className="font-bold group-hover:text-cyan-400 transition-colors">{currentUser.followers}</span>
                <span className="text-xs text-gray-400">Followers</span>
            </button>
            <button 
                onClick={() => setShowListType('LIKES')}
                className="flex flex-col items-center group active:scale-95 transition-transform"
            >
                <span className="font-bold group-hover:text-cyan-400 transition-colors">{currentUser.likes}</span>
                <span className="text-xs text-gray-400">Likes</span>
            </button>
        </div>

        <div className="flex gap-2 mt-8 w-full px-10">
            <button onClick={() => setShowEditProfile(true)} className="flex-1 bg-gray-800 hover:bg-gray-700 py-2.5 rounded-lg font-bold text-sm transition-colors active:scale-95">Edit Profile</button>
            <button onClick={() => setShowAnalytics(true)} className="bg-gray-800 hover:bg-gray-700 p-2.5 rounded-lg transition-colors active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            </button>
        </div>
      </div>

      <div className="flex justify-around border-t border-gray-800 mt-4">
         <button onClick={() => setActiveGridTab('POSTS')} className={`flex-1 py-4 flex justify-center relative transition-colors ${activeGridTab === 'POSTS' ? 'text-white' : 'text-gray-500'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            {activeGridTab === 'POSTS' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>}
         </button>
         <button onClick={() => setActiveGridTab('PRIVATE')} className={`flex-1 py-4 flex justify-center relative transition-colors ${activeGridTab === 'PRIVATE' ? 'text-white' : 'text-gray-500'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            {activeGridTab === 'PRIVATE' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>}
         </button>
      </div>

      <div className="grid grid-cols-3 gap-0.5 min-h-[400px]">
         {filteredPosts.length === 0 ? (
             <div className="col-span-3 flex flex-col items-center justify-center py-20 text-gray-500 opacity-50">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 <span className="text-sm font-medium">No {activeGridTab === 'PRIVATE' ? 'hidden content' : 'posts'} yet</span>
             </div>
         ) : filteredPosts.map((p) => {
             const isVideo = p.media[0].type === 'video';
             return (
                <div 
                    key={p.id} 
                    onClick={() => setSelectedPostId(p.id)} 
                    className="aspect-[3/4] bg-gray-900 relative cursor-pointer group active:opacity-70 transition-opacity"
                >
                    <img src={p.media[0].url.includes('flower') ? `https://picsum.photos/seed/${p.id}/300/400` : p.media[0].url} className="w-full h-full object-cover" />
                    {isVideo && (
                        <div className="absolute top-1.5 right-1.5 bg-black/40 backdrop-blur-sm p-1 rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                    )}
                </div>
             );
         })}
      </div>

      {/* OVERLAY: FOLLOWING/FOLLOWERS/LIKES LIST */}
      {showListType && (
          <div className="fixed inset-0 z-[140] bg-[#181818] flex flex-col animate-slide-in-right pointer-events-auto">
              <div className="flex items-center px-4 py-4 border-b border-gray-800 bg-[#181818] sticky top-0 z-10">
                  <button onClick={() => setShowListType(null)} className="p-1 -ml-1 text-white active:scale-90 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h3 className="flex-1 text-center text-md font-bold pr-7">
                      {showListType === 'FOLLOWING' ? 'Following' : showListType === 'FOLLOWERS' ? 'Followers' : 'Likes'}
                  </h3>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
                  {listUsers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
                           <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                           <p className="font-medium">No users found</p>
                      </div>
                  ) : listUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between animate-fade-in">
                          <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group" onClick={() => { setShowListType(null); onViewProfile?.(user.id); }}>
                              <div className="w-12 h-12 rounded-full border border-gray-800 p-0.5 overflow-hidden"><img src={user.avatar} className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform" /></div>
                              <div className="flex-1 min-w-0"><h4 className="text-sm font-bold text-white truncate">{user.name}</h4><p className="text-xs text-gray-500 truncate">{user.subText || `@${user.username}`}</p></div>
                          </div>
                          <button onClick={() => handleListUserFollowToggle(user.id)} className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all transform active:scale-95 border ${user.isFollowing ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700' : 'bg-cyan-600 text-white border-transparent hover:bg-cyan-500 shadow-lg shadow-cyan-900/20'}`}>{user.isFollowing ? 'Unfollow' : (showListType === 'FOLLOWERS' ? 'Follow Back' : 'Follow')}</button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
      {showEditProfile && <EditProfileSheet user={currentUser} onClose={() => setShowEditProfile(false)} onUpdate={handleUpdateUser} />}
      {showAnalytics && <AnalyticsSheet user={currentUser} onClose={() => setShowAnalytics(false)} />}
      {showProfileViews && (
        <ProfileViewsSheet 
          isOpen={showProfileViews} 
          visitors={profileVisitors}
          onClose={() => setShowProfileViews(false)} 
          onViewProfile={onViewProfile} 
          onFollowToggle={handleVisitorFollowToggle}
        />
      )}
      {showFindFriends && (
        <FindFriends 
            isOpen={showFindFriends} 
            onClose={() => setShowFindFriends(false)} 
            onOpenQR={() => setShowQRScanner(true)} 
            onNavigateToChat={onNavigateToChat} 
            onViewProfile={onViewProfile} 
            userRegistry={userRegistry}
            onFollowUser={onFollowUser}
        />
      )}
      <QRScanner isOpen={showQRScanner} onClose={() => setShowQRScanner(false)} onViewProfile={onViewProfile} currentUser={currentUser} />
    </div>
  );
};

export default Profile;
