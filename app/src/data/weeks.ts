// Three weeks of mock analytics — drives the Progress screen and the
// Insights week-index. Ported from screen-progress.jsx WEEKS.

export interface ConvListItem {
  id: string;
  title: string;
  when: string;
  duration: string;
  tone: string;
  note: string;
}

export interface OffsetPoint {
  t: string;
  ms: number | null;
}

export interface LsmConv {
  name: string;
  score: number;
}

export interface FillerItem {
  phrase: string;
  count: number;
}

export interface OpenClosed {
  open: number;
  closed: number;
}

export interface Week {
  label: string;
  short: string;
  upcoming?: boolean;
  title: [string, string];
  convs: number;
  mins: string;
  daily: number[];
  talkListen: number;
  talkTrend: number[];
  questions: number;
  questionsTrend: number[];
  questionsDaily: { asked: number[]; received: number[] };
  questionsOpenClosed: { asked: OpenClosed; received: OpenClosed };
  interrupts: number;
  interruptsTrend: number[];
  turnOffsetAvg: number;
  turnOffsetTrend: OffsetPoint[];
  energy: number;
  energyAxes: number[];
  lsmAvg: number;
  ttrAvg: number;
  ttrCounts: { unique: number; total: number };
  topFillers: FillerItem[];
  lsmConvs: LsmConv[];
  convsList: ConvListItem[];
}

