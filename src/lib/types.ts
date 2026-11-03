export type Locale = "en" | "nl";
export type Category =
  | "social"
  | "food"
  | "party"
  | "love"
  | "opinions"
  | "culture"
  | "person"
  | "whatif"
  | "numbers"
  | "weird";
export type ImpostorSetting = 1 | 2 | 3 | "random";
export type Phase = "lobby" | "answering" | "discussion" | "reveal";
export interface Question {
  id: string;
  category: Category;
  original: string;
  I1: string;
  I2: string;
  I3: string;
}
export interface Settings {
  capacity: number;
  impostors: ImpostorSetting;
  categories: Category[];
  locale: Locale;
}
export interface Member {
  nickname: string;
  ready: boolean;
  joinedAt: number;
  slot: number;
}
export interface Presence {
  online: boolean;
  lastSeen: number;
}
export interface Meta {
  hostId: string;
  createdAt: number;
  expiresAt: number;
  phase: Phase;
  round: number;
  roundId: string;
  settings: Settings;
}
export interface Assignment {
  roundId: string;
  question: string;
}
export interface Response {
  roundId: string;
  answer: string;
}
export interface Result {
  nickname: string;
  answer: string;
}
export interface RevealPlayer {
  nickname: string;
  question: string;
  variation: "I1" | "I2" | "I3";
}
export interface Vault {
  roundId: string;
  original: string;
  category: Category;
  questionId: string;
  assignments: Record<string, Assignment>;
  impostors: Record<string, RevealPlayer>;
}
export interface Discussion {
  roundId: string;
  original: string;
  category: Category;
  answers: Record<string, Result>;
}
export interface Reveal {
  roundId: string;
  impostors: Record<string, RevealPlayer>;
}
export interface RoomState {
  meta: Meta | null;
  members: Record<string, Member>;
  presence: Record<string, Presence>;
  submitted: Record<string, string>;
  assignment: Assignment | null;
  discussion: Discussion | null;
  reveal: Reveal | null;
}
