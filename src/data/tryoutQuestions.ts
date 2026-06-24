// ============================================================
// DATA SOAL TRYOUT SKD
// Ganti isi array ini dengan soal asli nanti.
// Format: { id, category, text, options: [{ label, text, score }] }
// TWK/TIU: correct = 5, wrong = 0
// TKP: setiap opsi punya skor 1-5
// ============================================================

export type QuestionCategory = 'TWK' | 'TIU' | 'TKP';

export interface TryoutQuestion {
  id: string | number;
  category: string;
  sub_category?: string;
  question_text: string;
  question_image_url?: string;
  options: { [key: string]: string };
  correct_answer: string;
  explanation?: string;
  fast_tips?: string;
  tkp_scores?: { [key: string]: number };
}

export interface TryoutResult {
  id?: string;
  packageId?: string;
  tryoutId?: string;
  twkScore: number;
  tiuScore: number;
  tkpScore: number;
  totalScore: number;
  twkMax: number;
  tiuMax: number;
  tkpMax: number;
  totalMax: number;
  twkCorrect: number;
  tiuCorrect: number;
  tkpCorrect: number;
  totalQuestions: number;
  answeredCount: number;
  timeUsed: number;
  questions: TryoutQuestion[];
  answers: Record<string | number, string>;
  fromHistory?: boolean;
}

// Config tryout
export const TRYOUT_CONFIG = {
  timeLimit: 100 * 60, // 100 menit dalam detik
  twkCount: 30,
  tiuCount: 35,
  tkpCount: 45,
  totalQuestions: 110,
  passingScore: {
    twk: 65,
    tiu: 80,
    tkp: 166,
  },
};
