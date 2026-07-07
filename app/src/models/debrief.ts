export interface ConversationStats {
  talkListenRatio: number;
  questionCount: number;
  interruptionCount: number;
  sessionDurationMinutes: number;
  userSpeechDurationMinutes: number;
  estimatedWpm: number;
}

export interface DebriefCard {
  id: string;
  sessionId: string;
  userId: string;
  createdAt: string;
  observation: string;
  patternToReduce: string;
  thingToTryNext: string;
  stats: ConversationStats;
  transcript?: string | null;
}

export interface UsageSummary {
  usedThisMonth: number;
  remaining: number;
  resetsAt: string;
}

export interface SessionResponse {
  debrief: DebriefCard;
  usedThisMonth: number;
  remaining: number;
}
