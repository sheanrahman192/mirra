// Seed content for the Reflect AI chat screen.

export interface ChatMessage {
  from: 'ai' | 'you';
  text: string;
}

export const SEED_MESSAGES: ChatMessage[] = [
  { from: 'ai', text: 'I can help you reflect on a saved conversation or on a moment you remember. What would you like to look at first?' },
];

export const STARTER_PROMPTS: string[] = [
  'Why did I interrupt early?',
  'What did I do well?',
  'How can I ask better questions?',
  'Compare to last week',
];

// Local fallback replies used only if the backend reflection call fails.
export const CANNED_REPLIES: string[] = [
  'That is worth noticing without judging it. What was happening right before that moment?',
  'A small experiment for next time: when you feel the urge to jump in, try a single breath first. What would make that easier?',
  'I would look for the moment where the conversation changed pace. Did it feel like the topic shifted, or did your attention shift?',
  'There may be a pattern here, but it needs one concrete moment to become useful. Which part of the conversation keeps replaying for you?',
];
