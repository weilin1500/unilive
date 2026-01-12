
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onViewProfile?: (userId: string) => void;
  currentUser: User;
}

const QRScanner: React.FC<QRScannerProps> = ({ isOpen, onClose, onViewProfile, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'SCAN' | 'MY_CODE'>('SCAN');
  const [hasPermission, setHasPermission] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const myProfileUrl = `https://unilive.app/u/${currentUser.id}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(myProfileUrl)}&color=000000&bgcolor=ffffff`;

  const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 2000);
  };

  // --- Camera Logic ---
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      if (isOpen && activeTab === 'SCAN') {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setHasPermission(true);
            setIsScanning(true);
            simulateScanning();
          }
        } catch (err) {
          console.error("Camera access denied", err);
          setHasPermission(false);
        }
      }
    };

    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [isOpen, activeTab]);

  // --- Simulation of Scanning Logic ---
  const simulateScanning = () => {
    setTimeout(() => {
        if (!isOpen || activeTab !== 'SCAN') return;
        handleScanSuccess("user_scanned_123");
    }, 4000);
  };

  const handleScanSuccess = (result: string) => {
    setIsScanning(false);
    setScannedResult(result);
    // Play beep sound
    const audio = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
    audio.play().catch(() => {});
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setIsScanning(false); 
        setTimeout(() => {
            handleScanSuccess(`user_gallery_scan`);
        }, 1500);
    }
  };

  const handleViewScannedProfile = () => {
      if (scannedResult && onViewProfile) {
          onViewProfile(scannedResult);
          onClose();
      } else if (scannedResult) {
          window.open(`https://unilive.app/u/${scannedResult}`, '_blank');
          onClose();
      }
  };

  // --- My Code Actions ---
  const handleShare = async () => {
      if (navigator.share) {
          try {
              await navigator.share({
                  title: `Follow ${currentUser.username} on Unilive`,
                  text: `Scan this QR code to follow @${currentUser.username}!`,
                  url: myProfileUrl
              });
              showToast('Shared successfully!');
          } catch (error) {
              console.log('Share canceled', error);
          }
      } else {
          navigator.clipboard.writeText(myProfileUrl).then(() => {
              showToast('Profile link copied! 🔗');
          });
      }
  };

  const handleSave = async () => {
      showToast('Downloading QR Code... ⬇️');
      try {
          const response = await fetch(qrImageUrl);
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = blobUrl;
          a.download = `unilive_qr_${currentUser.username}.png`;
          document.body.appendChild(a);
          a.click();
          
          window.URL.revokeObjectURL(blobUrl);
          document.body.removeChild(a);
          showToast('Saved to Gallery! ✅');
      } catch (e) {
          console.error('Save failed', e);
          showToast('Failed to save. Try screenshot.');
      }
  };

  // --- Render ---
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in">
      
      {/* Toast */}
      {toastMessage && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white text-black px-6 py-3 rounded-full shadow-xl font-bold text-sm z-[110] animate-fade-in whitespace-nowrap">
              {toastMessage}
          </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center p-4 z-20 bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full">
        <button onClick={onClose} className="p-2 bg-black/40 rounded-full text-white backdrop-blur-md">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        <div className="flex bg-black/40 backdrop-blur-md rounded-full p-1">
            <button 
                onClick={() => { setActiveTab('SCAN'); setScannedResult(null); }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'SCAN' ? 'bg-cyan-500 text-white shadow-lg' : 'text-gray-400'}`}
            >
                Scan
            </button>
            <button 
                onClick={() => setActiveTab('MY_CODE')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'MY_CODE' ? 'bg-cyan-500 text-white shadow-lg' : 'text-gray-400'}`}
            >
                My Code
            </button>
        </div>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* Main Content */}
      <div className="flex-1 relative flex items-center justify-center bg-gray-900">
          
          {activeTab === 'SCAN' ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
                  {/* Camera View */}
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="absolute inset-0 w-full h-full object-cover opacity-60" 
                  />
                  
                  {/* Scanner Overlay */}
                  <div className="relative z-10 w-64 h-64 border-2 border-cyan-400 rounded-3xl shadow-[0_0_0_999px_rgba(0,0,0,0.7)] flex items-center justify-center">
                      {/* Corner Markers */}
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-cyan-500 -mt-1 -ml-1 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-cyan-500 -mt-1 -mr-1 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-cyan-500 -mb-1 -ml-1 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-cyan-500 -mb-1 -mr-1 rounded-br-lg"></div>
                      
                      {/* Scanning Line Animation */}
                      {isScanning && !scannedResult && (
                          <div className="absolute w-full h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-[scan_2s_linear_infinite]"></div>
                      )}

                      {/* Result Popup */}
                      {scannedResult && (
                          <div className="absolute bg-white text-black p-4 rounded-xl shadow-2xl flex flex-col items-center animate-slide-up mx-4 text-center">
                              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <h3 className="font-bold text-lg mb-1">Unilive User Found</h3>
                              <p className="text-xs text-gray-500 mb-4 break-all">ID: {scannedResult}</p>
                              <button 
                                onClick={handleViewScannedProfile}
                                className="w-full bg-black text-white py-2 rounded-lg font-bold text-sm"
                              >
                                  View Profile
                              </button>
                          </div>
                      )}
                  </div>
                  
                  {!scannedResult && <p className="relative z-10 mt-8 text-white/80 text-sm font-medium">Align QR code within the frame</p>}

                  {/* Bottom Controls */}
                  <div className="absolute bottom-10 z-20 flex items-center gap-8">
                      <button className="flex flex-col items-center gap-2 group">
                          <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <span className="text-xs text-white">Flash</span>
                      </button>

                      <div className="relative">
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleFileUpload}
                          />
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center gap-2 group"
                        >
                              <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <span className="text-xs text-white">Gallery</span>
                          </button>
                      </div>
                  </div>
              </div>
          ) : (
              <div className="flex flex-col items-center p-8 animate-fade-in w-full max-w-sm">
                   <div className="bg-white rounded-3xl p-8 w-full shadow-2xl flex flex-col items-center relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 to-purple-600"></div>
                       
                       <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden -mt-2 mb-4">
                           <img src={currentUser.avatar} className="w-full h-full object-cover" />
                       </div>
                       
                       <h2 className="text-2xl font-bold text-black mb-1">@{currentUser.username}</h2>
                       <p className="text-gray-400 text-xs mb-6">Scan to follow me</p>
                       
                       <img 
                          src={qrImageUrl} 
                          className="w-48 h-48 mb-6"
                       />
                       
                       <p className="text-xs text-gray-300 text-center">Share this code with others to let them find you easily.</p>
                   </div>
                   
                   <div className="flex gap-4 mt-8">
                       <button 
                            onClick={handleShare}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-800 rounded-full text-white font-semibold active:scale-95 transition-transform"
                       >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Share
                       </button>
                       <button 
                            onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-800 rounded-full text-white font-semibold active:scale-95 transition-transform"
                       >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Save Image
                       </button>
                   </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default QRScanner;
