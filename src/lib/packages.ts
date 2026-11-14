// Tipe paket yang dijual. Satu sumber agar label konsisten di katalog,
// panel admin, dan halaman Paket Saya.

export type ProductType =
  | 'SATUAN'
  | 'BUNDLE'
  | 'INTENSIF'
  | 'KELAS'
  | 'PRIVAT_SATUAN'
  | 'PRIVAT_PAKET';

export const PRODUCT_TYPE_LABEL: Record<string, string> = {
  SATUAN: 'Tryout Satuan',
  BUNDLE: 'Bundle Tryout',
  INTENSIF: 'Paket Intensif',
  KELAS: 'Paket Kelas',
  PRIVAT_SATUAN: 'Privat Satuan',
  PRIVAT_PAKET: 'Privat Paket',
};

export function productTypeLabel(type?: string | null): string {
  if (!type) return 'Paket';
  const key = type.toUpperCase();
  // Data lama mungkin masih menyimpan 'PRIVAT'.
  if (key === 'PRIVAT') return 'Privat Satuan';
  return PRODUCT_TYPE_LABEL[key] ?? type;
}

/** Tipe yang punya live class, materi, dan panduan (bukan tryout eceran). */
const FULL_TYPES = ['INTENSIF', 'KELAS', 'PRIVAT', 'PRIVAT_SATUAN', 'PRIVAT_PAKET'];

export function isFullPackage(type?: string | null): boolean {
  return !!type && FULL_TYPES.includes(type.toUpperCase());
}

/** Semua varian privat: 1 pertemuan (satuan) atau beberapa pertemuan (paket). */
export function isPrivatePackage(type?: string | null): boolean {
  if (!type) return false;
  const key = type.toUpperCase();
  return key === 'PRIVAT' || key === 'PRIVAT_SATUAN' || key === 'PRIVAT_PAKET';
}

/** Paket kelas dibatasi jumlah siswa (default 5 orang). */
export function isClassPackage(type?: string | null): boolean {
  return !!type && type.toUpperCase() === 'KELAS';
}

export interface SeatInfo {
  quota: number | null;
  taken: number;
  remaining: number | null;
  full: boolean;
}

export function seatInfo(quota?: number | null, taken?: number | null): SeatInfo {
  const q = quota ?? null;
  const t = Math.max(0, taken ?? 0);
  return {
    quota: q,
    taken: t,
    remaining: q === null ? null : Math.max(0, q - t),
    full: q !== null && t >= q,
  };
}

/** Contoh: "Sisa 3 dari 5 kursi". Null bila paket tidak berkuota. */
export function seatLabel(quota?: number | null, taken?: number | null): string | null {
  const s = seatInfo(quota, taken);
  if (s.quota === null) return null;
  return `Sisa ${s.remaining} dari ${s.quota} kursi`;
}

/** Ringkas untuk badge: "3/5 kursi". Null bila paket tidak berkuota. */
export function packageSeatLabel(pkg: {
  product_type?: string | null;
  quota?: number | null;
  seats_taken?: number | null;
}): string | null {
  if (!isClassPackage(pkg.product_type) || pkg.quota == null) return null;
  return `${Math.max(0, pkg.seats_taken ?? 0)}/${pkg.quota} kursi`;
}

/** True bila paket kelas sudah tidak punya kursi tersisa. */
export function packageIsFull(pkg: {
  product_type?: string | null;
  quota?: number | null;
  seats_taken?: number | null;
}): boolean {
  if (!isClassPackage(pkg.product_type) || pkg.quota == null) return false;
  return (pkg.seats_taken ?? 0) >= pkg.quota;
}
