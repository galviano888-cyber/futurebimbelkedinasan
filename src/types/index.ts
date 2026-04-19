export interface TryoutRecord {
  id: string;
  packageId?: string;
  tryoutId?: string;
  date: string;
  packageName: string;
  twk: number;
  tiu: number;
  tkp: number;
  total: number;
  answers?: Record<string, string>;
  score_details?: any;
}

export interface ActivePackageData {
  id: string;
  name: string;
  description: string;
  totalSoal: number;
  duration: number;
  expiresAt: string;
  category: string;
}
