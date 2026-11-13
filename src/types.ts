export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  district: string;
  village: string;
  bio: string;
  avatarUrl: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export type ContentType = 'text' | 'audio' | 'document';

export type VerificationType = 'historical_record' | 'oral_tradition' | 'personal_memory' | 'demonstration';

export interface Story {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  title: string;
  description: string;
  fullText: string;
  contentType: ContentType;
  audioUrl?: string;
  coverImageUrl?: string;
  originalTranscript?: string;
  correctedTranscript?: string;
  district: string;
  village: string;
  category: string;
  sourceCitation: string;
  originalPeriod: string;
  contributorName: string;
  verificationType: VerificationType;
  visibility: 'public' | 'draft';
  isReported?: boolean;
  isHidden?: boolean;
  likesCount: number;
  viewsCount: number;
  copyrightConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
  isBookmarked?: boolean;
  isLiked?: boolean;
}

export interface Comment {
  id: string;
  storyId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export interface Report {
  id: string;
  storyId: string;
  storyTitle: string;
  reportedByUserId?: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: string;
}

export interface DistrictStat {
  district: string;
  count: number;
  villages: string[];
}
