// Seed content for the Reflect AI chat screen.

export interface ChatMessage {
  from: 'ai' | 'you';
  text: string;
}

export const SEED_MESSAGES: ChatMessage[] = [
  { from: 'ai', text: "I read through your coffee with Maya. There's something quiet in there — you held more space than usual, but the first ten minutes had a different rhythm than the rest. Want to start there?" },
  { from: 'you', text: 'Yeah — I noticed I interrupted her three times early on.' },
  { from: 'ai', text: 'Right. All in the first ten minutes, then none for the next eighteen. What do you think shifted? Was it her, you, or the topic?' },
];

export const STARTER_PROMPTS: string[] = [
  'Why did I interrupt early?',
  'What did I do well?',
  'How can I ask better questions?',
  'Compare to last week',
];

// Canned reflective replies — stand in for the live Claude call the prototype
// made via window.claude.complete(). Cycled through on each user message.
export const CANNED_REPLIES: string[] = [
  "That tracks with the data — your interruptions clustered before minute ten, then disappeared. Often that early friction is just two people finding a shared tempo. What were you feeling in those first few minutes?",
  "It's worth noticing without judging it. You asked eight questions overall, most in the back half — once you settled, you got genuinely curious. Does that match how it felt from the inside?",
  "A small experiment for next time: when you feel the urge to jump in, try a single breath first. You already do this well later in conversations. What would make it easier to start there?",
  "Compared to last week you're trending gentler — interruptions down to 2.2 per conversation and questions up 22%. The shape of your conversations is changing. What do you think is driving it?",
];

export const CONV_FACTS = `You are Mirra — a warm, reflective conversation coach. Be kind, curious, non-judgmental. Keep responses 1–3 sentences and end with an open question when natural.

This is a chat with Maya, recorded yesterday at 4:12 PM, 28 minutes long:
- Talk/Listen: user spoke 62%, Maya 38%.
- 8 questions asked, mostly in the second half.
- 3 interruptions in the first 10 minutes, none after.
- Energy mirroring: 78% in tune. Strongest in minutes 15–22.
- Vocabulary: 236 unique words, leaned on "space", "curious", "tell me".

This week (May 19-25): 5 conversations, 2h 14m total. Trends: questions up 22% vs prior weeks, interruptions down to 2.2 per conversation.`;
