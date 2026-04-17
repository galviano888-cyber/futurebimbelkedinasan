import type { TryoutRecord, ActivePackageData } from "@/types";

export const mockTryoutData: TryoutRecord[] = [
  {
    id: "1",
    date: "2024-10-08",
    packageName: "Paket SKD CPNS Gelombang I",
    twk: 75,
    tiu: 85,
    tkp: 170,
    total: 330,
  },
  {
    id: "2",
    date: "2024-10-22",
    packageName: "Paket SKD Intensif Kedinasan",
    twk: 65,
    tiu: 90,
    tkp: 175,
    total: 330,
  },
  {
    id: "3",
    date: "2024-11-05",
    packageName: "Paket SKD CPNS Gelombang II",
    twk: 80,
    tiu: 95,
    tkp: 180,
    total: 355,
  },
  {
    id: "4",
    date: "2024-11-19",
    packageName: "Paket Simulasi SKD Nasional",
    twk: 55,
    tiu: 75,
    tkp: 160,
    total: 290,
  },
  {
    id: "5",
    date: "2024-12-03",
    packageName: "Paket SKD Premium Pro",
    twk: 90,
    tiu: 100,
    tkp: 185,
    total: 375,
  },
];

export const mockActivePackage: ActivePackageData = {
  id: "pkg-001",
  name: "Paket SKD Super Intensif 2025",
  description:
    "Latihan soal komprehensif mencakup TWK, TIU, dan TKP dengan pembahasan mendalam oleh tim pengajar berpengalaman.",
  totalSoal: 110,
  duration: 100,
  expiresAt: "2025-03-31",
  category: "SKD CPNS",
};
