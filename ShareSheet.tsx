
import React, { useState, useRef } from 'react';
import { Post } from '../types';

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
}

const ShareSheet: React.FC<ShareSheetProps> = ({ isOpen, onClose, post }) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const qrCardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !post) return null;

  const shareUrl = `https://unilive.app/post/${post.id}`;
  const shareText = `Check out this post by @${post.username} on Unilive: ${post.description}`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);

  const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 2000);
  };

  const handleExternalShare = (platform: string) => {
      let url = '';
      
      switch (platform) {
          case 'WhatsApp':
              url = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
              break;
          case 'Twitter':
              url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
              break;
          case 'Facebook':
              url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
              break;
          case 'Email':
              url = `mailto:?subject=Check out this post&body=${encodedText}%20${encodedUrl}`;
              break;
          case 'SMS':
              url = `sms:?body=${encodedText}%20${encodedUrl}`;
              break;
          case 'System':
              if (navigator.share) {
                  navigator.share({
                      title: 'Unilive Post',
                      text: shareText,
                      url: shareUrl
                  }).catch(console.error);
                  return;
              }
              break;
      }

      if (url) {
          window.open(url, '_blank');
          onClose();
      }
  };

  const handleDownloadMedia = async () => {
    if (!post.media || post.media.length === 0) return;
    
    const media = post.media[0];
    const isVideo = media.type === 'video';
    
    showToast(`Downloading ${isVideo ? 'Video' : 'Image'}... ⬇️`);
    
    try {
        const response = await fetch(media.url);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = `unilive_${post.username}_${post.id}.${isVideo ? 'mp4' : 'jpg'}`;
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
        
        showToast('Saved to device! ✅');
        setTimeout(onClose, 1000);
    } catch (e) {
        // Fallback for CORS restricted resources
        window.open(media.url, '_blank');
        showToast('Opened in new tab ↗️');
    }
  };

  const handleSaveQR = () => {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodedUrl}&color=000000&bgcolor=ffffff`;
      
      showToast('Saving QR Code... 💾');
      
      fetch(qrUrl)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.blob();
        })
        .then(blob => {
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `unilive_qr_${post.id}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
            showToast('QR Code Saved! ✅');
        })
        .catch(() => {
             window.open(qrUrl, '_blank');
             showToast('Opened QR in new tab');
        });
  };

  const handleAction = (action: string) => {
      switch (action) {
          case 'Copy Link':
              navigator.clipboard.writeText(shareUrl).then(() => {
                  showToast('Link copied to clipboard! 🔗');
              });
              break;
          case 'Save Video':
          case 'Save Image':
              handleDownloadMedia();
              break;
          case 'QR Code':
              setShowQR(true);
              break;
          case 'Repost':
              showToast('Reposted to your feed! 🔄');
              setTimeout(onClose, 1000);
              break;
          case 'Report':
              showToast('Report submitted. 🛡️');
              setTimeout(onClose, 1500);
              break;
          case 'Not Interested':
              showToast('Hidden. 💔');
              setTimeout(onClose, 1500);
              break;
          default:
              showToast(`${action} action triggered`);
      }
  };

  const handleSendToFriend = (name: string) => {
      showToast(`Sent to ${name} ✅`);
      setTimeout(onClose, 1000);
  };

  const friends = [
    { name: 'Jessica', avatar: 'https://picsum.photos/seed/s2/100' },
    { name: 'David', avatar: 'https://picsum.photos/seed/s3/100' },
    { name: 'Sarah', avatar: 'https://picsum.photos/seed/s4/100' },
    { name: 'Mike', avatar: 'https://picsum.photos/seed/s5/100' },
    { name: 'Emily', avatar: 'https://picsum.photos/seed/s6/100' },
    { name: 'Alex', avatar: 'https://picsum.photos/seed/s7/100' },
  ];

  const apps = [
    { name: 'WhatsApp', color: 'bg-green-500', icon: '💬' },
    { name: 'Twitter', color: 'bg-blue-400', icon: '🐦' },
    { name: 'Facebook', color: 'bg-blue-600', icon: 'f' },
    { name: 'Email', color: 'bg-gray-500', icon: '📧' },
    { name: 'SMS', color: 'bg-green-400', icon: '✉️' },
    { name: 'System', color: 'bg-gray-700', icon: '⋯' },
  ];

  const actions = [
    { name: 'Repost', icon: '🔄' },
    { name: 'QR Code', icon: '📱' },
    { name: 'Copy Link', icon: '🔗' },
    { name: post.media[0].type === 'video' ? 'Save Video' : 'Save Image', icon: '⬇️' },
    { name: 'Report', icon: '⚠️' },
    { name: 'Not Interested', icon: '💔' },
    { name: 'Duet', icon: '👥' },
    { name: 'Stitch', icon: '🪡' },
  ];

  // -------------------------
  // QR CODE VIEW
  // -------------------------
  if (showQR) {
      return (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowQR(false)}>
              <div 
                className="bg-gradient-to-br from-purple-600 to-cyan-500 p-1 rounded-2xl w-3/4 max-w-sm animate-slide-up" 
                onClick={e => e.stopPropagation()}
              >
                  <div className="bg-white rounded-xl p-6 flex flex-col items-center relative overflow-hidden" ref={qrCardRef}>
                      {/* Decoration */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-100 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 w-20 h-20 bg-purple-100 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

                      <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg -mt-10 mb-3 overflow-hidden z-10">
                          <img src={post.userAvatar} className="w-full h-full object-cover" />
                      </div>
                      <h3 className="text-black font-bold text-lg mb-0.5 z-10">@{post.username}</h3>
                      <p className="text-gray-400 text-[10px] mb-4 uppercase tracking-widest z-10">Scan to view post</p>
                      
                      {/* Generated QR Code */}
                      <div className="p-2 bg-white rounded-xl border border-gray-100 shadow-inner z-10">
                         <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}&color=000000&bgcolor=ffffff`} 
                            className="w-48 h-48"
                            alt="Post QR Code"
                        />
                      </div>
                      
                      <div className="mt-4 flex items-center gap-2 z-10">
                           <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                           <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600">UNILIVE</span>
                      </div>
                      
                      <div className="flex gap-2 w-full mt-6 z-10">
                           <button onClick={() => setShowQR(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-800 font-bold text-xs hover:bg-gray-200 transition-colors">Close</button>
                           <button onClick={handleSaveQR} className="flex-1 py-3 rounded-xl bg-black text-white font-bold text-xs hover:bg-gray-800 transition-colors flex items-center justify-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Save
                           </button>
                      </div>
                  </div>
              </div>
              
              {/* Toast for QR View */}
              {toastMessage && (
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white text-black px-6 py-3 rounded-full shadow-xl font-bold text-sm z-[260] animate-fade-in">
                    {toastMessage}
                </div>
              )}
          </div>
      );
  }

  // -------------------------
  // MAIN SHARE SHEET
  // -------------------------
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center pointer-events-none">
      {/* Toast Notification */}
      {toastMessage && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-3 rounded-full backdrop-blur-md z-[260] animate-fade-in text-sm font-bold shadow-xl border border-white/10 text-center whitespace-nowrap">
              {toastMessage}
          </div>
      )}

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={onClose}></div>

      {/* Sheet */}
      <div className="bg-[#121212] w-full rounded-t-3xl flex flex-col pointer-events-auto overflow-hidden animate-slide-up relative pb-8 max-h-[85vh]">
        {/* Handle */}
        <div className="w-full flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-gray-600 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-4 pb-4 border-b border-gray-800 relative">
            <h3 className="text-sm font-bold text-center text-white">Share to</h3>
            <button onClick={onClose} className="absolute top-0 right-4 p-1 text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto no-scrollbar">
            
            {/* Quick Share (Friends) */}
            <div>
                <p className="text-xs text-gray-500 mb-3 font-semibold px-1">Send to friends</p>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
                    <div className="flex flex-col items-center gap-2">
                         <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-cyan-400 border border-gray-700">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                             </svg>
                         </div>
                         <span className="text-xs text-gray-400">Search</span>
                    </div>
                    {friends.map((friend, i) => (
                        <button 
                            key={i} 
                            onClick={() => handleSendToFriend(friend.name)}
                            className="flex flex-col items-center min-w-[64px] gap-2 group"
                        >
                            <div className="relative">
                                <img src={friend.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-gray-800 group-hover:border-cyan-500 transition-colors" />
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#121212]"></div>
                            </div>
                            <span className="text-xs text-gray-400 text-center truncate w-full group-hover:text-white">{friend.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Apps */}
            <div>
                <p className="text-xs text-gray-500 mb-3 font-semibold px-1">Share to apps</p>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
                    {apps.map((app, i) => (
                        <button 
                            key={i} 
                            onClick={() => handleExternalShare(app.name)}
                            className="flex flex-col items-center min-w-[64px] gap-2 group"
                        >
                            <div className={`w-12 h-12 rounded-full ${app.color} flex items-center justify-center text-white text-xl font-bold shadow-lg transform group-active:scale-95 transition-transform`}>
                                {app.icon}
                            </div>
                            <span className="text-xs text-gray-400 text-center truncate w-full group-hover:text-white">{app.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Actions Grid */}
             <div>
                <p className="text-xs text-gray-500 mb-3 font-semibold px-1">More actions</p>
                <div className="grid grid-cols-4 gap-4 px-1">
                    {actions.map((action, i) => (
                        <button 
                            key={i} 
                            onClick={() => handleAction(action.name)}
                            className="flex flex-col items-center gap-2 group active:opacity-70 transition-opacity"
                        >
                             <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-xl group-hover:bg-gray-700 transition-colors border border-gray-700">
                                 {action.icon}
                             </div>
                             <span className="text-[10px] text-gray-400 text-center group-hover:text-white leading-tight">{action.name}</span>
                        </button>
                    ))}
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default ShareSheet;
