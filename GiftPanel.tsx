
import React, { useState, useMemo } from 'react';

interface GiftPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSendGift: (gift: any) => void;
    userBalance?: number;
}

const GIFT_CATEGORIES = [
    'Popular', 'Frequently used', 'Activity', 'Super Lucky', 
    'Treasure Box', 'Privilege', 'VIP', 'SVIP', 
    'Super Fan Gifts', 'Item Bag', 'Tools'
];

// Mock Data Generator
const generateGifts = (category: string) => {
    const baseGifts = [
        { name: 'Rose', icon: '🌹', price: 1 },
        { name: 'Heart', icon: '❤️', price: 5 },
        { name: 'Doughnut', icon: '🍩', price: 10 },
        { name: 'Party', icon: '🎉', price: 20 },
        { name: 'Diamond', icon: '💎', price: 50 },
        { name: 'Crown', icon: '👑', price: 99 },
        { name: 'Rocket', icon: '🚀', price: 199 },
        { name: 'Castle', icon: '🏰', price: 500 },
        { name: 'Dragon', icon: '🐉', price: 999 },
        { name: 'Planet', icon: '🪐', price: 1500 },
        { name: 'UniLive', icon: '🦄', price: 5000 },
        { name: 'Luxury Car', icon: '🏎️', price: 2000 },
        { name: 'Yacht', icon: '🛥️', price: 3000 },
        { name: 'Island', icon: '🏝️', price: 8000 },
        { name: 'Magic Wand', icon: '🪄', price: 150 },
        { name: 'Potion', icon: '🧪', price: 75 },
    ];

    // Shuffle/Filter based on category to simulate different lists
    if (category === 'Popular') return baseGifts.slice(0, 8);
    if (category === 'VIP') return baseGifts.filter(g => g.price > 100);
    if (category === 'SVIP') return baseGifts.filter(g => g.price > 1000);
    if (category === 'Tools') return [{name: 'Sticky', icon: '📌', price: 50}, {name: 'Banner', icon: '🚩', price: 100}];
    
    return baseGifts.sort(() => 0.5 - Math.random()).slice(0, 10);
};

const GiftPanel: React.FC<GiftPanelProps> = ({ isOpen, onClose, onSendGift, userBalance = 1540 }) => {
    const [activeTab, setActiveTab] = useState('Popular');
    const [selectedGift, setSelectedGift] = useState<any | null>(null);
    const [combo, setCombo] = useState(1);

    const activeGifts = useMemo(() => generateGifts(activeTab), [activeTab]);

    if (!isOpen) return null;

    const handleSend = () => {
        if (selectedGift) {
            onSendGift({ ...selectedGift, combo });
            // Simple animation trigger logic could go here
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-end justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-[#121212] w-full max-h-[60vh] rounded-t-3xl flex flex-col overflow-hidden animate-slide-up relative z-10 border-t border-white/10 shadow-2xl">
                
                {/* Header / Tabs */}
                <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-800 overflow-x-auto no-scrollbar bg-[#181818]">
                    {GIFT_CATEGORIES.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setActiveTab(cat)}
                            className={`whitespace-nowrap text-[11px] font-black uppercase tracking-wide px-3 py-1.5 rounded-full transition-all ${activeTab === cat ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                    <div className="grid grid-cols-4 gap-4">
                        {activeGifts.map((gift, i) => (
                            <div 
                                key={i}
                                onClick={() => setSelectedGift(gift)}
                                className={`flex flex-col items-center justify-center p-3 rounded-2xl cursor-pointer transition-all border ${selectedGift?.name === gift.name ? 'bg-cyan-900/20 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                            >
                                <div className="text-4xl mb-2 drop-shadow-md transition-transform group-hover:scale-110">{gift.icon}</div>
                                <span className="text-xs font-bold text-white text-center truncate w-full">{gift.name}</span>
                                <div className="flex items-center gap-1 mt-1">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500 flex items-center justify-center text-[8px] text-black font-bold">$</div>
                                    <span className="text-[10px] text-yellow-500 font-mono font-bold">{gift.price}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-[#181818] px-4 py-3 border-t border-gray-800 flex items-center justify-between safe-area-bottom">
                    
                    {/* Balance */}
                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10 cursor-pointer hover:bg-black/60 transition-colors">
                        <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center text-black font-black text-xs">$</div>
                        <span className="text-xs font-bold text-white">{userBalance.toLocaleString()}</span>
                        <svg className="w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4"/></svg>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {/* Combo Selector */}
                        <div className="flex items-center bg-gray-800 rounded-full px-2 border border-gray-700">
                            <span className="text-[10px] text-gray-400 font-bold px-2">x</span>
                            <select 
                                value={combo} 
                                onChange={(e) => setCombo(Number(e.target.value))}
                                className="bg-transparent text-white text-xs font-bold py-2 outline-none appearance-none pr-1 cursor-pointer"
                            >
                                <option value="1">1</option>
                                <option value="10">10</option>
                                <option value="66">66</option>
                                <option value="99">99</option>
                                <option value="188">188</option>
                                <option value="520">520</option>
                                <option value="1314">1314</option>
                            </select>
                            <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                        </div>

                        <button 
                            onClick={handleSend}
                            disabled={!selectedGift}
                            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${selectedGift ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg active:scale-95' : 'bg-gray-800 text-gray-500'}`}
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GiftPanel;
