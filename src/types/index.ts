export interface TryoutRecord {
  id: string;
  date: string;
  packageName: string;
  twk: number;
  tiu: number;
  tkp: number;
  total: number;
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
