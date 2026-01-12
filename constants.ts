
import { Post, Story, Comment, User, Notification } from './types';

// Tencent RTC Config
export const TRTC_CONFIG = {
  SDKAppID: 20031993,
  SDKSecretKey: 'cba7f2d85592bf1fcea95d0efe448d96d7c0d406cd8b7aac60631b3f998479d8',
  AppKey: 'Gj8y5ftXDPpRq2xWvp4m1j02RQNUxhsA43YVcBjc82qgGfmUauoDGGicDC03hdo8',
  BeautyWebLicense: {
    Domain: 'unilive-app.com',
    AppID: '1393790931',
    LicenseKey: 'ad86c896588b519415ac5a8429c34b76',
    LicenseToken: 'a4e6a06ed08c61fd4181bb30b5a62d58'
  },
  BeautyMobileLicense: {
    PackageName: 'unilive.ar.com',
    BundleID: 'unilive.ar.com',
    AppID: '1393790931',
    LicenseUrl: 'https://1393790931.sdk-license.com/license/v2/1393790931_1/v_cube.license',
    LicenseKey: '1a583434b40209c9c15044032ec0f9ab'
  }
};

export const MOCK_STORIES: Story[] = [
  { id: 's1', username: 'You', avatar: 'https://picsum.photos/id/64/100', isLive: false, hasUnseen: false },
  { id: 's2', username: 'jessica_live', avatar: 'https://picsum.photos/id/65/100', isLive: true, hasUnseen: true },
  { id: 's3', username: 'travel_pro', avatar: 'https://picsum.photos/id/66/100', isLive: false, hasUnseen: true },
  { id: 's4', username: 'gamer_x', avatar: 'https://picsum.photos/id/67/100', isLive: true, hasUnseen: true },
  { id: 's5', username: 'foodie', avatar: 'https://picsum.photos/id/68/100', isLive: false, hasUnseen: true },
];

export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    username: 'unilive_official',
    userAvatar: 'https://picsum.photos/id/10/100',
    description: 'Welcome to UniLive! The future of social streaming. 🚀 #unilive #future',
    media: [
        { type: 'video', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' }
    ],
    likes: 1200,
    comments: 45,
    shares: 12,
    isLiked: false
  },
  {
    id: '2',
    username: 'travel_guide',
    userAvatar: 'https://picsum.photos/id/20/100',
    description: 'Swipe to see the amazing sunset in Bali! 🌅 1. View 2. Beach #travel #bali',
    media: [
        { type: 'image', url: 'https://picsum.photos/id/28/400/800' },
        { type: 'image', url: 'https://picsum.photos/id/29/400/800' }
    ],
    likes: 850,
    comments: 20,
    shares: 5,
    isLiked: false
  },
  {
    id: '3',
    username: 'tech_guru',
    userAvatar: 'https://picsum.photos/id/30/100',
    description: 'Checking out the new features. AI is everywhere! 🤖',
    media: [
         { type: 'video', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' }
    ],
    likes: 3000,
    comments: 150,
    shares: 300,
    isLiked: true
  }
];

export const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1',
    username: 'alice_wonder',
    avatar: 'https://picsum.photos/id/40/100',
    text: 'This is absolutely amazing! 😍',
    timestamp: '2m',
    likes: 12,
    reactions: [
        { emoji: '❤️', count: 12 },
        { emoji: '🔥', count: 3 }
    ],
    userReaction: '❤️',
    replies: []
  }
];

export const MOCK_USER: User = {
  id: 'u123',
  username: 'demo_user',
  avatar: 'https://picsum.photos/id/50/100',
  bio: 'Creator | Living the Unilive dream 🚀',
  category: 'Education',
  links: [
    { id: 'l1', title: 'Instagram', url: 'instagram.com/demo' }
  ],
  coins: 1540,
  following: 125,
  followers: 8900,
  likes: 45000
};

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'FOLLOW',
    user: { id: 'u1', username: 'j_pearson', avatar: 'https://picsum.photos/seed/u1/100' },
    text: 'started following you.',
    timestamp: '2m ago',
    isRead: false
  },
  {
    id: 'n2',
    type: 'LIKE',
    user: { id: 'u2', username: 'sarah_j', avatar: 'https://picsum.photos/seed/u2/100' },
    text: 'liked your video.',
    postId: '1',
    mediaPreview: 'https://picsum.photos/seed/p1/50',
    timestamp: '15m ago',
    isRead: false
  },
  {
    id: 'n3',
    type: 'COMMENT',
    user: { id: 'u3', username: 'mike_r', avatar: 'https://picsum.photos/seed/u3/100' },
    text: 'commented: "This is pure fire! 🔥"',
    postId: '3',
    mediaPreview: 'https://picsum.photos/seed/p3/50',
    timestamp: '1h ago',
    isRead: true
  },
  {
    id: 'n4',
    type: 'MENTION',
    user: { id: 'u4', username: 'h_specter', avatar: 'https://picsum.photos/seed/u4/100' },
    text: 'mentioned you in a comment.',
    postId: '2',
    mediaPreview: 'https://picsum.photos/seed/p2/50',
    timestamp: '3h ago',
    isRead: true
  },
  {
    id: 'n5',
    type: 'SYSTEM',
    text: 'Your video "Sunset Dreams" has reached 10k views! 🎊',
    timestamp: 'Yesterday',
    isRead: true
  }
];

