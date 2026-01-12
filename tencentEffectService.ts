
import { TRTC_CONFIG } from '../constants';

// --- Types ---
export type EffectType = 'beauty' | 'reshape' | 'filter' | 'makeup' | 'sticker' | 'background' | 'gesture';

export interface EffectItem {
    id: string;
    name: string;
    icon: string; // key in TE_ICONS
    type: EffectType;
    value?: number; // current value
    defaultValue?: number;
    min?: number;
    max?: number;
    filterStyle?: string; // for css simulation
    emoji?: string; // for sticker simulation
    color?: string; // for makeup/bg simulation
}

export interface EffectCategory {
    id: EffectType;
    name: string;
    icon: string;
}

// --- ICON ASSETS (Vector replicas of official assets) ---
export const TE_ICONS: Record<string, string> = {
    // UI Icons
    compare: `<path d="M12 4V2C6.48 2 2 6.48 2 12s4.48 10 10 10v-2c-4.41 0-8-3.59-8-8s3.59-8 8-8zm0 16c4.41 0 8-3.59 8-8s-3.59-8-8-8v16z" fill="currentColor"/>`,
    reset: `<path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>`,
    
    // Categories
    cat_beauty: `<path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3-3-7z" fill="none" stroke="currentColor" stroke-width="2"/>`,
    cat_reshape: `<rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M8 4v16M16 4v16" stroke="currentColor" stroke-width="1"/>`,
    cat_filter: `<circle cx="8" cy="12" r="6" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="16" cy="12" r="6" stroke="currentColor" stroke-width="2" fill="none"/>`,
    cat_makeup: `<path d="M9 11.5l3 3 7-7M4 11.5v6a2 2 0 002 2h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    cat_sticker: `<path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" stroke-width="2" fill="none"/>`,
    
    // Items
    none: `<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2" fill="none"/><path d="M6 6l12 12" stroke="currentColor" stroke-width="2"/>`,
    smooth: `<path d="M12 22c4.97 0 9-4.03 9-9 0-4.97-9-13-9-13S3 8.03 3 13c0 4.97 4.03 9 9 9z" fill="none" stroke="currentColor" stroke-width="1.5"/>`,
    whiten: `<circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2m-3-7l1.5-1.5M4.5 19.5L6 18m13.5 0L18 18M4.5 4.5L6 6" stroke="currentColor" stroke-width="1.5"/>`,
    ruddy: `<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke="currentColor" stroke-width="1.5"/>`,
    slimFace: `<path d="M9 3v18M15 3v18M4 12h4M16 12h4" stroke="currentColor" stroke-width="1.5"/>`,
    enlargeEye: `<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="none" stroke="currentColor" stroke-width="1.5"/>`,
    slimNose: `<path d="M10 4l-2 16M14 4l2 16" stroke="currentColor" stroke-width="1.5"/>`,
    chin: `<path d="M4 12c0 4.418 3.582 8 8 8s8-3.582 8-8" stroke="currentColor" stroke-width="1.5" fill="none"/>`,
};

// --- CONFIG DATA ---
export const EFFECT_CATEGORIES: EffectCategory[] = [
    { id: 'beauty', name: 'Beauty', icon: 'cat_beauty' },
    { id: 'reshape', name: 'Reshape', icon: 'cat_reshape' },
    { id: 'filter', name: 'Filter', icon: 'cat_filter' },
    { id: 'makeup', name: 'Makeup', icon: 'cat_makeup' },
    { id: 'sticker', name: 'Sticker', icon: 'cat_sticker' },
    { id: 'background', name: 'Background', icon: 'cat_filter' },
];

