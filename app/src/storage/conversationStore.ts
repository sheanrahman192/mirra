import AsyncStorage from '@react-native-async-storage/async-storage';
import { Conversation } from '@/models/conversation';

const STORAGE_KEY = 'mirra:conversations';

export async function listConversations(): Promise<Conversation[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Conversation[];
    return parsed.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  } catch {
    return [];
  }
}

export async function addConversation(conversation: Conversation): Promise<void> {
  const existing = await listConversations();
  existing.unshift(conversation);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}