export const LANGUAGES = [
    { code: 'global', label: 'Global', full: 'Global', flag: '🌐' },
    { code: 'en', label: 'EN', full: 'English', flag: '🇺🇸' },
    { code: 'zh', label: 'ZH', full: 'Chinese', flag: '🇨🇳' },
    { code: 'es', label: 'ES', full: 'Spanish', flag: '🇪🇸' },
    { code: 'hi', label: 'HI', full: 'Hindi', flag: '🇮🇳' },
    { code: 'ar', label: 'AR', full: 'Arabic', flag: '🇸🇦' },
    { code: 'pt', label: 'PT', full: 'Portuguese', flag: '🇧🇷' },
    { code: 'bn', label: 'BN', full: 'Bengali', flag: '🇧🇩' },
    { code: 'ru', label: 'RU', full: 'Russian', flag: '🇷🇺' },
    { code: 'ja', label: 'JA', full: 'Japanese', flag: '🇯🇵' },
    { code: 'pa', label: 'PA', full: 'Punjabi', flag: '🇵🇰' },
    { code: 'mr', label: 'MR', full: 'Marathi', flag: '🇮🇳' },
    { code: 'te', label: 'TE', full: 'Telugu', flag: '🇮🇳' },
    { code: 'tr', label: 'TR', full: 'Turkish', flag: '🇹🇷' },
    { code: 'ko', label: 'KO', full: 'Korean', flag: '🇰🇷' },
    { code: 'fr', label: 'FR', full: 'French', flag: '🇫🇷' },
    { code: 'de', label: 'DE', full: 'German', flag: '🇩🇪' },
    { code: 'vi', label: 'VI', full: 'Vietnamese', flag: '🇻🇳' },
    { code: 'ta', label: 'TA', full: 'Tamil', flag: '🇮🇳' },
    { code: 'it', label: 'IT', full: 'Italian', flag: '🇮🇹' },
    { code: 'th', label: 'TH', full: 'Thai', flag: '🇹🇭' },
    { code: 'gu', label: 'GU', full: 'Gujarati', flag: '🇮🇳' },
    { code: 'kn', label: 'KN', full: 'Kannada', flag: '🇮🇳' },
    { code: 'ml', label: 'ML', full: 'Malayalam', flag: '🇮🇳' },
    { code: 'my', label: 'MY', full: 'Burmese', flag: '🇲🇲' },
    { code: 'km', label: 'KM', full: 'Khmer', flag: '🇰🇭' },
    { code: 'lo', label: 'LO', full: 'Lao', flag: '🇱🇦' },
    { code: 'ms', label: 'MS', full: 'Malay', flag: '🇲🇾' },
    { code: 'id', label: 'ID', full: 'Indonesian', flag: '🇮🇩' },
    { code: 'fil', label: 'FIL', full: 'Filipino', flag: '🇵🇭' },
    { code: 'pl', label: 'PL', full: 'Polish', flag: '🇵🇱' },
    { code: 'uk', label: 'UK', full: 'Ukrainian', flag: '🇺🇦' },
    { code: 'fa', label: 'FA', full: 'Persian', flag: '🇮🇷' },
    { code: 'ur', label: 'UR', full: 'Urdu', flag: '🇵🇰' },
    { code: 'ro', label: 'RO', full: 'Romanian', flag: '🇷🇴' },
    { code: 'nl', label: 'NL', full: 'Dutch', flag: '🇳🇱' },
    { code: 'hu', label: 'HU', full: 'Hungarian', flag: '🇭🇺' },
    { code: 'el', label: 'EL', full: 'Greek', flag: '🇬🇷' },
    { code: 'cs', label: 'CS', full: 'Czech', flag: '🇨🇿' },
    { code: 'sv', label: 'SV', full: 'Swedish', flag: '🇸🇪' },
    { code: 'he', label: 'HE', full: 'Hebrew', flag: '🇮🇱' },
    { code: 'no', label: 'NO', full: 'Norwegian', flag: '🇳🇴' },
    { code: 'da', label: 'DA', full: 'Danish', flag: '🇩🇰' },
    { code: 'fi', label: 'FI', full: 'Finnish', flag: '🇫🇮' },
    { code: 'sk', label: 'SK', full: 'Slovak', flag: '🇸🇰' },
    { code: 'hr', label: 'HR', full: 'Croatian', flag: '🇭🇷' },
    { code: 'bg', label: 'BG', full: 'Bulgarian', flag: '🇧🇬' },
    { code: 'lt', label: 'LT', full: 'Lithuanian', flag: '🇱🇹' },
    { code: 'lv', label: 'LV', full: 'Latvian', flag: '🇱🇻' },
    { code: 'et', label: 'ET', full: 'Estonian', flag: '🇪🇪' },
    { code: 'sl', label: 'SL', full: 'Slovenian', flag: '🇸🇮' },
    { code: 'sq', label: 'SQ', full: 'Albanian', flag: '🇦🇱' },
    { code: 'hy', label: 'HY', full: 'Armenian', flag: '🇦🇲' },
    { code: 'ka', label: 'KA', full: 'Georgian', flag: '🇬🇪' },
    { code: 'az', label: 'AZ', full: 'Azerbaijani', flag: '🇦🇿' },
    { code: 'kk', label: 'KK', full: 'Kazakh', flag: '🇰🇿' },
    { code: 'uz', label: 'UZ', full: 'Uzbek', flag: '🇺🇿' },
    { code: 'mn', label: 'MN', full: 'Mongolian', flag: '🇲🇳' },
    { code: 'am', label: 'AM', full: 'Amharic', flag: '🇪🇹' },
    { code: 'sw', label: 'SW', full: 'Swahili', flag: '🇰🇪' },
    { code: 'yo', label: 'YO', full: 'Yoruba', flag: '🇳🇬' },
    { code: 'ig', label: 'IG', full: 'Igbo', flag: '🇳🇬' },
    { code: 'zu', label: 'ZU', full: 'Zulu', flag: '🇿🇦' },
    { code: 'xh', label: 'XH', full: 'Xhosa', flag: '🇿🇦' },
    { code: 'af', label: 'AF', full: 'Afrikaans', flag: '🇿🇦' },
    { code: 'mg', label: 'MG', full: 'Malagasy', flag: '🇲🇬' },
    { code: 'si', label: 'SI', full: 'Sinhala', flag: '🇱🇰' },
    { code: 'ne', label: 'NE', full: 'Nepali', flag: '🇳🇵' },
    { code: 'dz', label: 'DZ', full: 'Dzongkha', flag: '🇧🇹' },
    { code: 'as', label: 'AS', full: 'Assamese', flag: '🇮🇳' },
    { code: 'or', label: 'OR', full: 'Odia', flag: '🇮🇳' },
    { code: 'ps', label: 'PS', full: 'Pashto', flag: '🇦🇫' },
    { code: 'ku', label: 'KU', full: 'Kurdish', flag: '🇮🇶' },
    { code: 'kmr', label: 'KMR', full: 'Kurmanji', flag: '🇹🇷' },
    { code: 'sd', label: 'SD', full: 'Sindhi', flag: '🇵🇰' },
    { code: 'so', label: 'SO', full: 'Somali', flag: '🇸🇴' },
    { code: 'ha', label: 'HA', full: 'Hausa', flag: '🇳🇬' },
    { code: 'ln', label: 'LN', full: 'Lingala', flag: '🇨🇩' },
    { code: 'wo', label: 'WO', full: 'Wolof', flag: '🇸🇳' },
    { code: 'ff', label: 'FF', full: 'Fula', flag: '🇬🇳' },
    { code: 'ti', label: 'TI', full: 'Tigrinya', flag: '🇪🇷' },
    { code: 'rw', label: 'RW', full: 'Kinyarwanda', flag: '🇷🇼' },
    { code: 'rn', label: 'RN', full: 'Kirundi', flag: '🇧🇮' },
    { code: 'lg', label: 'LG', full: 'Ganda', flag: '🇺🇬' },
    { code: 'ny', label: 'NY', full: 'Nyanja', flag: '🇲🇼' },
    { code: 'sn', label: 'SN', full: 'Shona', flag: '🇿🇼' },
    { code: 'st', label: 'ST', full: 'Sotho', flag: '🇱🇸' },
    { code: 'tn', label: 'TN', full: 'Tswana', flag: '🇧🇼' },
    { code: 'ts', label: 'TS', full: 'Tsonga', flag: '🇿🇦' },
    { code: 've', label: 'VE', full: 'Venda', flag: '🇿🇦' },
    { code: 'ss', label: 'SS', full: 'Swati', flag: '🇸🇿' },
    { code: 'nr', label: 'NR', full: 'Ndebele', flag: '🇿🇦' },
    { code: 'is', label: 'IS', full: 'Icelandic', flag: '🇮🇸' },
    { code: 'mt', label: 'MT', full: 'Maltese', flag: '🇲🇹' },
    { code: 'gl', label: 'GL', full: 'Galician', flag: '🇪🇸' },
    { code: 'eu', label: 'EU', full: 'Basque', flag: '🇪🇸' },
    { code: 'ca', label: 'CA', full: 'Catalan', flag: '🇪🇸' },
    { code: 'cy', label: 'CY', full: 'Welsh', flag: '🇬🇧' },
    { code: 'ga', label: 'GA', full: 'Irish', flag: '🇮🇪' },
    { code: 'gd', label: 'GD', full: 'Scots Gaelic', flag: '🇬🇧' },
    { code: 'br', label: 'BR', full: 'Breton', flag: '🇫🇷' },
];
