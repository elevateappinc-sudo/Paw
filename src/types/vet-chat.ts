export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  isEmergency?: boolean;
}

export interface PetContext {
  petId: string;
  name: string;
  species: string;
  breed: string;
  ageYears: number;
  weightKg: number;
  medications?: string[];
}

export interface VetChatRequest {
  message: string;
  petId: string;
  sessionId: string;
  history: Array<{ role: MessageRole; content: string }>;
}

export interface VetChatResponse {
  reply: string;
  isEmergency: boolean;
  emergencySymptoms?: string[];
  tokensUsed: { input: number; output: number };
  modelUsed: string;
  dailyMessagesRemaining: number;
}

export type VetChatErrorCode =
  | 'RATE_LIMIT_EXCEEDED'
  | 'CIRCUIT_BREAKER_OPEN'
  | 'PET_NOT_FOUND'
  | 'AI_ERROR'
  | 'UNKNOWN';

export interface VetChatError {
  code: VetChatErrorCode;
  message: string;
}
