export type ContentType = 'instagram_post' | 'instagram_story' | 'tiktok_caption';
export type ContentTone = 'divertido' | 'emotivo' | 'informativo' | 'cumpleanos';
export type SocialNetwork = 'instagram' | 'tiktok';
export type Language = 'es' | 'en';

export interface ContentHubRequest {
  petId: string;
  contentType: ContentType;
  tone: ContentTone;
  language: Language;
  celebrationReason?: string;
}

export interface ContentHubResponse {
  caption: string;
  hashtags: string[];
  modelUsed: string;
  charCount: number;
  maxChars: number;
}

export interface ContentGeneration {
  id: string;
  userId: string;
  petId: string | null;
  contentType: ContentType;
  tone: ContentTone;
  socialNetwork: SocialNetwork;
  caption: string;
  hashtags: string[];
  language: Language;
  modelUsed: string;
  createdAt: string;
}

export const CHAR_LIMITS: Record<ContentType, { min: number; max: number }> = {
  instagram_post:  { min: 100, max: 200 },
  instagram_story: { min: 10,  max: 40 },
  tiktok_caption:  { min: 50,  max: 100 },
};

export const HASHTAG_COUNTS: Record<ContentType, { min: number; max: number }> = {
  instagram_post:  { min: 10, max: 15 },
  instagram_story: { min: 0,  max: 0 },
  tiktok_caption:  { min: 5,  max: 8 },
};

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  instagram_post: 'Instagram Post',
  instagram_story: 'Instagram Story',
  tiktok_caption: 'TikTok',
};

export const TONE_LABELS: Record<ContentTone, string> = {
  divertido: '😄 Divertido',
  emotivo: '💖 Emotivo',
  informativo: '📚 Informativo',
  cumpleanos: '🎂 Cumpleaños',
};
