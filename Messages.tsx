
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { geminiService } from '../services/geminiService';
import { ChatMessage, Reaction, User, MainTab, ChatAttachment } from '../types';
import UniLiveLogo from '../components/UniLiveLogo';
import MediaViewer from '../components/MediaViewer';
import DocumentViewer from '../components/DocumentViewer';
import GiftPanel from '../components/GiftPanel';
import { LANGUAGES } from '../constants';

interface MessagesProps {
  onToggleNav: (visible: boolean) => void;
  initialChatId?: string | null;
  onChatOpened?: () => void;
  onViewProfile?: (userId: string) => void;
  currentUser: User;
  userRegistry?: Record<string, any>;
  onTabChange?: (tab: MainTab) => void;
}

const GIPHY_API_KEY = 'JMG0ZCcDfgTH4P2Kl2oRiuhnpIlDqttI';

const EMOJIS = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
    '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾',
    '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '😿', '😾', '🤲', '👐', '🙌', '👏', '🤝', '👍', '👎', '👊', '✊',
    '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤏', '👈', '👉', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤙', '💪',
    '🙏', '🔥', '✨', '🌟', '💫', '💥', '💢', '💦', '💧', '💤', '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟',
    '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'
];

interface ChatPreview {
    id: string;
    name: string;
    avatar: string;
    lastMessage: string;
    time: string;
    unreadCount: number;
    isOnline: boolean;
    isPinned: boolean;
    isAI?: boolean;
    isSelf?: boolean;
    isGroup?: boolean;
    participants?: string[];
    isCall?: boolean;
    callStatus?: 'missed' | 'incoming' | 'outgoing';
    isVideo?: boolean;
}

interface Attachment {
    id: string;
    file: File;
    preview: string;
    type: 'image' | 'video' | 'file' | 'audio';
}

