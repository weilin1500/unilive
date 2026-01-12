import React, { useState } from 'react';
import { MOCK_NOTIFICATIONS } from '../constants';
import { Notification, NotificationType } from '../types';

interface NotificationsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onViewProfile?: (userId: string) => void;
    onOpenPost?: (postId: string) => void;
}

const NotificationsSheet: React.FC<NotificationsSheetProps> = ({ isOpen, onClose, onViewProfile, onOpenPost }) => {
    const [activeTab, setActiveTab] = useState<'ALL' | 'NEW' | 'MENTIONS'>('ALL');
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleNotifClick = (notif: Notification) => {
        if (notif.postId && onOpenPost) {
            onOpenPost(notif.postId);
            onClose();
        } else if (notif.user && onViewProfile) {
            onViewProfile(notif.user.id);
            onClose();
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'NEW') return !n.isRead;
        if (activeTab === 'MENTIONS') return n.type === 'MENTION';
        return true;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-end justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={onClose}></div>
            
            <div className="bg-[#121212] w-full h-[85vh] rounded-t-3xl flex flex-col pointer-events-auto overflow-hidden animate-slide-up relative z-10 border-t border-gray-800">
                <div className="w-full flex justify-center pt-3 pb-1 shrink-0"><div className="w-12 h-1.5 bg-gray-600 rounded-full"></div></div>

                <div className="flex justify-between items-center px-4 py-3 shrink-0">
                    <h2 className="text-lg font-black tracking-tight text-white">Notifications</h2>
                    <div className="flex gap-4">
                        <button onClick={markAllAsRead} className="text-xs font-bold text-cyan-400">Mark all read</button>
                        <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">✕</button>
                    </div>
                </div>

                <div className="flex px-4 gap-6 border-b border-gray-800 shrink-0">
                    {['ALL', 'NEW', 'MENTIONS'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`py-3 text-[11px] font-black tracking-[1px] transition-all relative ${activeTab === tab ? 'text-white' : 'text-gray-500'}`}
                        >
                            {tab}
                            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500"></div>}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2 pb-10">
                    {filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-gray-500 opacity-40">
                             <p className="font-bold">No notifications here</p>
                        </div>
                    ) : filteredNotifications.map((notif) => (
                        <NotificationItem 
                            key={notif.id} 
                            notif={notif} 
                            onDelete={() => deleteNotification(notif.id)}
                            onClick={() => handleNotifClick(notif)}
                            onViewProfile={onViewProfile}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const NotificationItem: React.FC<{ notif: Notification; onDelete: () => void; onClick: () => void; onViewProfile?: (userId: string) => void }> = ({ notif, onDelete, onClick, onViewProfile }) => {
    const [isFollowed, setIsFollowed] = useState(false);

    const getIcon = () => {
        switch(notif.type) {
            case 'LIKE': return '❤️';
            case 'COMMENT': return '💬';
            case 'FOLLOW': return '👤';
            case 'MENTION': return '🏷️';
            case 'SYSTEM': return '📢';
            default: return '🔔';
        }
    };

    return (
        <div 
            onClick={onClick}
            className={`flex items-center gap-3 p-3 rounded-2xl transition-all relative group cursor-pointer active:scale-[0.98] ${notif.isRead ? 'bg-transparent' : 'bg-white/5'}`}
        >
            {!notif.isRead && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>}

            <div className="relative shrink-0">
                {notif.user ? (
                    <div className="w-12 h-12 rounded-full border border-gray-800 overflow-hidden" onClick={(e) => { e.stopPropagation(); onViewProfile?.(notif.user!.id); }}>
                        <img src={notif.user.avatar} className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-xl">{getIcon()}</div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 leading-snug">
                    {notif.user && <span className="font-black text-white mr-1">@{notif.user.username}</span>}
                    {notif.text}
                </p>
                <span className="text-[10px] text-gray-500 font-bold uppercase">{notif.timestamp}</span>
            </div>

            <div className="shrink-0 flex items-center gap-2">
                {notif.type === 'FOLLOW' && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsFollowed(!isFollowed); }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${isFollowed ? 'bg-gray-800 text-gray-400' : 'bg-cyan-600 text-white'}`}
                    >
                        {isFollowed ? 'Following' : 'Follow Back'}
                    </button>
                )}
                {notif.mediaPreview && (
                    <div className="w-10 h-10 rounded-lg bg-gray-800 overflow-hidden border border-gray-700">
                        <img src={notif.mediaPreview} className="w-full h-full object-cover opacity-80" />
                    </div>
                )}
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6" /></svg>
                </button>
            </div>
        </div>
    );
};

export default NotificationsSheet;