export const WEEKS: Week[] = [
  {
    label: 'May 12 — 18', short: 'May 12',
    title: ['Seven conversations,', 'three hours, six minutes.'],
    convs: 7, mins: '3:06',
    daily: [22, 18, 35, 12, 28, 14, 37],
    talkListen: 60, talkTrend: [70, 68, 66, 64, 62, 60],
    questions: 7.8, questionsTrend: [5, 6, 7, 8, 7, 7.8],
    questionsDaily: { asked: [8, 6, 11, 4, 10, 5, 11], received: [6, 4, 8, 3, 7, 4, 8] },
    questionsOpenClosed: {
      asked: { open: 32, closed: 23 },
      received: { open: 24, closed: 16 },
    },
    interrupts: 3.0, interruptsTrend: [5.0, 4.2, 3.8, 3.5, 3.0, 3.0],
    turnOffsetAvg: 240,
    turnOffsetTrend: [
      { t: 'M', ms: 280 },
      { t: 'T', ms: 240 },
      { t: 'W', ms: 220 },
      { t: 'T', ms: 320 },
      { t: 'F', ms: 260 },
      { t: 'S', ms: 200 },
      { t: 'S', ms: 230 },
    ],
    energy: 78, energyAxes: [0.72, 0.65, 0.74, 0.62, 0.78],
    lsmAvg: 0.74,
    ttrAvg: 0.55,
    ttrCounts: { unique: 1180, total: 2150 },
    topFillers: [
      { phrase: 'honestly', count: 28 },
      { phrase: 'kind of', count: 24 },
      { phrase: 'you know', count: 18 },
      { phrase: 'right?', count: 14 },
      { phrase: 'like', count: 11 },
    ],
    lsmConvs: [
      { name: 'Catch-up, Sam', score: 0.78 },
      { name: 'Coffee, Priya', score: 0.71 },
      { name: 'Call, Dad', score: 0.58 },
      { name: 'Standup, design', score: 0.69 },
      { name: 'Drinks, Jordan', score: 0.82 },
    ],
    convsList: [
      { id: 'w1-1', title: 'Catch-up, Sam', when: 'Sun · 10:15 AM', duration: '24 min', tone: 'sage', note: 'easy banter' },
      { id: 'w1-2', title: 'Coffee, Priya', when: 'Tue · 8:40 AM', duration: '18 min', tone: 'lavender', note: 'a lot to share' },
      { id: 'w1-3', title: 'Call w/ Dad', when: 'Wed · 6:45 PM', duration: '35 min', tone: 'coral', note: 'long, careful pauses' },
      { id: 'w1-4', title: 'Standup, design', when: 'Thu · 9:30 AM', duration: '12 min', tone: 'terracotta', note: 'concise & even' },
      { id: 'w1-5', title: 'Quick sync, Eli', when: 'Thu · 2:10 PM', duration: '14 min', tone: 'sage', note: 'project handoff' },
      { id: 'w1-6', title: 'Walk w/ Sam', when: 'Fri · 5:00 PM', duration: '28 min', tone: 'lavender', note: 'thoughtful' },
      { id: 'w1-7', title: 'Drinks, Jordan', when: 'Sat · 8:30 PM', duration: '37 min', tone: 'coral', note: 'storytelling' },
    ],
  },
  {
    label: 'May 19 — 25', short: 'This week',
    title: ['Five conversations,', 'two hours, fourteen minutes.'],
    convs: 5, mins: '2:14',
    daily: [12, 28, 0, 42, 18, 35, 0],
    talkListen: 58, talkTrend: [68, 65, 64, 62, 60, 58],
    questions: 9.4, questionsTrend: [5, 6, 7, 8, 7, 9.4],
    questionsDaily: { asked: [5, 11, 0, 14, 7, 10, 0], received: [4, 8, 0, 10, 5, 7, 0] },
    questionsOpenClosed: {
      asked: { open: 31, closed: 16 },
      received: { open: 21, closed: 13 },
    },
    interrupts: 2.2, interruptsTrend: [5.0, 4.2, 3.8, 3.5, 3.0, 2.2],
    turnOffsetAvg: 210,
    turnOffsetTrend: [
      { t: 'M', ms: 320 },
      { t: 'T', ms: 195 },
      { t: 'W', ms: null },
      { t: 'T', ms: 170 },
      { t: 'F', ms: 220 },
      { t: 'S', ms: 175 },
      { t: 'S', ms: null },
    ],
    energy: 82, energyAxes: [0.78, 0.74, 0.80, 0.68, 0.82],
    lsmAvg: 0.78,
    ttrAvg: 0.61,
    ttrCounts: { unique: 980, total: 1605 },
    topFillers: [
      { phrase: 'honestly', count: 34 },
      { phrase: 'you know', count: 22 },
      { phrase: 'kind of', count: 19 },
      { phrase: 'actually', count: 14 },
      { phrase: 'I mean', count: 11 },
    ],
    lsmConvs: [
      { name: 'Coffee, Maya', score: 0.83 },
      { name: 'Standup, design', score: 0.78 },
      { name: 'Call, Dad', score: 0.58 },
      { name: 'Brainstorm, Priya', score: 0.71 },
      { name: 'Catch-up, Jordan', score: 0.62 },
      { name: 'Walk, Sam', score: 0.81 },
      { name: 'Lunch, Alex', score: 0.74 },
    ],
    convsList: [
      { id: 'w2-1', title: 'Coffee with Maya', when: 'Tue · 4:12 PM', duration: '28 min', tone: 'sage', note: 'warm & curious' },
      { id: 'w2-2', title: 'Standup, design', when: 'Tue · 9:30 AM', duration: '14 min', tone: 'terracotta', note: 'lots of space made' },
      { id: 'w2-3', title: 'Call w/ Dad', when: 'Mon · 7:48 PM', duration: '42 min', tone: 'coral', note: 'you listened deeply' },
      { id: 'w2-4', title: 'Brainstorm w/ Priya', when: 'Mon · 2:05 PM', duration: '36 min', tone: 'lavender', note: '12 questions asked' },
      { id: 'w2-5', title: 'Catch-up, Jordan', when: 'Sun · 11:20 AM', duration: '52 min', tone: 'sage', note: 'balanced flow' },
      { id: 'w2-6', title: 'Walk, Sam', when: 'Fri · 6:30 PM', duration: '22 min', tone: 'lavender', note: 'quiet & easy' },
      { id: 'w2-7', title: 'Lunch, Alex', when: 'Thu · 12:45 PM', duration: '40 min', tone: 'terracotta', note: 'work talk' },
    ],
  },
  {
    label: 'May 26 — Jun 1', short: 'Jun 1', upcoming: true,
    title: ['In progress —', 'two conversations so far.'],
    convs: 2, mins: '0:48',
    daily: [22, 26, 0, 0, 0, 0, 0],
    talkListen: 55, talkTrend: [68, 65, 64, 62, 60, 55],
    questions: 11, questionsTrend: [5, 6, 7, 8, 7, 11],
    questionsDaily: { asked: [10, 12, 0, 0, 0, 0, 0], received: [7, 9, 0, 0, 0, 0, 0] },
    questionsOpenClosed: {
      asked: { open: 16, closed: 6 },
      received: { open: 11, closed: 5 },
    },
    interrupts: 1.5, interruptsTrend: [5.0, 4.2, 3.8, 3.5, 3.0, 1.5],
    turnOffsetAvg: 195,
    turnOffsetTrend: [
      { t: 'M', ms: 220 },
      { t: 'T', ms: 170 },
      { t: 'W', ms: null },
      { t: 'T', ms: null },
      { t: 'F', ms: null },
      { t: 'S', ms: null },
      { t: 'S', ms: null },
    ],
    energy: 85, energyAxes: [0.82, 0.78, 0.82, 0.72, 0.85],
    lsmAvg: 0.80,
    ttrAvg: 0.63,
    ttrCounts: { unique: 410, total: 645 },
    topFillers: [
      { phrase: 'honestly', count: 9 },
      { phrase: 'you know', count: 6 },
      { phrase: 'kind of', count: 5 },
      { phrase: 'actually', count: 4 },
      { phrase: 'I mean', count: 3 },
    ],
    lsmConvs: [
      { name: 'Brunch, Alex', score: 0.85 },
      { name: 'Walk, Maya', score: 0.75 },
    ],
    convsList: [
      { id: 'w3-1', title: 'Brunch w/ Alex', when: 'Mon · 11:30 AM', duration: '22 min', tone: 'sage', note: 'open & detailed' },
      { id: 'w3-2', title: 'Walk w/ Maya', when: 'Tue · 6:00 PM', duration: '26 min', tone: 'lavender', note: 'reflective' },
    ],
  },
];

export const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function fullDay(short: string): string {
  return ({
    Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
    Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
  } as Record<string, string>)[short] || short;
}