interface GroupParticipant {
    id: string;
    name: string;
    username?: string;
    avatar: string;
    status: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

const MOCK_CHATS: ChatPreview[] = [
    { id: 'ai-assistant', name: 'UniLive AI Assistant', avatar: 'ai', lastMessage: 'How can I assist you today?', time: 'now', unreadCount: 0, isOnline: true, isPinned: true, isAI: true },
    { id: 'u1', name: 'Jessica Pearson', avatar: 'https://picsum.photos/seed/u1/100', lastMessage: 'The new live stream is fire! 🔥', time: '10:45 AM', unreadCount: 2, isOnline: true, isPinned: true },
    { id: 'u2', name: 'Harvey Specter', avatar: 'https://picsum.photos/seed/u2/100', lastMessage: 'Outgoing Call', time: 'Yesterday', unreadCount: 0, isOnline: false, isPinned: false, isCall: true, callStatus: 'outgoing', isVideo: false },
    { id: 'u3', name: 'Louis Litt', avatar: 'https://picsum.photos/seed/u3/100', lastMessage: 'You just got Litt up!', time: 'Mon', unreadCount: 5, isOnline: true, isPinned: false },
    { id: 'u4', name: 'Donna Paulsen', avatar: 'https://picsum.photos/seed/u4/100', lastMessage: 'Incoming Call', time: 'Sun', unreadCount: 0, isOnline: false, isPinned: false, isCall: true, callStatus: 'incoming', isVideo: true },
    { id: 'u5', name: 'Mike Ross', avatar: 'https://picsum.photos/seed/u5/100', lastMessage: 'Missed Call', time: 'Sun', unreadCount: 0, isOnline: false, isPinned: false, isCall: true, callStatus: 'missed', isVideo: true },
    { id: 'u6', name: 'Rachel Zane', avatar: 'https://picsum.photos/seed/u6/100', lastMessage: 'Sent an attachment.', time: 'Sat', unreadCount: 0, isOnline: false, isPinned: false },
];

const MOCK_CALLS: ChatPreview[] = [
    { id: 'c1', name: 'Jessica Pearson', avatar: 'https://picsum.photos/seed/u1/100', lastMessage: 'Missed Video Call', time: '10:30 AM', unreadCount: 0, isOnline: true, isPinned: false, isCall: true, callStatus: 'missed', isVideo: true },
    { id: 'c2', name: 'Harvey Specter', avatar: 'https://picsum.photos/seed/u2/100', lastMessage: 'Outgoing Call (5m)', time: 'Yesterday', unreadCount: 0, isOnline: false, isPinned: false, isCall: true, callStatus: 'outgoing', isVideo: false },
    { id: 'c3', name: 'Mike Ross', avatar: 'https://picsum.photos/seed/u5/100', lastMessage: 'Incoming Call (Rejected)', time: 'Mon', unreadCount: 0, isOnline: false, isPinned: false, isCall: true, callStatus: 'missed', isVideo: false },
    { id: 'c4', name: 'Sarah Jenkins', avatar: 'https://picsum.photos/seed/c1/100', lastMessage: 'Incoming Video Call (12m)', time: 'Sun', unreadCount: 0, isOnline: true, isPinned: false, isCall: true, callStatus: 'incoming', isVideo: true },
    { id: 'c5', name: 'David Lee', avatar: 'https://picsum.photos/seed/c2/100', lastMessage: 'Missed Call', time: 'Sat', unreadCount: 0, isOnline: false, isPinned: false, isCall: true, callStatus: 'missed', isVideo: false },
];

const CONTACTS = [
    { id: 'c1', name: 'Sarah Jenkins', avatar: 'https://picsum.photos/seed/c1/100', status: 'Available' },
    { id: 'c2', name: 'David Lee', avatar: 'https://picsum.photos/seed/c2/100', status: 'Busy' },
    { id: 'c3', name: 'Emily Chen', avatar: 'https://picsum.photos/seed/c3/100', status: 'Online' },
    { id: 'c4', name: 'Michael Scott', avatar: 'https://picsum.photos/seed/c4/100', status: 'At Work' },
    { id: 'c5', name: 'Pam Beesly', avatar: 'https://picsum.photos/seed/c5/100', status: 'Away' },
    { id: 'c6', name: 'Jim Halpert', avatar: 'https://picsum.photos/seed/c6/100', status: 'Online' },
    ...MOCK_CHATS.map(c => ({ id: c.id, name: c.name, avatar: c.avatar, status: c.isOnline ? 'Online' : 'Offline' }))
];

const sortChats = (chats: ChatPreview[]) => {
    return [...chats].sort((a, b) => {
        if (a.isAI) return -1;
        if (b.isAI) return 1;
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return 0;
    });
};

const ChatOptionsSheet: React.FC<{ chat: ChatPreview, onClose: () => void, onPin: () => void, onDelete: () => void }> = ({ chat, onClose, onPin, onDelete }) => (
    <div className="fixed inset-0 z-[300] bg-black/60 flex items-end justify-center" onClick={onClose}>
        <div className="bg-[#1C2733] w-full rounded-t-3xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold mb-4 text-center">{chat.name}</h3>
            <div className="space-y-2">
                <button onClick={onPin} className="w-full py-3 bg-white/5 rounded-xl text-white font-medium">{chat.isPinned ? 'Unpin' : 'Pin'} Chat</button>
                <button onClick={onDelete} className="w-full py-3 bg-red-500/10 text-red-500 rounded-xl font-medium">Delete Chat</button>
                <button onClick={onClose} className="w-full py-3 text-gray-400 font-medium">Cancel</button>
            </div>
        </div>
    </div>
);

const ParticipantOptionsSheet: React.FC<{ 
    participant: { id: string; name: string; avatar: string };
    isOwner: boolean;
    isAdmin: boolean;
    onClose: () => void; 
    onPromoteToAdmin?: () => void;
    onRemoveFromAdmin?: () => void;
    onRemoveMember?: () => void;
}> = ({ participant, isOwner, isAdmin, onClose, onPromoteToAdmin, onRemoveFromAdmin, onRemoveMember }) => (
    <div className="fixed inset-0 z-[350] bg-black/60 flex items-end justify-center" onClick={onClose}>
        <div className="bg-[#1C2733] w-full rounded-t-3xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
                <img src={participant.avatar} className="w-12 h-12 rounded-full object-cover bg-gray-800" />
                <div>
                    <h3 className="text-white font-bold">{participant.name}</h3>
                    {isOwner && <p className="text-xs text-purple-400">Owner</p>}
                    {isAdmin && !isOwner && <p className="text-xs text-cyan-400">Admin</p>}
                </div>
            </div>
            <div className="space-y-2">
                {!isOwner && (
                    <>
                        {!isAdmin && onPromoteToAdmin && (
                            <button onClick={() => { onPromoteToAdmin(); onClose(); }} className="w-full py-3 bg-white/5 rounded-xl text-white font-medium">
                                Make Admin
                            </button>
                        )}
                        {isAdmin && onRemoveFromAdmin && (
                            <button onClick={() => { onRemoveFromAdmin(); onClose(); }} className="w-full py-3 bg-white/5 rounded-xl text-white font-medium">
                                Remove Admin
                            </button>
                        )}
                        {onRemoveMember && (
                            <button onClick={() => { onRemoveMember(); onClose(); }} className="w-full py-3 bg-red-500/10 text-red-500 rounded-xl font-medium">
                                Remove from Group
                            </button>
                        )}
                    </>
                )}
                <button onClick={onClose} className="w-full py-3 text-gray-400 font-medium">Cancel</button>
            </div>
        </div>
    </div>
);

const ParticipantsListSheet: React.FC<{
    members: Array<{ id: string; name: string; avatar: string }>;
    ownerId: string;
    adminIds: string[];
    onClose: () => void;
    onParticipantClick: (member: { id: string; name: string; avatar: string }) => void;
}> = ({ members, ownerId, adminIds, onClose, onParticipantClick }) => {
    return (
        <div className="fixed inset-0 z-[350] bg-black/60 flex items-end justify-center" onClick={onClose}>
            <div className="bg-[#1C2733] w-full h-full flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg">All Participants</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-3">
                        {members.map(m => {
                            const isOwner = m.id === ownerId;
                            const isAdmin = adminIds.includes(m.id);
                            return (
                                <div 
                                    key={m.id} 
                                    className={`flex items-center gap-3 ${!isOwner ? 'cursor-pointer hover:bg-white/5 rounded-lg p-3 transition-colors' : 'p-3'}`}
                                    onClick={() => !isOwner && onParticipantClick(m)}
                                >
                                    <img src={m.avatar} className="w-12 h-12 rounded-full object-cover bg-gray-800" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium">{m.name}</span>
                                            {isOwner && <span className="text-[10px] bg-purple-900 text-purple-400 px-2 py-0.5 rounded font-bold">Owner</span>}
                                            {isAdmin && !isOwner && <span className="text-[10px] bg-cyan-900 text-cyan-400 px-2 py-0.5 rounded font-bold">Admin</span>}
                                        </div>
                                    </div>
                                    {!isOwner && (
                                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AddMemberSheet: React.FC<{ 
    onClose: () => void; 
    onAddMembers: (memberIds: string[]) => void;
    existingMemberIds: string[];
    userRegistry?: Record<string, any>;
}> = ({ onClose, onAddMembers, existingMemberIds, userRegistry }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleAdd = () => {
        if (selectedIds.size > 0) {
            onAddMembers(Array.from(selectedIds));
            onClose();
        }
    };

    // Filter out existing members
    const availableContacts = CONTACTS.filter(c => !existingMemberIds.includes(c.id));

    return (
        <div className="fixed inset-0 z-[350] bg-black/60 flex items-end justify-center" onClick={onClose}>
            <div className="bg-[#1C2733] w-full h-[80vh] rounded-t-3xl flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-white font-bold">Add Members</h3>
                    <button onClick={onClose} className="text-gray-400">✕</button>
                </div>
                
                {selectedIds.size > 0 && (
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                        <span className="text-sm text-gray-400">{selectedIds.size} selected</span>
                        <button 
                            onClick={handleAdd} 
                            className="bg-cyan-600 px-4 py-2 rounded-xl text-white font-bold text-sm active:scale-95 transition-transform"
                        >
                            Add
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-2">
                    <p className="px-4 py-2 text-xs font-bold text-gray-500 uppercase">Contacts</p>
                    {availableContacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                            <p className="text-gray-400 text-sm text-center">All contacts are already in this group</p>
                        </div>
                    ) : (
                        availableContacts.map(c => {
                            const isSelected = selectedIds.has(c.id);
                            return (
                                <div 
                                    key={c.id} 
                                    onClick={() => toggleSelection(c.id)} 
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isSelected ? 'bg-cyan-900/30' : 'hover:bg-white/5'}`}
                                >
                                    <div className="relative">
                                        <img src={c.avatar} className="w-10 h-10 rounded-full object-cover bg-gray-800" />
                                        {isSelected && (
                                            <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-0.5 border-2 border-[#1C2733]">
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className={`font-medium ${isSelected ? 'text-cyan-400' : 'text-white'}`}>{c.name}</div>
                                        <div className="text-xs text-gray-500">{c.status}</div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-cyan-500 bg-cyan-500' : 'border-gray-600'}`}>
                                        {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

const GroupDetailsSheet: React.FC<{ 
    chat: ChatPreview; 
    onClose: () => void; 
    onLeave: () => void; 
    userRegistry?: Record<string, any>; 
    onUpdate?: (updates: { name?: string, avatar?: string }) => void; 
    onAddMembers?: (memberIds: string[]) => void;
    onPromoteToAdmin?: (memberId: string) => void;
    onRemoveFromAdmin?: (memberId: string) => void;
    onRemoveMember?: (memberId: string) => void;
    currentUser?: User;
}> = ({ chat, onClose, onLeave, userRegistry, onUpdate, onAddMembers, onPromoteToAdmin, onRemoveFromAdmin, onRemoveMember, currentUser }) => {
    const [groupName, setGroupName] = useState(chat.name);
    const [groupAvatar, setGroupAvatar] = useState(chat.avatar);
    const [isEditingName, setIsEditingName] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [showParticipantsList, setShowParticipantsList] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState<{ id: string; name: string; avatar: string } | null>(null);
    const [adminIds, setAdminIds] = useState<string[]>(['u1']); // Track admin IDs in state
    const fileInputRef = useRef<HTMLInputElement>(null);

    const participants = chat.participants || [];
    const ownerId = participants[0]; // First participant is the owner
    const isCurrentUserOwner = currentUser && currentUser.id === ownerId;
    
    const members = participants
        .map(id => {
            const contact = CONTACTS.find(c => c.id === id);
            if (contact) return contact;
            if (userRegistry && userRegistry[id]) return userRegistry[id];
            return { id, name: 'User ' + id, avatar: 'https://picsum.photos/200' };
        })
        .sort((a, b) => {
            // Owner first
            if (a.id === ownerId && b.id !== ownerId) return -1;
            if (b.id === ownerId && a.id !== ownerId) return 1;
            // Then admins
            const aIsAdmin = adminIds.includes(a.id);
            const bIsAdmin = adminIds.includes(b.id);
            if (aIsAdmin && !bIsAdmin) return -1;
            if (bIsAdmin && !aIsAdmin) return 1;
            // Then others (alphabetical by name)
            return a.name.localeCompare(b.name);
        });

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const newAvatar = URL.createObjectURL(e.target.files[0]);
            setGroupAvatar(newAvatar);
            if (onUpdate) {
                onUpdate({ avatar: newAvatar });
            }
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setGroupName(e.target.value);
    };

    const handleNameBlur = () => {
        setIsEditingName(false);
        if (onUpdate && groupName.trim() && groupName !== chat.name) {
            onUpdate({ name: groupName.trim() });
        } else if (!groupName.trim()) {
            setGroupName(chat.name);
        }
    };

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    const handleAddMembers = (memberIds: string[]) => {
        if (onAddMembers) {
            onAddMembers(memberIds);
        }
    };

    const handlePromoteToAdmin = (memberId: string) => {
        setAdminIds(prev => [...prev, memberId]);
        if (onPromoteToAdmin) {
            onPromoteToAdmin(memberId);
        }
    };

    const handleRemoveFromAdmin = (memberId: string) => {
        setAdminIds(prev => prev.filter(id => id !== memberId));
        if (onRemoveFromAdmin) {
            onRemoveFromAdmin(memberId);
        }
    };

    const handleRemoveMember = (memberId: string) => {
        setAdminIds(prev => prev.filter(id => id !== memberId));
        if (onRemoveMember) {
            onRemoveMember(memberId);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[300] bg-black/60 flex items-end justify-center" onClick={onClose}>
                <div className="bg-[#1C2733] w-full max-w-2xl h-[70vh] sm:h-[75vh] md:h-[80vh] rounded-t-3xl flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
                    <div className="p-3 sm:p-4 border-b border-white/10 flex justify-between items-center">
                        <h3 className="text-white font-bold text-base sm:text-lg">Group Info</h3>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <button 
                                onClick={() => setShowAddMember(true)}
                                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 rounded-lg transition-colors active:scale-95 min-h-[36px]"
                            >
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                <span className="text-[10px] sm:text-xs font-bold">Add Member</span>
                            </button>
                            <button onClick={onClose} className="text-gray-400 hover:text-white p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center">✕</button>
                        </div>
                    </div>
                    <div className="p-4 sm:p-6 flex flex-col items-center border-b border-white/5">
                        <div className="relative group cursor-pointer mb-2 sm:mb-3" onClick={() => fileInputRef.current?.click()}>
                            <img src={groupAvatar} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white/10" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                        </div>
                        <button className="text-xs text-cyan-500 font-bold mb-3" onClick={() => fileInputRef.current?.click()}>Change Photo</button>
                        {isEditingName ? (
                            <input
                                type="text"
                                value={groupName}
                                onChange={handleNameChange}
                                onBlur={handleNameBlur}
                                onKeyDown={handleNameKeyDown}
                                className="text-white font-bold text-xl bg-transparent border border-cyan-500 rounded-lg px-3 py-1 text-center outline-none focus:border-cyan-400"
                                autoFocus
                            />
                        ) : (
                            <h2 
                                className="text-white font-bold text-xl cursor-pointer hover:text-cyan-400 transition-colors"
                                onClick={() => setIsEditingName(true)}
                            >
                                {groupName}
                            </h2>
                        )}
                        <p className="text-gray-400 text-sm mt-1">{members.length} members</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Participants</h4>
                            <button 
                                onClick={() => setShowParticipantsList(true)}
                                className="text-xs text-cyan-400 font-bold hover:text-cyan-300 transition-colors"
                            >
                                See All
                            </button>
                        </div>
                        <div className="space-y-3">
                            {members.map(m => {
                                const isOwner = m.id === ownerId;
                                const isAdmin = adminIds.includes(m.id);
                                return (
                                    <div 
                                        key={m.id} 
                                        className={`flex items-center gap-3 ${!isOwner ? 'cursor-pointer hover:bg-white/5 rounded-lg p-2 -m-2 transition-colors' : ''}`}
                                        onClick={() => !isOwner && setSelectedParticipant(m)}
                                    >
                                        <img src={m.avatar} className="w-10 h-10 rounded-full object-cover bg-gray-800" />
                                        <span className="text-white font-medium">{m.name}</span>
                                        <div className="ml-auto flex gap-2 items-center">
                                            {isOwner && <span className="text-[10px] bg-purple-900 text-purple-400 px-2 py-0.5 rounded font-bold">Owner</span>}
                                            {isAdmin && !isOwner && <span className="text-[10px] bg-cyan-900 text-cyan-400 px-2 py-0.5 rounded font-bold">Admin</span>}
                                            {!isOwner && (
                                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-4 border-t border-white/10">
                        <button onClick={onLeave} className="w-full py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl font-bold transition-colors">Leave Group</button>
                    </div>
                </div>
            </div>

            {showAddMember && (
                <AddMemberSheet 
                    onClose={() => setShowAddMember(false)}
                    onAddMembers={handleAddMembers}
                    existingMemberIds={participants}
                    userRegistry={userRegistry}
                />
            )}

            {showParticipantsList && (
                <ParticipantsListSheet
                    members={members}
                    ownerId={ownerId}
                    adminIds={adminIds}
                    onClose={() => setShowParticipantsList(false)}
                    onParticipantClick={(member) => {
                        setShowParticipantsList(false);
                        setSelectedParticipant(member);
                    }}
                />
            )}

            {selectedParticipant && (
                <ParticipantOptionsSheet
                    participant={selectedParticipant}
                    isOwner={selectedParticipant.id === ownerId}
                    isAdmin={adminIds.includes(selectedParticipant.id)}
                    onClose={() => setSelectedParticipant(null)}
                    onPromoteToAdmin={selectedParticipant.id !== ownerId ? () => handlePromoteToAdmin(selectedParticipant.id) : undefined}
                    onRemoveFromAdmin={selectedParticipant.id !== ownerId && adminIds.includes(selectedParticipant.id) ? () => handleRemoveFromAdmin(selectedParticipant.id) : undefined}
                    onRemoveMember={selectedParticipant.id !== ownerId ? () => handleRemoveMember(selectedParticipant.id) : undefined}
                />
            )}
        </>
    );
};

const NewChatSheet: React.FC<{ onClose: () => void, onSelect: (id: string) => void, onGroupCreate: (name: string, ids: string[], image: string | null) => void }> = ({ onClose, onSelect, onGroupCreate }) => {
    const [isGroup, setIsGroup] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [groupImage, setGroupImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const imageUrl = URL.createObjectURL(e.target.files[0]);
            setGroupImage(imageUrl);
        }
    };

    const handleCreate = () => {
        if (!groupName.trim() || selectedIds.size === 0) return;
        onGroupCreate(groupName, Array.from(selectedIds), groupImage);
        onClose();
    };

    const handleToggleGroup = () => {
        if (isGroup) {
            // Cancel group mode
            setIsGroup(false);
            setSelectedIds(new Set());
            if (groupImage) {
                URL.revokeObjectURL(groupImage);
                setGroupImage(null);
            }
        } else {
            // Enter group mode
            setIsGroup(true);
        }
    };
    
    return (
        <div className="fixed inset-0 z-[300] bg-black/60 flex items-end justify-center" onClick={onClose}>
            <div className="bg-[#1C2733] w-full max-w-2xl h-[75vh] sm:h-[80vh] md:h-[85vh] rounded-t-3xl flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="p-3 sm:p-4 border-b border-white/10 flex justify-between items-center">
                    <button onClick={handleToggleGroup} className="text-cyan-400 font-bold text-xs sm:text-sm min-h-[36px] px-2">
                        {isGroup ? 'Cancel Group' : 'New Group'}
                    </button>
                    <h3 className="text-white font-bold text-base sm:text-lg">{isGroup ? 'New Group' : 'New Message'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center">✕</button>
                </div>
                
                {isGroup && (
                    <div className="p-4 border-b border-white/10 space-y-3">
                        <div className="flex items-center gap-3">
                            <div 
                                className="relative w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center border border-white/10 cursor-pointer group overflow-hidden"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {groupImage ? (
                                    <img src={groupImage} className="w-full h-full object-cover" />
                                ) : (
                                    <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                            </div>
                            <input 
                                value={groupName} 
                                onChange={e => setGroupName(e.target.value)} 
                                placeholder="Group Name" 
                                className="flex-1 bg-transparent text-white outline-none border-b border-white/20 py-2 focus:border-cyan-500 transition-colors" 
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-400 px-1">
                            <span>Participants: {selectedIds.size}</span>
                        </div>
                        <button 
                            onClick={handleCreate} 
                            disabled={!groupName.trim() || selectedIds.size === 0}
                            className="w-full bg-cyan-600 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create Group
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-2">
                    <p className="px-4 py-2 text-xs font-bold text-gray-500 uppercase">Suggested</p>
                    {CONTACTS.map(c => {
                        const isSelected = selectedIds.has(c.id);
                        return (
                            <div 
                                key={c.id} 
                                onClick={() => isGroup ? toggleSelection(c.id) : onSelect(c.id)} 
                                className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl cursor-pointer transition-colors min-h-[64px] sm:min-h-[72px] ${isSelected ? 'bg-cyan-900/30' : 'hover:bg-white/5 active:bg-white/10'}`}
                            >
                                <div className="relative shrink-0">
                                    <img src={c.avatar} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
                                    {isGroup && isSelected && (
                                        <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-0.5 border-2 border-[#1C2733]">
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`font-medium text-sm sm:text-base truncate ${isSelected ? 'text-cyan-400' : 'text-white'}`}>{c.name}</div>
                                    <div className="text-xs sm:text-sm text-gray-500 truncate">{c.status}</div>
                                </div>
                                {isGroup && (
                                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-cyan-500 bg-cyan-500' : 'border-gray-600'}`}>
                                        {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const ImageGenSheet: React.FC<{ onClose: () => void, onGenerate: (url: string) => void }> = ({ onClose, onGenerate }) => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    
    const handleGen = async () => {
        if(!prompt) return;
        setLoading(true);
        try {
            const url = await geminiService.generateImage(prompt, '1K');
            if(url) { onGenerate(url); onClose(); }
        } catch(e) { console.error(e); } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center px-4" onClick={onClose}>
            <div className="bg-[#1C2733] w-full max-w-sm rounded-2xl p-5" onClick={e => e.stopPropagation()}>
                <h3 className="text-white font-bold mb-4">AI Image Generator</h3>
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="A futuristic city..." className="w-full h-24 bg-black/30 rounded-xl p-3 text-white outline-none border border-white/10 mb-4" />
                <button onClick={handleGen} disabled={loading || !prompt} className="w-full bg-cyan-600 py-3 rounded-xl text-white font-bold disabled:opacity-50">
                    {loading ? 'Generating...' : 'Generate'}
                </button>
            </div>
        </div>
    );
};

const VideoGenSheet: React.FC<{ onClose: () => void, onGenerate: (url: string) => void }> = ({ onClose, onGenerate }) => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    
    const handleGen = async () => {
        if(!prompt) return;
        setLoading(true);
        try {
            const url = await geminiService.generateVideo(prompt, '16:9');
            if(url) { onGenerate(url); onClose(); }
        } catch(e) { console.error(e); } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center px-4" onClick={onClose}>
            <div className="bg-[#1C2733] w-full max-w-sm rounded-2xl p-5" onClick={e => e.stopPropagation()}>
                <h3 className="text-white font-bold mb-4">AI Video Generator</h3>
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="A cat driving a car..." className="w-full h-24 bg-black/30 rounded-xl p-3 text-white outline-none border border-white/10 mb-4" />
                <button onClick={handleGen} disabled={loading || !prompt} className="w-full bg-red-600 py-3 rounded-xl text-white font-bold disabled:opacity-50">
                    {loading ? 'Generating (takes time)...' : 'Generate Video'}
                </button>
            </div>
        </div>
    );
};

const ImageEditSheet: React.FC<{ onClose: () => void, onGenerate: (url: string) => void }> = ({ onClose, onGenerate }) => {
    const [prompt, setPrompt] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files?.[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => setImage(ev.target?.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleGen = async () => {
        if(!prompt || !image) return;
        setLoading(true);
        try {
            const url = await geminiService.editImage(image, prompt);
            if(url) { onGenerate(url); onClose(); }
        } catch(e) { console.error(e); } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center px-4" onClick={onClose}>
            <div className="bg-[#1C2733] w-full max-w-sm rounded-2xl p-5" onClick={e => e.stopPropagation()}>
                <h3 className="text-white font-bold mb-4">AI Image Editor</h3>
                
                <div onClick={() => fileRef.current?.click()} className="w-full h-32 bg-black/30 rounded-xl mb-4 flex items-center justify-center border border-dashed border-white/20 cursor-pointer overflow-hidden">
                    {image ? <img src={image} className="w-full h-full object-cover" /> : <span className="text-gray-500 text-xs">Tap to upload image</span>}
                </div>
                <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleFile} />

                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Make it cyberpunk..." className="w-full h-20 bg-black/30 rounded-xl p-3 text-white outline-none border border-white/10 mb-4" />
                <button onClick={handleGen} disabled={loading || !prompt || !image} className="w-full bg-purple-600 py-3 rounded-xl text-white font-bold disabled:opacity-50">
                    {loading ? 'Editing...' : 'Edit Image'}
                </button>
            </div>
        </div>
    );
};

const MusicSheet: React.FC<{ onClose: () => void, onSelect: (track: any) => void }> = ({ onClose, onSelect }) => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedTrack, setGeneratedTrack] = useState<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        try {
            const track = await geminiService.generateMusic(prompt);
            setGeneratedTrack({
                id: `ai-music-${Date.now()}`,
                artist: 'AI Composer',
                ...track
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const togglePreview = () => {
        if (!generatedTrack) return;
        
        if (!audioRef.current) {
            audioRef.current = new Audio(generatedTrack.url);
            audioRef.current.onended = () => setIsPlaying(false);
        }
        
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    useEffect(() => {
        return () => {
            if (audioRef.current) audioRef.current.pause();
        }
    }, []);

    return (
        <div className="fixed inset-0 z-[300] bg-black/60 flex items-end justify-center" onClick={onClose}>
            <div className="bg-[#1C2733] w-full rounded-t-3xl flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-white font-bold">AI Music Creator</h3>
                    <button onClick={onClose} className="text-gray-400">✕</button>
                </div>
                
                <div className="p-5 flex flex-col gap-4">
                    {!generatedTrack ? (
                        <>
                            <textarea 
                                value={prompt} 
                                onChange={e => setPrompt(e.target.value)} 
                                placeholder="Describe the music (e.g. 'Lo-fi beats for studying', 'Upbeat cyberpop')..." 
                                className="w-full h-24 bg-black/30 rounded-xl p-3 text-white outline-none border border-white/10 text-sm" 
                            />
                            <button 
                                onClick={handleGenerate} 
                                disabled={loading || !prompt.trim()} 
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-3 rounded-xl text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Composing...
                                    </>
                                ) : (
                                    <>
                                        <span>🎵</span> Generate Music
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col gap-4 items-center animate-fade-in">
                            <div className="w-full bg-gray-800/50 p-4 rounded-2xl flex items-center gap-4 border border-white/10">
                                <div className="w-16 h-16 rounded-xl overflow-hidden relative group cursor-pointer" onClick={togglePreview}>
                                    <img src={generatedTrack.cover} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                        {isPlaying ? (
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                        ) : (
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-bold truncate">{generatedTrack.title}</h4>
                                    <p className="text-xs text-gray-400">AI Generated • {prompt.slice(0, 20)}...</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={() => setGeneratedTrack(null)}
                                    className="flex-1 py-3 bg-gray-700 rounded-xl text-white font-bold text-sm"
                                >
                                    Retry
                                </button>
                                <button 
                                    onClick={() => { onSelect(generatedTrack); onClose(); }}
                                    className="flex-1 py-3 bg-cyan-600 rounded-xl text-white font-bold text-sm"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const GiphySheet: React.FC<{ onClose: () => void; onSelect: (url: string, type: 'gif' | 'sticker') => void }> = ({ onClose, onSelect }) => {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<'gifs' | 'stickers'>('gifs');

    useEffect(() => {
        fetchGiphy();
    }, [type]);

    const fetchGiphy = async (query?: string) => {
        setLoading(true);
        try {
            const endpoint = query 
                ? `https://api.giphy.com/v1/${type}/search?api_key=${GIPHY_API_KEY}&q=${query}&limit=20&rating=g`
                : `https://api.giphy.com/v1/${type}/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`;
            const res = await fetch(endpoint);
            const data = await res.json();
            if (data.data) setResults(data.data.map((item: any) => item.images.fixed_height.url));
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSearch = (val: string) => {
        setSearch(val);
        const timer = setTimeout(() => fetchGiphy(val), 500);
        return () => clearTimeout(timer);
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#1C2733] w-full h-[60vh] rounded-t-3xl flex flex-col overflow-hidden animate-slide-up border-t border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mt-3 mb-1"></div>
                
                {/* Header */}
                <div className="px-4 pb-2 border-b border-white/5">
                    <div className="flex gap-6 mb-3 justify-center">
                        <button onClick={() => setType('gifs')} className={`text-sm font-bold pb-2 border-b-2 transition-colors ${type === 'gifs' ? 'text-cyan-400 border-cyan-400' : 'text-gray-500 border-transparent'}`}>GIFs</button>
                        <button onClick={() => setType('stickers')} className={`text-sm font-bold pb-2 border-b-2 transition-colors ${type === 'stickers' ? 'text-cyan-400 border-cyan-400' : 'text-gray-500 border-transparent'}`}>Stickers</button>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input 
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder={`Search ${type}...`}
                            className="bg-gray-900 w-full text-white text-sm rounded-xl py-2.5 pl-10 pr-4 outline-none border border-white/5 focus:border-cyan-500/50 transition-colors"
                            autoFocus
                        />
                        {search && (
                            <button onClick={() => { setSearch(''); fetchGiphy(); }} className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-white">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-2 no-scrollbar bg-[#121212]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3">
                            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs text-gray-500 font-bold">Loading Giphy...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-1.5 pb-20">
                            {results.map((url, i) => (
                                <div 
                                    key={i} 
                                    className={`relative rounded-lg overflow-hidden cursor-pointer group bg-gray-800 ${type === 'stickers' ? 'aspect-square flex items-center justify-center p-2' : 'aspect-[4/3]'}`} 
                                    onClick={() => onSelect(url, type === 'stickers' ? 'sticker' : 'gif')}
                                >
                                    <img src={url} className={`w-full h-full ${type === 'stickers' ? 'object-contain' : 'object-cover'}`} loading="lazy" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="bg-cyan-500 rounded-full p-1.5 shadow-lg transform scale-0 group-hover:scale-100 transition-transform">
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const EmojiPicker: React.FC<{ onEmojiSelect: (emoji: string) => void, onClose: () => void }> = ({ onEmojiSelect, onClose }) => {
    return (
        <div className="absolute bottom-full left-0 right-0 mb-2 mx-2 bg-[#1C2733]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3 z-50 animate-slide-up h-64 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Emojis</span>
                <button onClick={onClose} className="p-1 text-gray-500 hover:text-white rounded-full bg-white/5"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="grid grid-cols-8 gap-1 overflow-y-auto no-scrollbar flex-1 pb-2">
                {EMOJIS.map((emoji, index) => (
                    <button 
                        key={index} 
                        onClick={() => onEmojiSelect(emoji)} 
                        className="text-2xl hover:bg-white/10 rounded-lg p-2 transition-all active:scale-90 flex items-center justify-center"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- Chat Screen ---
const ChatScreen: React.FC<{ 
    chat: ChatPreview; 
    onBack: () => void; 
    onToggleNav: (v: boolean) => void; 
    onViewProfile?: (userId: string) => void; 
    currentUser: User; 
    userRegistry?: Record<string, any>; 
    onTabChange?: (tab: MainTab) => void;
    onUpdateChat?: (updates: { name?: string, avatar?: string }) => void;
    onAddMembers?: (memberIds: string[]) => void;
    onPromoteToAdmin?: (memberId: string) => void;
    onRemoveFromAdmin?: (memberId: string) => void;
    onRemoveMember?: (memberId: string) => void;
}> = ({ chat, onBack, onToggleNav, onViewProfile, currentUser, userRegistry, onTabChange, onUpdateChat, onAddMembers, onPromoteToAdmin, onRemoveFromAdmin, onRemoveMember }) => {
    // --- STATE ---
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 'img-1', senderId: 'target', timestamp: 1716304000000, isSelf: false, mediaType: 'image', mediaUrl: 'https://picsum.photos/seed/chat_img/300/200' }, 
        { id: 'vid-1', senderId: 'target', timestamp: 1716304500000, isSelf: false, mediaType: 'video', mediaUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' }, 
        { id: 'sticker-1', senderId: 'target', timestamp: 1716305000000, isSelf: false, mediaType: 'sticker', mediaUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtZnN4ZnJ4bnF6ZnJ4bnF6ZnJ4bnF6ZnJ4bnF6ZnJ4bnF6eCZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/l0HlO3BJ8LxrZ4CnC/giphy.gif' },
        { id: '1', senderId: 'target', text: 'Hello! How can I help you today?', timestamp: 1716306900000, isSelf: false, reactions: [{emoji: '👏', count: 1}] },
        { id: 'file-1', senderId: 'target', timestamp: 1716307500000, isSelf: false, mediaType: 'file', fileName: 'SYSTEM MANUAL V2.PDF' },
        { id: 'v-1', senderId: 'target', timestamp: 1716308040000, isSelf: false, mediaType: 'audio', mediaUrl: 'https://www.soundjay.com/buttons/beep-01a.mp3' },
        { id: 'music-demo', senderId: 'target', timestamp: 1716308500000, isSelf: false, mediaType: 'audio', mediaUrl: 'https://www.soundjay.com/free-music/midnight-ride-01a.mp3', audioData: { title: 'Midnight Ride', artist: 'Neon Dreams', cover: 'https://picsum.photos/seed/midnight/200' } },
    ]);
    const [input, setInput] = useState('');
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [showImageGen, setShowImageGen] = useState(false);
    const [showImageEdit, setShowImageEdit] = useState(false);
    const [showVideoGen, setShowVideoGen] = useState(false);
    const [showGiphy, setShowGiphy] = useState(false);
    const [showGiftPanel, setShowGiftPanel] = useState(false);
    const [showMusicPicker, setShowMusicPicker] = useState(false);
    const [showGroupDetails, setShowGroupDetails] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [activeCall, setActiveCall] = useState<'AUDIO' | 'VIDEO' | null>(null);
    const [callStatus, setCallStatus] = useState<'RINGING' | 'CONNECTED' | 'ENDED'>('RINGING');
    const [callTime, setCallTime] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isCamOff, setIsCamOff] = useState(false);
    const [selectedAttachments, setSelectedAttachments] = useState<Attachment[]>([]);
    const [targetLang, setTargetLang] = useState(LANGUAGES.find(l => l.code === 'my') || LANGUAGES[0]);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [viewingMedia, setViewingMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
    const [viewingFile, setViewingFile] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
    const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());

    
    // Emoji Picker State
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    // Audio Playback State
    const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
    const [currentAudioTime, setCurrentAudioTime] = useState(0);
    
    // Full Screen Music Player State
    const [fullScreenMusic, setFullScreenMusic] = useState<{
        id: string;
        url: string;
        title: string;
        artist: string;
        cover: string;
    } | null>(null);
    const [isLooping, setIsLooping] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // --- REFS ---
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const shouldRecordRef = useRef(false);
    const pressStartTimeRef = useRef(0);
    const recordIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const lastTapRef = useRef<{ id: string, time: number }>({ id: '', time: 0 });

    const staticWaveform = [30, 50, 40, 70, 30, 50, 80, 40, 60, 30, 40, 80, 50, 30, 60, 40, 70, 30];

    // --- EFFECTS ---
    useEffect(() => {
        onToggleNav(false);
        return () => onToggleNav(true);
    }, [onToggleNav]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isRecording, replyingTo, showEmojiPicker, isTyping]);

    useEffect(() => {
        if(audioRef.current) {
            audioRef.current.loop = isLooping;
            audioRef.current.playbackRate = playbackRate;
        }
    }, [isLooping, playbackRate]);

    useEffect(() => {
        return () => {
            if (audioRef.current) audioRef.current.pause();
        };
    }, []);

    const handleDownload = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (e) {
            // Quietly fallback to opening in new tab without alarming user
            window.open(url, '_blank');
        }
    };

    const toggleAudio = (id: string, url: string) => {
        if (playingAudioId === id) {
            if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.pause();
                setPlayingAudioId(null);
            } else if (audioRef.current) {
                // Resume
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        if (e.name !== 'AbortError') console.error('Resume error', e);
                    });
                }
                setPlayingAudioId(id);
            }
            return;
        }

        if (audioRef.current) {
            audioRef.current.pause();
        }

        const audio = new Audio(url);
        audio.loop = isLooping;
        audio.playbackRate = playbackRate;
        audioRef.current = audio;
        
        audio.ontimeupdate = () => {
            setCurrentAudioTime(audio.currentTime);
        };

        audio.onended = () => {
            if (!isLooping) {
                setPlayingAudioId(null);
                setCurrentAudioTime(0);
            }
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                if (e.name !== 'AbortError') console.error('Play error', e);
            });
        }
        setPlayingAudioId(id);
    };

    const togglePlaybackSpeed = () => {
        const speeds = [1, 1.25, 1.5, 2, 0.5];
        const nextIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length;
        setPlaybackRate(speeds[nextIndex]);
    };

    // Helper to get playlist from messages
    const getPlaylist = () => {
        return messages.flatMap(msg => {
            if (msg.mediaType === 'audio' && msg.mediaUrl) {
                return [{
                    id: msg.id,
                    url: msg.mediaUrl,
                    title: msg.audioData?.title || msg.fileName || 'Audio',
                    artist: msg.audioData?.artist || 'Unknown Artist',
                    cover: msg.audioData?.cover || 'https://picsum.photos/200'
                }];
            }
            if (msg.attachments) {
                return msg.attachments.filter(a => a.type === 'audio').map(a => ({
                    id: a.id,
                    url: a.url,
                    title: a.fileName || 'Audio',
                    artist: 'Unknown Artist',
                    cover: 'https://picsum.photos/200'
                }));
            }
            return [];
        });
    };

    const handleTrackChange = (direction: 'next' | 'prev') => {
        const playlist = getPlaylist();
        if (playlist.length === 0) return;

        const currentId = fullScreenMusic?.id || playingAudioId;
        const currentIndex = playlist.findIndex(p => p.id === currentId);
        
        let nextIndex;
        if (currentIndex === -1) {
            nextIndex = 0; // Fallback to first
        } else {
            if (direction === 'next') {
                nextIndex = (currentIndex + 1) % playlist.length;
            } else {
                nextIndex = (currentIndex - 1 + playlist.length) % playlist.length;
            }
        }

        const nextTrack = playlist[nextIndex];
        
        // Update Full Screen UI if open
        if (fullScreenMusic) {
            setFullScreenMusic({
                id: nextTrack.id,
                url: nextTrack.url,
                title: nextTrack.title,
                artist: nextTrack.artist,
                cover: nextTrack.cover
            });
        }

        // Play the track
        toggleAudio(nextTrack.id, nextTrack.url);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentAudioTime(time);
        }
    };

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // ... (Mic Logic functions remain same) ... 
    const startRecording = async () => {
        if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch(e) {} }
        setIsListening(false);
        setIsRecording(true);
        setRecordingTime(0);
        shouldRecordRef.current = true;
        audioChunksRef.current = [];
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            recorder.start();
            if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
            const startTime = Date.now();
            recordIntervalRef.current = setInterval(() => {
                setRecordingTime((Date.now() - startTime) / 1000);
            }, 100);
        } catch (error) {
            console.error("Error starting recording:", error);
            setIsRecording(false);
        }
    };

    const stopRecording = (send: boolean) => {
        shouldRecordRef.current = false;
        if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.onstop = () => {
                if (send && audioChunksRef.current.length > 0) {
                    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const url = URL.createObjectURL(blob);
                    const newMessage: ChatMessage = { 
                        id: `audio-${Date.now()}`, 
                        senderId: currentUser.id, 
                        timestamp: Date.now(), 
                        isSelf: true, 
                        mediaType: 'audio', 
                        mediaUrl: url 
                    };
                    setMessages(prev => [...prev, newMessage]);
                }
                mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
                mediaRecorderRef.current = null;
            };
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setRecordingTime(0);
    };

    const toggleDictation = () => {
        if (isListening) {
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsListening(false);
        } else {
            if ('webkitSpeechRecognition' in window) {
                const recognition = new (window as any).webkitSpeechRecognition();
                recognitionRef.current = recognition;
                recognition.lang = targetLang.code === 'my' ? 'my-MM' : (targetLang.code || 'en-US');
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.onstart = () => setIsListening(true);
                recognition.onend = () => setIsListening(false);
                recognition.onerror = () => setIsListening(false);
                recognition.onresult = (event: any) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
                    }
                    if (finalTranscript) setInput(prev => prev + finalTranscript + ' ');
                };
                recognition.start();
            } else {
                alert("Speech recognition not supported");
            }
        }
    };

    const handleMicDown = (e: any) => {
        if (input.trim() || selectedAttachments.length > 0) return;
        pressStartTimeRef.current = Date.now();
        shouldRecordRef.current = false;
        longPressTimerRef.current = setTimeout(() => {
            shouldRecordRef.current = true;
            startRecording();
        }, 500); 
    };

    const handleMicUp = (e: any) => {
        if (input.trim() || selectedAttachments.length > 0) return;
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        if (shouldRecordRef.current) {
            stopRecording(true);
        } else {
            toggleDictation();
        }
        shouldRecordRef.current = false;
    };

    const handleMicLeave = () => {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        if (isRecording) stopRecording(false);
    };

    const handleSendMessage = async () => {
        if (!input.trim() && selectedAttachments.length === 0) return;
        
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }

        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            senderId: currentUser.id,
            text: input,
            timestamp: Date.now(),
            isSelf: true,
            attachments: selectedAttachments.length > 0 ? selectedAttachments.map(a => ({ 
                id: a.id, 
                url: a.preview, 
                type: a.type,
                fileName: a.file.name,
                fileSize: (a.file.size / 1024 / 1024).toFixed(2) + ' MB'
            })) : undefined,
            replyTo: replyingTo || undefined
        };

        setMessages(prev => [...prev, newMessage]);
        const currentInput = input;
        setInput('');
        setSelectedAttachments([]);
        setReplyingTo(null);
        setShowEmojiPicker(false);

        // AI Assistant Logic
        if (chat.isAI) {
            setIsTyping(true);
            try {
                // Call Gemini Service
                let responseText;
                if (currentInput.toLowerCase().startsWith('/think')) {
                     responseText = await geminiService.askDeepThink(currentInput.replace('/think', ''));
                } else {
                     responseText = await geminiService.chatWithAI(currentInput);
                }
                
                const aiMessage: ChatMessage = {
                    id: Date.now().toString(),
                    senderId: 'ai-assistant',
                    text: responseText,
                    timestamp: Date.now(),
                    isSelf: false
                };
                setMessages(prev => [...prev, aiMessage]);
            } catch (error) {
                console.error("AI Chat Error", error);
            } finally {
                setIsTyping(false);
            }
        }
    };

    const startCall = async (type: 'AUDIO' | 'VIDEO') => {
        setActiveCall(type);
        setCallStatus('RINGING');
        setCallTime(0);
        setIsMuted(false);
        setIsCamOff(false);
        setTimeout(async () => {
            setCallStatus('CONNECTED');
            callTimerRef.current = setInterval(() => setCallTime(t => t + 1), 1000);
            if (type === 'VIDEO') {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    localStreamRef.current = stream;
                    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
                } catch (e) {
                    console.error("Failed to access camera", e);
                    setIsCamOff(true);
                }
            }
        }, 3000);
    };

    const endCall = () => {
        if (callTimerRef.current) clearInterval(callTimerRef.current);
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        setCallStatus('ENDED');
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        setActiveCall(null);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, source: 'camera' | 'visual' | 'file') => {
        if (e.target.files && e.target.files.length > 0) {
            const newAttachments: Attachment[] = Array.from(e.target.files).map((file: File) => ({
                id: `temp-${Date.now()}-${Math.random()}`,
                file,
                preview: URL.createObjectURL(file),
                type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'file'
            }));
            setSelectedAttachments(prev => [...prev, ...newAttachments]);
            setShowAttachMenu(false);
            e.target.value = ''; 
        }
    };

    const removeAttachment = (id: string) => {
        setSelectedAttachments(prev => prev.filter(a => a.id !== id));
    };

    const handleImageGenerated = (url: string) => {
        const newMessage: ChatMessage = { id: `gen-img-${Date.now()}`, senderId: currentUser.id, timestamp: Date.now(), isSelf: true, mediaType: 'image', mediaUrl: url };
        setMessages(prev => [...prev, newMessage]);
    };

    const handleVideoGenerated = (url: string) => {
        const newMessage: ChatMessage = { id: `gen-vid-${Date.now()}`, senderId: currentUser.id, timestamp: Date.now(), isSelf: true, mediaType: 'video', mediaUrl: url };
        setMessages(prev => [...prev, newMessage]);
    };

    const handleGifSelected = (url: string, type: 'gif' | 'sticker') => {
        const newMessage: ChatMessage = { 
            id: `${type}-${Date.now()}`, 
            senderId: currentUser.id, 
            timestamp: Date.now(), 
            isSelf: true, 
            mediaType: type === 'sticker' ? 'sticker' : 'image', 
            mediaUrl: url 
        };
        setMessages(prev => [...prev, newMessage]);
        setShowGiphy(false);
    };

    const handleMusicSelected = (track: any) => {
        const newMessage: ChatMessage = {
            id: `music-${Date.now()}`,
            senderId: currentUser.id,
            timestamp: Date.now(),
            isSelf: true,
            mediaType: 'audio',
            mediaUrl: track.url,
            audioData: {
                title: track.title,
                artist: track.artist,
                cover: track.cover
            }
        };
        setMessages(prev => [...prev, newMessage]);
        setShowMusicPicker(false);
    };

    const handleMessageTap = (msg: ChatMessage) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;
        if (lastTapRef.current.id === msg.id && now - lastTapRef.current.time < DOUBLE_TAP_DELAY) {
            setReplyingTo(msg);
        } else {
            lastTapRef.current = { id: msg.id, time: now };
        }
    };

    const handleAddEmoji = (emoji: string) => {
        setInput(prev => prev + emoji);
    };

    const handleTranslate = async (msgId: string, text: string) => {
        if (!text) return;
        
        if (translatedMessages[msgId]) {
            // Toggle off
            const newMap = { ...translatedMessages };
            delete newMap[msgId];
            setTranslatedMessages(newMap);
            return;
        }

        setTranslatingIds(prev => new Set(prev).add(msgId));
        try {
            const translated = await geminiService.translateText(text, targetLang.full);
            setTranslatedMessages(prev => ({ ...prev, [msgId]: translated }));
        } catch (e) {
            console.error(e);
        } finally {
            setTranslatingIds(prev => {
                const next = new Set(prev);
                next.delete(msgId);
                return next;
            });
        }
    };

    return (
        <div className="h-full w-full bg-[#0B1017] flex flex-col relative animate-fade-in">
            {/* Styles for visualizer */}
            <style>{`
                @keyframes audio-wave {
                    0% { height: 4px; }
                    50% { height: 100%; }
                    100% { height: 4px; }
                }
            `}</style>

            {/* FULL SCREEN MUSIC PLAYER OVERLAY */}
            {fullScreenMusic && (
                <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-slide-up" style={{ height: '100dvh', minHeight: '100vh' }}>
                    {/* Background Image Layer */}
                    <div className="absolute inset-0 z-0">
                        <img src={fullScreenMusic.cover} className="w-full h-full object-cover blur-2xl opacity-50 scale-110" />
                        <div className="absolute inset-0 bg-black/40" />
                    </div>
                    
                    {/* Content Layer */}
                    <div className="relative z-10 flex flex-col h-full min-h-0 pt-safe pb-safe px-4" style={{ paddingTop: 'env(safe-area-inset-top, 3rem)', paddingBottom: 'env(safe-area-inset-bottom, 2rem)' }}>
                        {/* Header */}
                        <div className="flex justify-between items-center mb-4 sm:mb-8 shrink-0">
                            <button onClick={() => setFullScreenMusic(null)} className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-md active:scale-95 transition-transform text-white">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">NOW PLAYING</span>
                            </div>
                            <button 
                                onClick={togglePlaybackSpeed} 
                                className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-md text-[10px] font-bold text-white active:scale-95 transition-transform"
                            >
                                {playbackRate}x
                            </button>
                        </div>
                        
                        {/* Artwork */}
                        <div className="flex-1 flex items-center justify-center py-2 sm:py-4 min-h-0 overflow-hidden">
                            <div className="w-full max-w-[85vw] sm:max-w-md aspect-square rounded-[32px] overflow-hidden shadow-2xl border border-white/10 relative">
                                <img src={fullScreenMusic.cover} className="w-full h-full object-cover" />
                            </div>
                        </div>
                        
                        {/* Meta */}
                        <div className="mb-4 sm:mb-8 mt-2 sm:mt-4 text-center shrink-0 px-2">
                            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2 leading-tight truncate">{fullScreenMusic.title}</h2>
                            <p className="text-xs sm:text-sm text-gray-400 font-medium truncate">{fullScreenMusic.artist}</p>
                        </div>
                        
                        {/* Progress Slider */}
                        <div className="mb-6 sm:mb-10 w-full shrink-0 px-2 sm:px-6">
                            <input
                                type="range"
                                min="0"
                                max={audioRef.current?.duration || 0}
                                value={currentAudioTime}
                                onChange={handleSeek}
                                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                style={{
                                    backgroundSize: `${(currentAudioTime / (audioRef.current?.duration || 1)) * 100}% 100%`,
                                    backgroundImage: 'linear-gradient(#06b6d4, #06b6d4)', // Cyan-500
                                    backgroundRepeat: 'no-repeat'
                                }}
                            />
                            <style>{`
                                input[type=range]::-webkit-slider-thumb {
                                    -webkit-appearance: none;
                                    height: 12px;
                                    width: 12px;
                                    border-radius: 50%;
                                    background: #fff;
                                    cursor: pointer;
                                    box-shadow: 0 0 10px rgba(0,0,0,0.5);
                                }
                            `}</style>
                            <div className="flex justify-between text-[10px] text-gray-400 font-bold font-mono mt-3">
                                <span>{formatTime(currentAudioTime)}</span>
                                <span>{formatTime(audioRef.current?.duration || 0)}</span>
                            </div>
                        </div>
                        
                        {/* Controls Container - Constrained Width */}
                        <div className="flex items-center justify-between w-full max-w-[280px] mx-auto mb-4 sm:mb-8 shrink-0">
                            {/* Loop Button */}
                            <button onClick={() => setIsLooping(!isLooping)} className={`transition-colors active:scale-90 ${isLooping ? 'text-cyan-400' : 'text-gray-400 hover:text-white'}`}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </button>
                            
                            {/* Previous */}
                            <button onClick={() => handleTrackChange('prev')} className="text-white hover:opacity-80 active:scale-95 transition-transform">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
                            </button>
                            
                            {/* Play/Pause */}
                            <button 
                                onClick={() => toggleAudio(fullScreenMusic.id, fullScreenMusic.url)}
                                className="w-14 h-14 bg-cyan-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 active:scale-95 transition-transform"
                            >
                                {playingAudioId === fullScreenMusic.id ? (
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                ) : (
                                    <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                )}
                            </button>
                            
                            {/* Next */}
                            <button onClick={() => handleTrackChange('next')} className="text-white hover:opacity-80 active:scale-95 transition-transform">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            </button>
                            
                            {/* Download Button */}
                            <button 
                                onClick={() => handleDownload(fullScreenMusic.url, `${fullScreenMusic.title}.mp3`)}
                                className="text-gray-400 hover:text-white active:scale-90 transition-transform"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Call Overlay */}
            {activeCall && (
                <div className="absolute inset-0 z-50 bg-[#0B1017] flex flex-col">
                    <div className="relative flex-1">
                        {activeCall === 'VIDEO' && (
                            <video ref={localVideoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 flex flex-col items-center pt-20 bg-gradient-to-b from-black/60 to-transparent">
                            <div className="w-24 h-24 rounded-full border-4 border-cyan-500 p-1 mb-4">
                                <img src={chat.avatar} className="w-full h-full rounded-full object-cover" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">{chat.name}</h2>
                            <p className="text-cyan-400 animate-pulse font-medium mt-1">
                                {callStatus === 'RINGING' ? 'Calling...' : callStatus === 'CONNECTED' ? `${Math.floor(callTime / 60)}:${(callTime % 60).toString().padStart(2, '0')}` : 'Call Ended'}
                            </p>
                        </div>
                    </div>
                    <div className="bg-[#1C2733] p-8 rounded-t-3xl flex justify-center gap-8 items-center pb-safe">
                        <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-full ${isMuted ? 'bg-white text-black' : 'bg-gray-800 text-white'}`}><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg></button>
                        <button onClick={endCall} className="p-5 rounded-full bg-red-600 text-white shadow-lg active:scale-95 transition-transform"><svg className="w-8 h-8 transform rotate-[135deg]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 005.516 5.516l.773-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg></button>
                        {activeCall === 'VIDEO' && <button onClick={() => setIsCamOff(!isCamOff)} className={`p-4 rounded-full ${isCamOff ? 'bg-white text-black' : 'bg-gray-800 text-white'}`}><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 bg-[#1C2733] border-b border-white/5 safe-area-top">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white active:scale-95 transition-transform shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"><svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                    <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0 flex-1" onClick={() => { if(chat.isGroup) setShowGroupDetails(true); else if(onViewProfile && !chat.isAI) onViewProfile(chat.id); }}>
                        <div className="relative shrink-0">
                            <img src={chat.avatar} className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full object-cover bg-gray-800" />
                            {chat.isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-[#1C2733]"></div>}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-white text-sm sm:text-base truncate">{chat.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">{chat.isAI ? 'AI Assistant' : chat.isGroup ? `${chat.participants?.length || 2} members` : chat.isOnline ? 'Online' : 'Offline'}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <div className="relative">
                        <button onClick={() => setShowLangMenu(!showLangMenu)} className="flex items-center gap-1 bg-gray-800 rounded-full px-2 sm:px-3 py-1.5 text-xs sm:text-sm hover:bg-gray-700 active:scale-95 transition-all min-h-[36px]">
                            <span className="text-sm sm:text-base">{targetLang.flag}</span>
                            <span className="font-bold text-gray-300 hidden sm:inline">{targetLang.code.toUpperCase()}</span>
                        </button>
                        {showLangMenu && (
                            <div className="absolute top-full right-0 mt-2 w-48 sm:w-56 bg-[#1C2733] border border-white/10 rounded-xl max-h-60 overflow-y-auto z-50 shadow-xl animate-fade-in no-scrollbar">
                               {LANGUAGES.map(l => (
                                   <button key={l.code} onClick={() => { setTargetLang(l); setShowLangMenu(false); }} className={`w-full text-left px-4 py-3 hover:bg-white/5 active:bg-white/10 flex items-center gap-3 border-b border-white/5 min-h-[48px] ${targetLang.code === l.code ? 'bg-white/5' : ''}`}>
                                       <span className="text-xl">{l.flag}</span>
                                       <span className={`text-sm font-bold ${targetLang.code === l.code ? 'text-cyan-400' : 'text-white'}`}>{l.full}</span>
                                   </button>
                               ))}
                            </div>
                        )}
                    </div>
                    <button onClick={() => startCall('AUDIO')} className="p-2 text-gray-400 hover:text-white active:scale-95 transition-transform min-w-[44px] min-h-[44px] flex items-center justify-center"><svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></button>
                    <button onClick={() => startCall('VIDEO')} className="p-2 text-gray-400 hover:text-white active:scale-95 transition-transform min-w-[44px] min-h-[44px] flex items-center justify-center"><svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
                </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 no-scrollbar max-w-4xl mx-auto w-full" ref={scrollRef}>
                {messages.map((msg, index) => {
                    let messageAvatar = chat.avatar;
                    let senderName = null;

                    if (chat.isGroup && !msg.isSelf) {
                        const contact = CONTACTS.find(c => c.id === msg.senderId);
                        if (contact) {
                            messageAvatar = contact.avatar;
                            senderName = contact.name.split(' ')[0];
                        } else if (userRegistry && userRegistry[msg.senderId]) {
                            messageAvatar = userRegistry[msg.senderId].avatar;
                            senderName = userRegistry[msg.senderId].name;
                        }
                    }

                    const isSticker = msg.mediaType === 'sticker';
                    const isEmojiOnly = msg.text && /^\p{Emoji}+$/u.test(msg.text) && msg.text.length < 10;

                    return (
                        <div key={msg.id} className={`flex ${msg.isSelf ? 'justify-end' : 'justify-start'}`}>
                            {/* ONLY SHOW AVATAR IF GROUP CHAT AND NOT SELF */}
                            {!msg.isSelf && chat.isGroup && (
                                <img src={messageAvatar} className="w-8 h-8 rounded-full object-cover mr-2 self-end mb-1" />
                            )}
                            <div 
                                onClick={() => handleMessageTap(msg)}
                                className={`max-w-[80%] rounded-2xl active:scale-[0.98] transition-transform ${isSticker || isEmojiOnly ? 'bg-transparent' : (msg.isSelf ? 'bg-cyan-600 text-white rounded-br-none px-4 py-3' : 'bg-[#1C2733] text-gray-200 rounded-bl-none px-4 py-3')}`}
                            >
                                {/* REPLY PREVIEW */}
                                {msg.replyTo && (
                                    <div className={`text-xs mb-2 p-2 rounded border-l-2 ${msg.isSelf ? 'bg-white/10 border-white/50' : 'bg-black/20 border-cyan-500'} opacity-90`}>
                                        <p className="font-bold text-[10px] mb-0.5 opacity-70">{msg.replyTo.isSelf ? 'You' : 'User'}</p>
                                        <p className="truncate opacity-90">{msg.replyTo.text || (msg.replyTo.mediaType ? `[${msg.replyTo.mediaType}]` : 'Message')}</p>
                                    </div>
                                )}

                                {chat.isGroup && !msg.isSelf && senderName && !isSticker && (
                                    <p className="text-[10px] text-orange-400 font-bold mb-1 opacity-80">{senderName}</p>
                                )}
                                
                                {/* UNIFIED MEDIA RENDERING */}
                                {(() => {
                                    // Normalize all media into an array
                                    const mediaList = msg.attachments && msg.attachments.length > 0 
                                        ? msg.attachments 
                                        : (msg.mediaUrl ? [{ id: `legacy-${msg.id}`, url: msg.mediaUrl, type: msg.mediaType || 'image', fileName: msg.fileName, fileSize: (msg as any).fileSize, audioData: msg.audioData }] : []);

                                    if (mediaList.length === 0) return null;

                                    // Grid class for multiple images/videos
                                    const gridClass = mediaList.length > 1 ? 'grid grid-cols-2 gap-1.5 mb-2' : 'mb-2';

                                    return (
                                        <div className={gridClass}>
                                            {mediaList.map((media: any, i: number) => (
                                                <div key={media.id || i} className={`${(media.type === 'audio' || media.type === 'file') ? 'col-span-2' : ''} rounded-lg overflow-hidden`}>
                                                    {media.type === 'sticker' || isSticker ? (
                                                        <img 
                                                            src={media.url} 
                                                            className="w-32 h-32 object-contain cursor-pointer"
                                                            onClick={(e) => { e.stopPropagation(); setViewingMedia({url: media.url, type: 'image'}); }} 
                                                        />
                                                    ) : media.type === 'image' ? (
                                                        <img 
                                                            src={media.url} 
                                                            className={`w-full object-cover cursor-pointer ${mediaList.length > 1 ? 'aspect-square h-full' : 'h-auto max-h-[300px]'}`}
                                                            onClick={(e) => { e.stopPropagation(); setViewingMedia({url: media.url, type: 'image'}); }} 
                                                        />
                                                    ) : media.type === 'video' ? (
                                                        <div className={`relative cursor-pointer bg-black ${mediaList.length > 1 ? 'aspect-square' : ''}`} onClick={(e) => { e.stopPropagation(); setViewingMedia({url: media.url, type: 'video'}); }}>
                                                            <video src={media.url} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                                <svg className="w-10 h-10 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                                            </div>
                                                        </div>
                                                    ) : media.type === 'audio' ? (
                                                        (msg.audioData || media.audioData || media.fileName) ? (
                                                            // MUSIC PLAYER CARD
                                                            <div className="bg-[#1A1A1A] p-3 rounded-2xl border border-white/5 w-64 shadow-lg overflow-hidden relative">
                                                                 {/* Background Glow */}
                                                                 <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                                                                 <div className="flex items-center gap-3 relative z-10">
                                                                     {/* Icon or Cover Art */}
                                                                     <div 
                                                                        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shrink-0 overflow-hidden bg-gray-800 cursor-pointer"
                                                                        onClick={() => setFullScreenMusic({
                                                                            id: media.id || msg.id,
                                                                            url: media.url,
                                                                            title: (msg.audioData || media.audioData)?.title || media.fileName || 'Audio File',
                                                                            artist: (msg.audioData || media.audioData)?.artist || 'Unknown Artist',
                                                                            cover: (msg.audioData || media.audioData)?.cover || 'https://picsum.photos/200'
                                                                        })}
                                                                     >
                                                                         {(msg.audioData || media.audioData)?.cover ? (
                                                                             <img src={(msg.audioData || media.audioData).cover} className="w-full h-full object-cover" />
                                                                         ) : (
                                                                             <div className="w-full h-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                                                                                 <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                                                                             </div>
                                                                         )}
                                                                     </div>
                                                                     
                                                                     {/* Info */}
                                                                     <div className="flex-1 min-w-0">
                                                                         <h4 className="text-white text-sm font-bold truncate">{(msg.audioData || media.audioData)?.title || media.fileName || 'Audio File'}</h4>
                                                                         <p className="text-xs text-gray-400 truncate">{(msg.audioData || media.audioData)?.artist || 'Unknown Artist'}</p>
                                                                     </div>

                                                                     {/* Play Button */}
                                                                     <button 
                                                                        onClick={(e) => { e.stopPropagation(); toggleAudio(media.id || msg.id, media.url); }}
                                                                        className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                                                                     >
                                                                         {playingAudioId === (media.id || msg.id) ? (
                                                                             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                                                         ) : (
                                                                             <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                                                         )}
                                                                     </button>
                                                                 </div>

                                                                 {/* Progress Bar */}
                                                                 <div className="mt-3 relative z-10">
                                                                     <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                                                                         <div 
                                                                            className="h-full bg-cyan-500 transition-all duration-100 ease-linear" 
                                                                            style={{ width: playingAudioId === (media.id || msg.id) ? `${(currentAudioTime / (audioRef.current?.duration || 1)) * 100}%` : '0%' }}
                                                                         ></div>
                                                                     </div>
                                                                     <div className="flex justify-between mt-1">
                                                                         <span className="text-[10px] text-gray-500 font-mono">{playingAudioId === (media.id || msg.id) ? formatTime(currentAudioTime) : "0:00"}</span>
                                                                         <span className="text-[10px] text-gray-500 font-mono">Music</span>
                                                                     </div>
                                                                 </div>

                                                                 {/* Bottom Actions Row */}
                                                                 <div className="mt-3 flex items-center justify-between relative z-10 border-t border-white/5 pt-2">
                                                                     <button 
                                                                        onClick={() => setFullScreenMusic({
                                                                            id: media.id || msg.id,
                                                                            url: media.url,
                                                                            title: (msg.audioData || media.audioData)?.title || media.fileName || 'Audio File',
                                                                            artist: (msg.audioData || media.audioData)?.artist || 'Unknown Artist',
                                                                            cover: (msg.audioData || media.audioData)?.cover || 'https://picsum.photos/200'
                                                                        })}
                                                                        className="text-[9px] text-gray-400 hover:text-white flex items-center gap-1 font-bold uppercase tracking-wider"
                                                                     >
                                                                         <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                                                                         Full Screen
                                                                     </button>
                                                                     <button 
                                                                        onClick={() => handleDownload(media.url, media.fileName || 'audio.mp3')}
                                                                        className="text-[9px] text-cyan-400 hover:text-white flex items-center gap-1 font-bold uppercase tracking-wider"
                                                                     >
                                                                         Download
                                                                         <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                                     </button>
                                                                 </div>
                                                            </div>
                                                        ) : (
                                                            // STANDARD VOICE NOTE PLAYER
                                                            <div className="flex items-center gap-3 bg-[#1A232E]/90 p-2.5 rounded-2xl min-w-[220px] border border-white/5 backdrop-blur-sm shadow-sm">
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); toggleAudio(media.id || msg.id, media.url); }}
                                                                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-md ${playingAudioId === (media.id || msg.id) ? 'bg-cyan-500 text-white shadow-cyan-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                                                >
                                                                    {playingAudioId === (media.id || msg.id) ? (
                                                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                                                    ) : (
                                                                        <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                                                    )}
                                                                </button>
                                                                
                                                                <div className="flex flex-col justify-center gap-0.5 flex-1 h-8 overflow-hidden">
                                                                    <div className="flex items-center gap-[2px] h-full w-full">
                                                                        {staticWaveform.map((height, idx) => (
                                                                            <div 
                                                                                key={idx} 
                                                                                className={`w-1 rounded-full transition-all duration-300 ${playingAudioId === (media.id || msg.id) ? 'bg-cyan-400' : 'bg-white/30'}`}
                                                                                style={{ 
                                                                                    height: playingAudioId === (media.id || msg.id)
                                                                                        ? `${30 + Math.random() * 60}%` 
                                                                                        : `${height}%`,
                                                                                    animation: playingAudioId === (media.id || msg.id) ? `audio-wave 0.6s ease-in-out infinite alternate` : 'none',
                                                                                    animationDelay: `${idx * 0.05}s`
                                                                                }}
                                                                            ></div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                
                                                                <span className="text-[10px] text-gray-400 font-mono font-bold w-10 text-right tabular-nums">
                                                                    {playingAudioId === (media.id || msg.id) ? formatTime(currentAudioTime) : (media.fileSize || "0:15")}
                                                                </span>
                                                            </div>
                                                        )
                                                    ) : (
                                                        <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl cursor-pointer border border-white/5 hover:bg-black/30 transition-colors" onClick={(e) => { e.stopPropagation(); setViewingFile(media.fileName || 'file'); }}>
                                                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-cyan-400">
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-sm font-medium text-gray-200 truncate max-w-[150px]">{media.fileName || 'Document'}</span>
                                                                <span className="text-[10px] text-gray-500 uppercase font-bold">{media.url ? media.url.split('.').pop() : 'FILE'}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}

                                {msg.text && (
                                    <div>
                                        {translatedMessages[msg.id] ? (
                                            <>
                                                <p className={`whitespace-pre-wrap leading-relaxed ${isEmojiOnly ? 'text-4xl' : 'text-sm'}`}>{translatedMessages[msg.id]}</p>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleTranslate(msg.id, msg.text || ''); }}
                                                    className="text-[10px] text-cyan-400 hover:text-cyan-300 mt-1 underline"
                                                >
                                                    Show original
                                                </button>
                                            </>
                                        ) : (
                                            <p className={`whitespace-pre-wrap leading-relaxed ${isEmojiOnly ? 'text-4xl' : 'text-sm'}`}>{msg.text}</p>
                                        )}
                                    </div>
                                )}
                                {!isSticker && !isEmojiOnly && msg.text && (
                                    <div className="flex items-center justify-between mt-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleTranslate(msg.id, msg.text || ''); }}
                                            className="text-[10px] text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
                                            disabled={translatingIds.has(msg.id)}
                                        >
                                            {translatingIds.has(msg.id) ? (
                                                <>
                                                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Translating...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                                    </svg>
                                                    Translate
                                                </>
                                            )}
                                        </button>
                                        <p className="text-[10px] text-white/50">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                )}
                                {!isSticker && !isEmojiOnly && !msg.text && (
                                    <p className="text-[10px] text-white/50 text-right mt-1">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
                {isTyping && (
                    <div className="flex gap-2 p-4 items-center">
                        <div className="w-8 h-8 rounded-full bg-cyan-900/30 flex items-center justify-center animate-pulse">
                            <span className="text-cyan-400 text-xs font-bold">AI</span>
                        </div>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 sm:p-4 border-t border-white/5 bg-[#17212B] safe-area-bottom max-w-4xl mx-auto w-full">
                
                {replyingTo && (
                    <div className="flex justify-between items-center px-4 py-2 mb-2 bg-[#0B1017] rounded-xl border-l-4 border-cyan-500 animate-slide-up">
                        <div>
                            <span className="text-xs text-cyan-400 font-bold block mb-0.5">Replying to {replyingTo.isSelf ? 'Yourself' : 'User'}</span>
                            <span className="text-xs text-gray-400 truncate block max-w-[250px]">{replyingTo.text || (replyingTo.mediaType ? `[${replyingTo.mediaType}]` : 'Message')}</span>
                        </div>
                        <button onClick={() => setReplyingTo(null)} className="p-1 hover:text-white text-gray-500">✕</button>
                    </div>
                )}

                {/* Attachment Menu Popup */}
                {showAttachMenu && (
                    <div className="absolute bottom-[80px] left-4 z-50 animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="bg-[#1C2733]/95 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl grid grid-cols-4 gap-4 w-72">
                            <button onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }} className="flex flex-col items-center gap-2 group">
                                <div className="w-12 h-12 rounded-full bg-cyan-900/30 flex items-center justify-center border border-cyan-500/30 group-hover:bg-cyan-500/20 transition-colors">
                                    <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">Gallery</span>
                            </button>
                            <button onClick={() => { setShowImageGen(true); setShowAttachMenu(false); }} className="flex flex-col items-center gap-2 group">
                                <div className="w-12 h-12 rounded-full bg-purple-900/30 flex items-center justify-center border border-purple-500/30 group-hover:bg-purple-500/20 transition-colors">
                                    <span className="font-black text-xs text-purple-400">AI GEN</span>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">Generate</span>
                            </button>
                            <button onClick={() => { setShowMusicPicker(true); setShowAttachMenu(false); }} className="flex flex-col items-center gap-2 group">
                                <div className="w-12 h-12 rounded-full bg-pink-900/30 flex items-center justify-center border border-pink-500/30 group-hover:bg-pink-500/20 transition-colors">
                                    <span className="text-xl">🎵</span>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">Music</span>
                            </button>
                            <button onClick={() => { setShowGiphy(true); setShowAttachMenu(false); }} className="flex flex-col items-center gap-2 group">
                                <div className="w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center border border-green-500/30 group-hover:bg-green-500/20 transition-colors">
                                    <span className="font-black text-xs text-green-400">GIF</span>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">Sticker</span>
                            </button>
                            <button onClick={() => { setShowImageEdit(true); setShowAttachMenu(false); }} className="flex flex-col items-center gap-2 group">
                                <div className="w-12 h-12 rounded-full bg-yellow-900/30 flex items-center justify-center border border-yellow-500/30 group-hover:bg-yellow-500/20 transition-colors">
                                    <span className="text-xl">🖌️</span>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">Edit</span>
                            </button>
                            <button onClick={() => { setShowVideoGen(true); setShowAttachMenu(false); }} className="flex flex-col items-center gap-2 group">
                                <div className="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center border border-red-500/30 group-hover:bg-red-500/20 transition-colors">
                                    <span className="text-xl">🎬</span>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">Video AI</span>
                            </button>
                            <button onClick={() => { setShowAttachMenu(false); }} className="flex flex-col items-center gap-2 group">
                                <div className="w-12 h-12 rounded-full bg-blue-900/30 flex items-center justify-center border border-blue-500/30 group-hover:bg-blue-500/20 transition-colors">
                                    <span className="text-xl">📄</span>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">File</span>
                            </button>
                            <button onClick={() => { setShowGiftPanel(true); setShowAttachMenu(false); }} className="flex flex-col items-center gap-2 group">
                                <div className="w-12 h-12 rounded-full bg-orange-900/30 flex items-center justify-center border border-orange-500/30 group-hover:bg-orange-500/20 transition-colors">
                                    <span className="text-xl">🎁</span>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">Gift</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Emoji Picker Popup */}
                {showEmojiPicker && (
                    <EmojiPicker onEmojiSelect={handleAddEmoji} onClose={() => setShowEmojiPicker(false)} />
                )}

                {/* Selected Attachments Preview */}
                {selectedAttachments.length > 0 && (
                    <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
                        {selectedAttachments.map(att => (
                            <div key={att.id} className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-white/20 group">
                                {att.type === 'video' ? <video src={att.preview} className="w-full h-full object-cover" /> : att.type === 'image' ? <img src={att.preview} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white font-bold text-xs uppercase">{att.type}</div>}
                                <button onClick={() => removeAttachment(att.id)} className="absolute top-0 right-0 bg-red-600 p-0.5 rounded-bl hover:bg-red-700">✕</button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-end gap-2">
                    <button 
                        onClick={() => setShowAttachMenu(!showAttachMenu)} 
                        className={`p-2.5 rounded-full transition-all active:scale-95 ${showAttachMenu ? 'bg-cyan-600 text-white' : 'bg-[#0B1017] text-gray-400 hover:text-white border border-white/10'}`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </button>

                    <div className="flex-1 bg-[#0B1017] rounded-2xl flex items-end px-3 py-2 border border-white/10 focus-within:border-cyan-500/50 transition-colors">
                        <textarea 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            placeholder={isListening ? "Listening (Burmese)..." : "Message..."} 
                            className={`bg-transparent text-white text-sm w-full outline-none py-1 max-h-24 resize-none ${isListening ? 'placeholder-red-400 animate-pulse' : 'placeholder-gray-500'}`}
                            rows={1}
                            style={{ minHeight: '28px' }}
                            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        />
                        <button 
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                            className={`p-1 transition-colors active:scale-95 ${showEmojiPicker ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                    </div>

                    {input.trim() || selectedAttachments.length > 0 ? (
                        <button 
                            onClick={handleSendMessage} 
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
                            onMouseLeave={handleMicLeave}
                            className={`p-2.5 rounded-full transition-all shadow-lg active:scale-90 ${isRecording ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)] scale-110 animate-pulse' : isListening ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse' : 'bg-[#0B1017] text-white border border-white/10 hover:bg-white/10'}`}
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
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx" 
                className="hidden" 
                onChange={handleFileSelect} 
            />

            {/* Modals & Overlays */}
            {viewingMedia && (
                <MediaViewer 
                    url={viewingMedia.url} 
                    type={viewingMedia.type as 'image' | 'video'} 
                    onClose={() => setViewingMedia(null)} 
                />
            )}
            
            {viewingFile && (
                <DocumentViewer 
                    fileName={viewingFile} 
                    onClose={() => setViewingFile(null)} 
                />
            )}

            {showImageGen && <ImageGenSheet onClose={() => setShowImageGen(false)} onGenerate={handleImageGenerated} />}
            {showVideoGen && <VideoGenSheet onClose={() => setShowVideoGen(false)} onGenerate={handleVideoGenerated} />}
            {showImageEdit && <ImageEditSheet onClose={() => setShowImageEdit(false)} onGenerate={handleImageGenerated} />}
            {showMusicPicker && <MusicSheet onClose={() => setShowMusicPicker(false)} onSelect={handleMusicSelected} />}
            {showGiphy && <GiphySheet onClose={() => setShowGiphy(false)} onSelect={handleGifSelected} />}
            
            {showGroupDetails && (
                <GroupDetailsSheet 
                    chat={chat} 
                    onClose={() => setShowGroupDetails(false)} 
                    onLeave={() => { onBack(); }}
                    userRegistry={userRegistry}
                    onUpdate={onUpdateChat}
                    onAddMembers={onAddMembers}
                    onPromoteToAdmin={onPromoteToAdmin}
                    onRemoveFromAdmin={onRemoveFromAdmin}
                    onRemoveMember={onRemoveMember}
                    currentUser={currentUser}
                />
            )}

            <GiftPanel 
                isOpen={showGiftPanel} 
                onClose={() => setShowGiftPanel(false)} 
                onSendGift={(gift) => {
                    const newMessage: ChatMessage = {
                        id: `gift-${Date.now()}`,
                        senderId: currentUser.id,
                        text: `Sent a gift: ${gift.name} x${gift.combo}`,
                        timestamp: Date.now(),
                        isSelf: true
                    };
                    setMessages(prev => [...prev, newMessage]);
                    setShowGiftPanel(false);
                }} 
            />
        </div>
    );
};

const CallHistoryScreen: React.FC<{
    calls: ChatPreview[];
    onBack: () => void;
    onCallClick: (callId: string) => void;
}> = ({ calls, onBack, onCallClick }) => {
    return (
        <div className="h-full w-full bg-[#0B1017] text-white flex flex-col relative max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5 bg-[#17212B] safe-area-top">
                <div className="flex items-center gap-2 sm:gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white active:scale-95 transition-transform min-w-[44px] min-h-[44px] flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">Call History</h1>
                </div>
            </div>

            {/* Call List */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {calls.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
                        <svg className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <p className="text-xs sm:text-sm font-medium">No call history</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto w-full">
                        {calls.map(call => (
                            <div 
                                key={call.id} 
                                onClick={() => onCallClick(call.id)}
                                className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer min-h-[64px] sm:min-h-[72px]"
                            >
                                <div className="relative shrink-0">
                                    <img src={call.avatar} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover bg-gray-800" />
                                    <div className={`absolute bottom-0 right-0 p-1 rounded-full border-2 border-[#0B1017] ${call.callStatus === 'missed' ? 'bg-red-500' : call.callStatus === 'outgoing' ? 'bg-cyan-500' : 'bg-green-500'}`}>
                                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={call.isVideo ? "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" : "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"} />
                                        </svg>
                                    </div>
                                    {call.isOnline && <div className="absolute top-0 left-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-[#0B1017] rounded-full"></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5 sm:mb-1">
                                        <h3 className="font-bold text-sm sm:text-base truncate">{call.name}</h3>
                                        <span className="text-[10px] sm:text-xs text-gray-500 ml-2 shrink-0">{call.time}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {call.callStatus === 'outgoing' && (
                                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                            </svg>
                                        )}
                                        {call.callStatus === 'incoming' && (
                                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                            </svg>
                                        )}
                                        {call.callStatus === 'missed' && (
                                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        )}
                                        <p className={`text-xs sm:text-sm truncate ${call.callStatus === 'missed' ? 'text-red-400' : 'text-gray-400'}`}>
                                            {call.lastMessage}
                                        </p>
                                    </div>
                                </div>
                                {call.isVideo && (
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const Messages: React.FC<MessagesProps> = ({ onToggleNav, initialChatId, onChatOpened, onViewProfile, currentUser, userRegistry, onTabChange }) => {
    const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId || null);
    const [showNewChat, setShowNewChat] = useState(false);
    const [showChatOptions, setShowChatOptions] = useState<ChatPreview | null>(null);
    const [chats, setChats] = useState<ChatPreview[]>(sortChats(MOCK_CHATS));
    const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'GROUPS'>('ALL');
    const [view, setView] = useState<'messages' | 'calls'>('messages');
    const [calls, setCalls] = useState<ChatPreview[]>(MOCK_CALLS);

    useEffect(() => {
        if (initialChatId) {
            setSelectedChatId(initialChatId);
            if(onChatOpened) onChatOpened();
        }
    }, [initialChatId, onChatOpened]);

    useEffect(() => {
        onToggleNav(!selectedChatId);
    }, [selectedChatId, onToggleNav]);

    const handlePinChat = (id: string) => {
        setChats(prev => {
            const newChats = prev.map(c => c.id === id ? { ...c, isPinned: !c.isPinned } : c);
            return sortChats(newChats);
        });
        setShowChatOptions(null);
    };

    const handleDeleteChat = (id: string) => {
        setChats(prev => prev.filter(c => c.id !== id));
        setShowChatOptions(null);
    };

    const handleCreateGroup = (name: string, ids: string[], image: string | null) => {
        const newGroup: ChatPreview = {
            id: `group_${Date.now()}`,
            name,
            avatar: image || 'https://picsum.photos/200',
            lastMessage: 'Group created',
            time: 'Just now',
            unreadCount: 0,
            isOnline: false,
            isPinned: false,
            isGroup: true,
            participants: ids
        };
        setChats(prev => [newGroup, ...prev]);
    };

    const handleUpdateChat = (chatId: string, updates: { name?: string, avatar?: string }) => {
        setChats(prev => prev.map(c => 
            c.id === chatId ? { ...c, ...updates } : c
        ));
    };

    const handleAddMembers = (chatId: string, memberIds: string[]) => {
        setChats(prev => prev.map(c => {
            if (c.id === chatId && c.isGroup) {
                const currentParticipants = c.participants || [];
                const newParticipants = [...new Set([...currentParticipants, ...memberIds])];
                return { ...c, participants: newParticipants };
            }
            return c;
        }));
    };

    const handlePromoteToAdmin = (chatId: string, memberId: string) => {
        // In a real app, this would update the backend
        // For now, we just update the local state through GroupDetailsSheet's internal state
        setChats(prev => prev.map(c => c.id === chatId ? { ...c } : c));
    };

    const handleRemoveFromAdmin = (chatId: string, memberId: string) => {
        // In a real app, this would update the backend
        setChats(prev => prev.map(c => c.id === chatId ? { ...c } : c));
    };

    const handleRemoveMember = (chatId: string, memberId: string) => {
        setChats(prev => prev.map(c => {
            if (c.id === chatId && c.isGroup) {
                const currentParticipants = c.participants || [];
                const newParticipants = currentParticipants.filter(id => id !== memberId);
                return { ...c, participants: newParticipants };
            }
            return c;
        }));
    };

    // Derived state for filtering
    const filteredChats = chats.filter(c => {
        if (filter === 'UNREAD') return c.unreadCount > 0;
        if (filter === 'GROUPS') return c.isGroup;
        return true;
    });

    if (selectedChatId) {
        const chat = chats.find(c => c.id === selectedChatId) || 
                     MOCK_CALLS.find(c => c.id === selectedChatId) || 
                     { id: selectedChatId, name: 'User', avatar: 'https://picsum.photos/200', lastMessage: '', time: '', unreadCount: 0, isOnline: false, isPinned: false };
        
        return (
            <ChatScreen 
                chat={chat} 
                onBack={() => setSelectedChatId(null)} 
                onToggleNav={onToggleNav}
                onViewProfile={onViewProfile}
                currentUser={currentUser}
                userRegistry={userRegistry}
                onTabChange={onTabChange}
                onUpdateChat={(updates) => handleUpdateChat(chat.id, updates)}
                onAddMembers={(memberIds) => handleAddMembers(chat.id, memberIds)}
                onPromoteToAdmin={(memberId) => handlePromoteToAdmin(chat.id, memberId)}
                onRemoveFromAdmin={(memberId) => handleRemoveFromAdmin(chat.id, memberId)}
                onRemoveMember={(memberId) => handleRemoveMember(chat.id, memberId)}
            />
        );
    }

    // Show Call History Screen
    if (view === 'calls') {
        return (
            <CallHistoryScreen 
                calls={calls}
                onBack={() => setView('messages')}
                onCallClick={(callId) => setSelectedChatId(callId)}
            />
        );
    }

    return (
        <div className="h-full w-full bg-[#0B1017] text-white flex flex-col relative max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5 bg-[#17212B] safe-area-top">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">Messages</h1>
                <div className="flex gap-2 sm:gap-3">
                    <button 
                        onClick={() => setView('calls')} 
                        className="p-2 text-gray-400 hover:text-white active:scale-95 transition-all relative min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title="Call History"
                    >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {calls.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-[8px] sm:text-[10px] font-bold text-white">{calls.length}</span>
                            </span>
                        )}
                    </button>
                    <button onClick={() => setShowNewChat(true)} className="p-2 bg-cyan-600 rounded-full text-white shadow-lg active:scale-95 transition-transform min-w-[44px] min-h-[44px] flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 sm:gap-4 px-4 sm:px-6 py-2.5 sm:py-3 overflow-x-auto no-scrollbar border-b border-white/5">
                {['ALL', 'UNREAD', 'GROUPS'].map(f => (
                    <button 
                        key={f} 
                        onClick={() => setFilter(f as any)}
                        className={`text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-colors whitespace-nowrap min-h-[36px] ${filter === f ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10 active:bg-white/15'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="max-w-4xl mx-auto w-full">
                    {filteredChats.map(chat => (
                        <div 
                            key={chat.id} 
                            onClick={() => setSelectedChatId(chat.id)}
                            onContextMenu={(e) => { e.preventDefault(); setShowChatOptions(chat); }}
                            className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer relative group min-h-[72px] sm:min-h-[80px]"
                        >
                            <div className="relative shrink-0">
                                {chat.isAI ? (
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 p-[2px]">
                                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                                            <UniLiveLogo size="xs" />
                                        </div>
                                    </div>
                                ) : (
                                    <img src={chat.avatar} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover bg-gray-800" />
                                )}
                                {chat.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-green-500 border-2 border-[#0B1017] rounded-full"></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5 sm:mb-1">
                                    <h3 className="font-bold text-sm sm:text-base truncate flex items-center gap-1">
                                        {chat.name}
                                        {chat.isPinned && <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500 transform rotate-45 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>}
                                    </h3>
                                    <span className="text-[10px] sm:text-xs text-gray-500 shrink-0 ml-2">{chat.time}</span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                    <p className={`text-xs sm:text-sm truncate flex-1 min-w-0 ${chat.unreadCount > 0 ? 'text-white font-semibold' : 'text-gray-400'}`}>
                                        {chat.isSelf ? <span className="text-gray-500">You: </span> : ''}
                                        {chat.lastMessage}
                                    </p>
                                    {chat.unreadCount > 0 && (
                                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-cyan-600 flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0">{chat.unreadCount}</div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Options Button (Visible on hover/active) */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowChatOptions(chat); }}
                                className="absolute right-2 sm:right-4 opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-white active:scale-95 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Overlays */}
            {showNewChat && <NewChatSheet onClose={() => setShowNewChat(false)} onSelect={(id) => { setShowNewChat(false); setSelectedChatId(id); }} onGroupCreate={handleCreateGroup} />}
            {showChatOptions && <ChatOptionsSheet chat={showChatOptions} onClose={() => setShowChatOptions(null)} onPin={() => handlePinChat(showChatOptions.id)} onDelete={() => handleDeleteChat(showChatOptions.id)} />}
        </div>
    );
};

export default Messages;
