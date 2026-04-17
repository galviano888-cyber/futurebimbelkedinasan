import { useState } from "react";
import {
  FileText,
  Download,
  Video,
  Eye,
  Library,
  BookOpen,
  PenTool,
  ChevronDown,
  Play,
  Clock,
  CheckCircle2,
  FileEdit
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================
// TYPES
// ============================

interface ScheduleItem {
  id: number;
  date: string;
  time: string;
  title: string;
  mentor: string;
  hasMinites: boolean;
  hasMateri: boolean;
  hasZoom: boolean;
  hasRekaman: boolean;
  status: "Selesai" | "Akan Datang" | "Berlangsung";
}

interface BundledTryout {
  id: string;
  name: string;
  totalQuestions: number;
  duration: number;
  status: "Belum" | "Selesai";
}

interface PurchasedPackage {
  id: string;
  name: string;
  shortName: string;
  schedules: ScheduleItem[];
  tryouts: BundledTryout[];
}

interface StandaloneTryout {
  id: string;
  name: string;
  totalQuestions: number;
  duration: number;
  status: "Belum" | "Selesai";
}

// ============================
// MOCK DATA
// ============================

const mockPurchasedPackages: PurchasedPackage[] = [
  {
    id: "pkg-batch1",
    name: "Program Intensif SKD Kedinasan — Batch 1",
    shortName: "Batch 1 - 2026",
    schedules: [
      { id: 1, date: "Jumat, 1 Sep 2023", time: "Pukul 19:30 WIB", title: "Pembahasan Kisi-kisi SKD, Update Info CPNS Dan Penjelasan Teknis Pelaksanaan Bimbel", mentor: "Mentor Fandi AP", hasMinites: true, hasMateri: true, hasZoom: true, hasRekaman: true, status: "Selesai" },
      { id: 2, date: "Senin, 4 Sep 2023", time: "Pukul 19:30 WIB", title: "TIU - Perbandingan", mentor: "Mentor PING LIE", hasMinites: true, hasMateri: true, hasZoom: true, hasRekaman: true, status: "Selesai" },
      { id: 3, date: "Selasa, 5 Sep 2023", time: "Pukul 19:30 WIB", title: "TKP - Pendahuluan Kode Etik ASN Dan 6 Tema TKP", mentor: "Mentor Fandi AP", hasMinites: true, hasMateri: true, hasZoom: true, hasRekaman: true, status: "Selesai" },
      { id: 4, date: "Rabu, 6 Sep 2023", time: "Pukul 19:30 WIB", title: "TIU - Hitung Cepat Dan Figural", mentor: "Mentor PING LIE", hasMinites: true, hasMateri: true, hasZoom: false, hasRekaman: false, status: "Selesai" },
    ],
    tryouts: [
      { id: "t1", name: "Tryout SKD Batch 1 - Sesi 1", totalQuestions: 110, duration: 100, status: "Selesai" },
      { id: "t2", name: "Tryout SKD Batch 1 - Sesi 2", totalQuestions: 110, duration: 100, status: "Selesai" },
      { id: "t3", name: "Tryout SKD Batch 1 - Sesi 3", totalQuestions: 110, duration: 100, status: "Belum" },
    ],
  },
];

const mockStandaloneTryouts: StandaloneTryout[] = [];

// ============================
// MAIN COMPONENT
// ============================

export function PaketSayaView() {
  const [selectedPkg, setSelectedPkg] = useState(mockPurchasedPackages[0]?.id || "");
  const [pkgDropdownOpen, setPkgDropdownOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<"materi" | "tryout">("materi");

  const currentPkg = mockPurchasedPackages.find((p) => p.id === selectedPkg);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-slate-900 font-bold text-2xl tracking-tight flex items-center gap-3">
          <Library className="w-7 h-7 text-blue-500" />
          Paket Saya
        </h1>
        <p className="text-slate-500 text-sm mt-1">Akses seluruh materi, live class, dan tryout dari paket Anda.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* ======================================= */}
        {/* LEFT SIDEBAR — Compact Navigation       */}
        {/* ======================================= */}
        <div className="w-full lg:w-64 shrink-0 space-y-4">

          {/* --- PAKET DROPDOWN --- */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paket Aktif</span>
            </div>

            {mockPurchasedPackages.length === 0 ? (
              <div className="p-4 text-sm text-slate-400 text-center">Belum ada paket</div>
            ) : (
              <>
                {/* Dropdown Button */}
                <div className="relative">
                  <button
                    onClick={() => setPkgDropdownOpen(!pkgDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 shrink-0" />
                      <span className="truncate">{currentPkg?.shortName || "Pilih Paket"}</span>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 shrink-0 transition-transform", pkgDropdownOpen && "rotate-180")} />
                  </button>

                  {pkgDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 z-20 bg-white border border-slate-200 shadow-xl rounded-b-xl overflow-hidden">
                      {mockPurchasedPackages.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedPkg(p.id); setPkgDropdownOpen(false); }}
                          className={cn(
                            "w-full text-left px-4 py-3 text-sm font-medium transition-colors",
                            selectedPkg === p.id ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          {p.shortName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sub-menu items */}
                <div className="divide-y divide-slate-100">
                  <button
                    onClick={() => setActiveSubMenu("materi")}
                    className={cn(
                      "w-full text-left px-4 py-3 text-sm font-semibold transition-colors flex items-center gap-2.5",
                      activeSubMenu === "materi"
                        ? "bg-blue-50 text-blue-700 border-l-[3px] border-l-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-l-[3px] border-l-transparent"
                    )}
                  >
                    <BookOpen className="w-4 h-4" /> Materi & Live Class
                  </button>
                  <button
                    onClick={() => setActiveSubMenu("tryout")}
                    className={cn(
                      "w-full text-left px-4 py-3 text-sm font-semibold transition-colors flex items-center gap-2.5",
                      activeSubMenu === "tryout"
                        ? "bg-blue-50 text-blue-700 border-l-[3px] border-l-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-l-[3px] border-l-transparent"
                    )}
                  >
                    <PenTool className="w-4 h-4" /> Tryout Paket
                  </button>
                </div>
              </>
            )}
          </div>

          {/* --- TRYOUT SATUAN --- */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tryout Satuan</span>
            </div>
            {mockStandaloneTryouts.length === 0 ? (
              <div className="p-4 text-center">
                <PenTool className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Belum ada tryout satuan yang dibeli.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {mockStandaloneTryouts.map((t) => (
                  <button
                    key={t.id}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-2.5"
                  >
                    <FileEdit className="w-4 h-4 text-emerald-500" />
                    <span className="truncate">{t.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ======================================= */}
        {/* RIGHT CONTENT AREA                      */}
        {/* ======================================= */}
        <div className="flex-1 min-w-0">
          {!currentPkg ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
              <Library className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Pilih paket di menu sebelah kiri untuk melihat konten.</p>
            </div>
          ) : activeSubMenu === "materi" ? (
            /* ====== MATERI & LIVE CLASS TABLE ====== */
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  Jadwal Materi & Live Class
                </h2>
                <span className="text-xs text-slate-400">{currentPkg.schedules.length} sesi</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[780px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-3 px-5 font-bold text-[11px] text-slate-500 uppercase tracking-wider">Waktu</th>
                      <th className="py-3 px-5 font-bold text-[11px] text-slate-500 uppercase tracking-wider">Judul</th>
                      <th className="py-3 px-3 font-bold text-[11px] text-slate-500 uppercase tracking-wider text-center">Mini Tes</th>
                      <th className="py-3 px-3 font-bold text-[11px] text-slate-500 uppercase tracking-wider text-center">Materi</th>
                      <th className="py-3 px-3 font-bold text-[11px] text-slate-500 uppercase tracking-wider text-center">Zoom/YT</th>
                      <th className="py-3 px-3 font-bold text-[11px] text-slate-500 uppercase tracking-wider text-center">Rekaman</th>
                      <th className="py-3 px-4 font-bold text-[11px] text-slate-500 uppercase tracking-wider text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentPkg.schedules.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3.5 px-5 align-top">
                          <p className="font-bold text-slate-800 text-xs whitespace-nowrap">{item.date}</p>
                          <p className="text-slate-400 text-[10px] mt-0.5 italic">{item.time}</p>
                        </td>
                        <td className="py-3.5 px-5 align-top max-w-[280px]">
                          <p className="font-medium text-slate-700 text-xs leading-snug">{item.title}</p>
                          <p className="text-blue-500 text-[10px] mt-0.5 font-semibold">{item.mentor}</p>
                        </td>
                        <td className="py-3.5 px-3 align-middle text-center">
                          {item.hasMinites ? (
                            <button className="inline-flex flex-col items-center gap-0.5 text-emerald-600 hover:text-emerald-700 transition-colors group">
                              <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              <span className="text-[9px] font-bold">Kerjakan</span>
                            </button>
                          ) : <span className="text-slate-200">—</span>}
                        </td>
                        <td className="py-3.5 px-3 align-middle text-center">
                          {item.hasMateri ? (
                            <button className="inline-flex flex-col items-center gap-0.5 text-blue-500 hover:text-blue-600 transition-colors group">
                              <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              <span className="text-[9px] font-bold">Download</span>
                            </button>
                          ) : <span className="text-slate-200">—</span>}
                        </td>
                        <td className="py-3.5 px-3 align-middle text-center">
                          {item.hasZoom ? (
                            <button className="inline-flex flex-col items-center gap-0.5 text-blue-500 hover:text-blue-600 transition-colors group">
                              <Video className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              <span className="text-[9px] font-bold">Masuk</span>
                            </button>
                          ) : <span className="text-slate-200">—</span>}
                        </td>
                        <td className="py-3.5 px-3 align-middle text-center">
                          {item.hasRekaman ? (
                            <button className="inline-flex flex-col items-center gap-0.5 text-blue-500 hover:text-blue-600 transition-colors group">
                              <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              <span className="text-[9px] font-bold">Lihat</span>
                            </button>
                          ) : <span className="text-slate-200">—</span>}
                        </td>
                        <td className="py-3.5 px-4 align-middle text-center">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold rounded-full",
                            item.status === "Selesai" && "bg-emerald-500 text-white",
                            item.status === "Akan Datang" && "bg-amber-100 text-amber-700",
                            item.status === "Berlangsung" && "bg-blue-500 text-white"
                          )}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ====== TRYOUT PAKET (BUNDLED) ====== */
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-blue-500" />
                  Tryout dalam Paket
                </h2>
                <span className="text-xs text-slate-400">{currentPkg.tryouts.length} tryout</span>
              </div>
              <div className="divide-y divide-slate-100">
                {currentPkg.tryouts.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-sm">Belum ada tryout dalam paket ini.</div>
                ) : (
                  currentPkg.tryouts.map((t) => (
                    <div key={t.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                          <FileEdit className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{t.name}</h4>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1 text-slate-400 text-[11px]"><Clock className="w-3 h-3" /> {t.duration} Menit</span>
                            <span className="flex items-center gap-1 text-slate-400 text-[11px]"><CheckCircle2 className="w-3 h-3" /> {t.totalQuestions} Soal</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold",
                          t.status === "Selesai" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {t.status === "Selesai" ? "✓ Selesai" : "Belum"}
                        </span>
                        <button className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm">
                          <Play className="w-3 h-3" /> Kerjakan
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
