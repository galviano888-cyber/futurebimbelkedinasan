// ============================================================
// DATA SOAL TRYOUT SKD
// Ganti isi array ini dengan soal asli nanti.
// Format: { id, category, text, options: [{ label, text, score }] }
// TWK/TIU: correct = 5, wrong = 0
// TKP: setiap opsi punya skor 1-5
// ============================================================

export type QuestionCategory = 'TWK' | 'TIU' | 'TKP';

export interface QuestionOption {
  label: string;
  text: string;
  score: number;
}

export interface TryoutQuestion {
  id: number;
  category: QuestionCategory;
  text: string;
  question_image_url?: string;
  options: QuestionOption[];
  explanation?: string;
  fast_tips?: string;
  correct_answer?: string;
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
  timeUsed: number; // dalam detik
  questions: TryoutQuestion[];
  answers: Record<number, string>;
}

// Placeholder — 5 soal contoh saja, nanti diganti soal asli
export const demoQuestions: TryoutQuestion[] = [
  {
    id: 1, category: 'TWK',
    text: 'Sila pertama Pancasila berbunyi ...',
    options: [
      { label: 'A', text: 'Ketuhanan Yang Maha Esa', score: 5 },
      { label: 'B', text: 'Kemanusiaan yang Adil dan Beradab', score: 0 },
      { label: 'C', text: 'Persatuan Indonesia', score: 0 },
      { label: 'D', text: 'Kerakyatan yang Dipimpin oleh Hikmat', score: 0 },
      { label: 'E', text: 'Keadilan Sosial bagi Seluruh Rakyat', score: 0 },
    ],
  },
  {
    id: 2, category: 'TWK',
    text: 'UUD 1945 disahkan pada tanggal ...',
    options: [
      { label: 'A', text: '17 Agustus 1945', score: 0 },
      { label: 'B', text: '18 Agustus 1945', score: 5 },
      { label: 'C', text: '1 Juni 1945', score: 0 },
      { label: 'D', text: '22 Juni 1945', score: 0 },
      { label: 'E', text: '29 Mei 1945', score: 0 },
    ],
  },
  {
    id: 3, category: 'TIU',
    text: 'Sinonim dari kata "abadi" adalah ...',
    options: [
      { label: 'A', text: 'Sementara', score: 0 },
      { label: 'B', text: 'Kekal', score: 5 },
      { label: 'C', text: 'Singkat', score: 0 },
      { label: 'D', text: 'Cepat', score: 0 },
      { label: 'E', text: 'Lambat', score: 0 },
    ],
  },
  {
    id: 4, category: 'TIU',
    text: 'Lanjutkan deret berikut: 2, 4, 8, 16, ...',
    options: [
      { label: 'A', text: '20', score: 0 },
      { label: 'B', text: '24', score: 0 },
      { label: 'C', text: '30', score: 0 },
      { label: 'D', text: '32', score: 5 },
      { label: 'E', text: '36', score: 0 },
    ],
  },
  {
    id: 5, category: 'TKP',
    text: 'Anda mendapati rekan kerja melakukan kesalahan dalam laporan. Sikap Anda adalah ...',
    options: [
      { label: 'A', text: 'Membiarkannya karena bukan urusan Anda', score: 1 },
      { label: 'B', text: 'Melaporkan langsung ke atasan', score: 3 },
      { label: 'C', text: 'Mengingatkan rekan secara pribadi dengan sopan', score: 5 },
      { label: 'D', text: 'Membicarakannya dengan rekan lain', score: 2 },
      { label: 'E', text: 'Menegur di depan semua orang', score: 4 },
    ],
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
