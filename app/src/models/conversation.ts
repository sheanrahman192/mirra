export interface Conversation {
  id: string;
  title: string;
  uploadedAt: string;
  audioUri: string;
  durationSeconds: number;
  tone: string;
  note: string;
}

export interface ConversationListItem {
  id: string;
  title: string;
  when: string;
  duration: string;
  tone: string;
  note: string;
}
