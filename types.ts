
export enum AppScreen {
  SPLASH = 'SPLASH',
  ONBOARDING = 'ONBOARDING',
  AUTH = 'AUTH',
  MAIN = 'MAIN',
}

export enum MainTab {
  HOME = 'HOME',
  EXPLORE = 'EXPLORE',
  CREATE = 'CREATE',
  MESSAGES = 'MESSAGES',
  PROFILE = 'PROFILE',
}

export type NotificationType = 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MENTION' | 'SYSTEM';

export interface MiniPlayerState {
    isActive: boolean;
    url: string;
    currentTime: number;
    sourceTab: MainTab;
    postId?: string; // To scroll back to post
    isMinimized: boolean;
}

export interface Notification {
  id: string;
  type: NotificationType;
  user?: {
    id: string;
    username: string;
    avatar: string;
  };
  text: string;
  postId?: string;
  timestamp: string;
  isRead: boolean;
  mediaPreview?: string;
}

export interface UserLink {
  id: string;
  title: string;
  url: string;
}

export interface User {
  id: string;
  username: string;
  avatar: string;
  bio: string;
  category: string;
  links: UserLink[];
  coins: number;
  following: number;
  followers: number;
  likes: number;
}

export interface MediaItem {
  type: 'video' | 'image';
  url: string;
}

export interface Post {
  id: string;
  username: string;
  userAvatar: string;
  description: string;
  media: MediaItem[];
  likes: number;
  comments: number;
  shares: number;
  isSponsored?: boolean;
  isLiked?: boolean;
  isFollowing?: boolean; 
  isPrivate?: boolean; 
  userId?: string;
}

export interface Story {
  id: string;
  username: string;
  avatar: string;
  isLive: boolean;
  hasUnseen: boolean;
}

export interface Reaction {
  emoji: string;
  count: number;
}

export interface Comment {
  id: string;
  username: string;
  avatar: string;
  text?: string;
  audioUrl?: string; 
  audioDuration?: number;
  mediaUrl?: string; 
  mediaType?: 'image' | 'video' | 'audio';
  attachments?: { type: 'image' | 'video' | 'audio'; url: string }[];
  timestamp: string;
  likes: number;
  reactions?: Reaction[]; 
  userReaction?: string; 
  replies: Comment[];
}

export interface GroundingLink {
  title: string;
  url: string;
}

export interface PollData {
  question: string;
  options: { text: string; votes: number }[];
  totalVotes: number;
}

export interface ContactData {
  name: string;
  phone: string;
  avatar?: string;
}

export interface ChatAttachment {
  id: string;
  url: string;
  type: 'image' | 'video' | 'file' | 'audio';
  fileName?: string;
  fileSize?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text?: string;
  timestamp: number;
  isSelf: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'file' | 'audio' | 'poll' | 'contact' | 'location' | 'sticker';
  fileName?: string;
  attachments?: ChatAttachment[];
  audioData?: { title: string; artist: string; cover?: string };
  pollData?: PollData;
  contactData?: ContactData;
  groundingLinks?: GroundingLink[];
  locationData?: { lat: number; lng: number; address?: string };
  reactions?: Reaction[];
  replyTo?: ChatMessage;
}