export const TE_DATA: Record<EffectType, EffectItem[]> = {
    beauty: [
        { id: 'smooth', name: 'Smooth', icon: 'smooth', type: 'beauty', value: 60, defaultValue: 60, min: 0, max: 100 },
        { id: 'whiten', name: 'Whiten', icon: 'whiten', type: 'beauty', value: 50, defaultValue: 50, min: 0, max: 100 },
        { id: 'ruddy', name: 'Ruddy', icon: 'ruddy', type: 'beauty', value: 30, defaultValue: 30, min: 0, max: 100 },
        { id: 'clear', name: 'Clear', icon: 'whiten', type: 'beauty', value: 20, defaultValue: 20, min: 0, max: 100 },
    ],
    reshape: [
        { id: 'slimFace', name: 'Slim Face', icon: 'slimFace', type: 'reshape', value: 40, defaultValue: 40, min: 0, max: 100 },
        { id: 'enlargeEye', name: 'Enlarge Eye', icon: 'enlargeEye', type: 'reshape', value: 30, defaultValue: 30, min: 0, max: 100 },
        { id: 'slimNose', name: 'Slim Nose', icon: 'slimNose', type: 'reshape', value: 20, defaultValue: 20, min: 0, max: 100 },
        { id: 'chin', name: 'Chin', icon: 'chin', type: 'reshape', value: 10, defaultValue: 10, min: -50, max: 50 },
    ],
    filter: [
        { id: 'origin', name: 'Original', icon: 'none', type: 'filter', filterStyle: '' },
        { id: 'purity', name: 'Purity', icon: 'cat_filter', type: 'filter', filterStyle: 'contrast(1.1) saturate(1.1) brightness(1.1)' },
        { id: 'natural', name: 'Natural', icon: 'cat_filter', type: 'filter', filterStyle: 'sepia(0.1) contrast(0.9)' },
        { id: 'rosy', name: 'Rosy', icon: 'cat_filter', type: 'filter', filterStyle: 'hue-rotate(-10deg) saturate(1.2)' },
        { id: 'vitality', name: 'Vitality', icon: 'cat_filter', type: 'filter', filterStyle: 'saturate(1.4) contrast(1.1)' },
    ],
    makeup: [
        { id: 'none', name: 'None', icon: 'none', type: 'makeup' },
        { id: 'peach', name: 'Peach', icon: 'cat_makeup', type: 'makeup', color: 'rgba(255, 150, 150, 0.2)' },
        { id: 'red', name: 'Red', icon: 'cat_makeup', type: 'makeup', color: 'rgba(200, 0, 0, 0.2)' },
    ],
    sticker: [
        { id: 'none', name: 'None', icon: 'none', type: 'sticker' },
        { id: 'cat', name: 'Cat Ears', icon: 'cat_sticker', type: 'sticker', emoji: '🐱' },
        { id: 'cool', name: 'Cool', icon: 'cat_sticker', type: 'sticker', emoji: '🕶️' },
        { id: 'space', name: 'Space', icon: 'cat_sticker', type: 'sticker', emoji: '👩‍🚀' },
    ],
    background: [
         { id: 'none', name: 'None', icon: 'none', type: 'background' },
         { id: 'blur', name: 'Blur', icon: 'cat_filter', type: 'background', color: 'rgba(50,50,50,0.5)' }
    ],
    gesture: []
};

// Aliases for component usage
export const TE_BEAUTY_TAB = TE_DATA.beauty;
export const TE_RESHAPE_TAB = TE_DATA.reshape;
export const TE_FILTERS = TE_DATA.filter;
export const TE_MAKEUP = TE_DATA.makeup;
export const TE_STICKERS = TE_DATA.sticker;
export const TE_BACKGROUNDS = TE_DATA.background;


// --- SERVICE LOGIC ---
class TencentEffectService {
  private isInitialized = false;

  constructor() {
    this.init();
  }

  async init() {
    if (this.isInitialized) return;
    console.log(`[TE] Initializing...`);
    // Immediate Initialization
    this.isInitialized = true;
    console.log(`[TE] Ready.`);
  }

  getSimulationStyle(filterStyle: string, beautyValues: any) {
     let style = filterStyle || '';
     if (beautyValues.whiten && beautyValues.whiten > 0) style += ` brightness(${1 + beautyValues.whiten * 0.005})`;
     if (beautyValues.ruddy && beautyValues.ruddy > 0) style += ` saturate(${1 + beautyValues.ruddy * 0.005})`;
     return style;
  }
}

export const tencentEffectService = new TencentEffectService();