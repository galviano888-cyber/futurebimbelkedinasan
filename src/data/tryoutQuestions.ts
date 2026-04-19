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
  question_text: string;
  question_image_url?: string;
  options: { [key: string]: string };
  correct_answer: string;
  explanation?: string;
  fast_tips?: string;
  tkp_scores?: { [key: string]: number };
}

export interface TryoutResult {
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
}

// Placeholder — 5 soal contoh saja, nanti diganti soal asli
export const demoQuestions: TryoutQuestion[] = [
  {
    id: 1, category: 'TWK',
    question_text: 'Sila pertama Pancasila berbunyi ...',
    correct_answer: 'A',
    options: {
      'A': 'Ketuhanan Yang Maha Esa',
      'B': 'Kemanusiaan yang Adil dan Beradab',
      'C': 'Persatuan Indonesia',
      'D': 'Kerakyatan yang Dipimpin oleh Hikmat',
      'E': 'Keadilan Sosial bagi Seluruh Rakyat'
    },
  },
  {
    id: 2, category: 'TWK',
    question_text: 'UUD 1945 disahkan pada tanggal ...',
    correct_answer: 'B',
    options: {
      'A': '17 Agustus 1945',
      'B': '18 Agustus 1945',
      'C': '1 Juni 1945',
      'D': '22 Juni 1945',
      'E': '29 Mei 1945'
    },
  },
  {
    id: 3, category: 'TIU',
    question_text: 'Sinonim dari kata "abadi" adalah ...',
    correct_answer: 'B',
    options: {
      'A': 'Sementara',
      'B': 'Kekal',
      'C': 'Singkat',
      'D': 'Cepat',
      'E': 'Lambat'
    },
  },
  {
    id: 4, category: 'TIU',
    question_text: 'Lanjutkan deret berikut: 2, 4, 8, 16, ...',
    correct_answer: 'D',
    options: {
      'A': '20',
      'B': '24',
      'C': '30',
      'D': '32',
      'E': '36'
    },
  },
  {
    id: 5, category: 'TKP',
    question_text: 'Anda mendapati rekan kerja melakukan kesalahan dalam laporan. Sikap Anda adalah ...',
    correct_answer: 'C',
    options: {
      'A': 'Membiarkannya karena bukan urusan Anda',
      'B': 'Melaporkan langsung ke atasan',
      'C': 'Mengingatkan rekan secara pribadi dengan sopan',
      'D': 'Membicarakannya dengan rekan lain',
      'E': 'Menegur di depan semua orang'
    },
    tkp_scores: {
      'A': 1, 'B': 3, 'C': 5, 'D': 2, 'E': 4
    }
  },
];

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
