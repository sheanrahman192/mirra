// Recent conversations shown on the Home screen.

export interface Recent {
  id: number;
  title: string;
  when: string;
  duration: string;
  spark: number[];
  tone: string;
  note: string;
}

export const RECENTS: Recent[] = [
  { id: 1, title: 'Coffee with Maya', when: 'Tue · 4:12 PM', duration: '28 min', spark: [3, 5, 4, 7, 6, 8, 5, 9, 7, 8, 6, 7], tone: 'sage', note: 'warm & curious' },
  { id: 2, title: 'Standup, design team', when: 'Tue · 9:30 AM', duration: '14 min', spark: [6, 7, 6, 8, 7, 9, 8, 8, 7, 9, 8, 9], tone: 'terracotta', note: 'lots of space made' },
  { id: 3, title: 'Call w/ Dad', when: 'Mon · 7:48 PM', duration: '42 min', spark: [4, 3, 5, 4, 6, 5, 7, 6, 8, 7, 9, 8], tone: 'lavender', note: 'you listened deeply' },
  { id: 4, title: 'Brainstorm w/ Priya', when: 'Mon · 2:05 PM', duration: '36 min', spark: [7, 8, 6, 9, 7, 8, 9, 7, 8, 6, 7, 5], tone: 'coral', note: '12 questions asked' },
  { id: 5, title: 'Catch-up, Jordan', when: 'Sun · 11:20 AM', duration: '52 min', spark: [5, 6, 5, 7, 8, 6, 7, 8, 7, 9, 8, 7], tone: 'sage', note: 'balanced flow' },
];
