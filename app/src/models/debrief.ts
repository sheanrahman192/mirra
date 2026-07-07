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

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  durationMinutes: number;
  talkListenPercent: number;
  questionCount: number;
  interruptionCount: number;
  tone: string;
  note: string;
}

export interface FillerCount {
  phrase: string;
  count: number;
}

export interface ProgressWeekSummary {
  weekKey: string;
  label: string;
  startsAt: string;
  endsAt: string;
  conversationCount: number;
  totalMinutes: number;
  dailyMinutes: number[];
  dailyQuestions: number[];
  dailyInterruptions: number[];
  averageSessionMinutes: number;
  talkListenPercent: number;
  averageQuestions: number;
  totalQuestions: number;
  interruptionCount: number;
  averageWpm: number;
  topFillers: FillerCount[];
  wins: string[];
  nudges: string[];
  conversations: ConversationSummary[];
}

export interface ProgressSummary {
  generatedAt: string;
  currentWeekIndex: number;
  weeks: ProgressWeekSummary[];
}

export interface ProfileSummary {
  totalConversations: number;
  totalMinutes: number;
  averageQuestions: number;
  talkListenPercent: number;
  usedThisMonth: number;
  remaining: number;
  resetsAt: string;
}

export interface ReflectMessage {
  role: 'assistant' | 'user';
  content: string;
}
