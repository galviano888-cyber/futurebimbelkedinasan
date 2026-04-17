import { useState } from "react";
import { 
  FileText, 
  PlaySquare, 
  FileEdit, 
  ChevronDown,
  Library
} from "lucide-react";
import { cn } from "@/lib/utils";

// Data dummy untuk contoh paket yang dibeli
const purchasedPackages = [
  {
    id: "paket-1",
    title: "Program Intensif SKD Batch 1",
    items: [
      { type: "file", title: "Materi TWK Lengkap (PDF)" },
      { type: "file", title: "Rumus Cepat TIU (PDF)" },
      { type: "video", title: "Rekaman Zoom: Bedah Soal HOTS" },
      { type: "tryout", title: "Tryout Premium SKD 1" },
    ]
  },
  {
    id: "paket-2",
    title: "Fokus SKD CPNS",
    items: [
      { type: "file", title: "Materi Dasar CPNS" },
      { type: "video", title: "Bimbel #8 - 2023" },
    ]
  }
];

const getIconForType = (type: string) => {
  switch (type) {
    case "file":
      return <FileText className="w-5 h-5 text-blue-500" />;
    case "video":
      return <PlaySquare className="w-5 h-5 text-blue-500" />;
    case "tryout":
      return <FileEdit className="w-5 h-5 text-emerald-500" />;
    default:
      return <FileText className="w-5 h-5 text-slate-400" />;
  }
};

export function PaketSayaView() {
  const [openPackages, setOpenPackages] = useState<Record<string, boolean>>({
    "paket-1": true, // Buka paket pertama secara default
  });

  const togglePackage = (id: string) => {
    setOpenPackages(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="mb-7">
        <h1 className="text-slate-900 font-bold text-2xl tracking-tight flex items-center gap-3">
          <Library className="w-7 h-7 text-blue-500" />
          Paket Saya
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Akses seluruh materi, rekaman kelas, dan tryout dari paket yang telah Anda beli di sini.
        </p>
      </div>

      <div className="space-y-4">
        {purchasedPackages.map((pkg) => {
          const isOpen = openPackages[pkg.id];
          
          return (
            <div 
              key={pkg.id} 
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <button
                onClick={() => togglePackage(pkg.id)}
                className="w-full flex items-center justify-between p-5 bg-white hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-slate-700" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 text-left">
                    {pkg.title}
                  </h2>
                </div>
                <ChevronDown 
                  className={cn(
                    "w-5 h-5 text-slate-400 transition-transform duration-300",
                    isOpen ? "rotate-180" : ""
                  )} 
                />
              </button>

              <div 
                className={cn(
                  "grid transition-all duration-300 ease-in-out",
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <div className="p-5 pt-0 bg-slate-50/50 border-t border-slate-100">
                    <div className="space-y-2 mt-4">
                      {pkg.items.map((item, idx) => (
                        <button 
                          key={idx}
                          className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                            {getIconForType(item.type)}
                          </div>
                          <span className="font-semibold text-slate-700 group-hover:text-blue-600 transition-colors text-left flex-1">
                            {item.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
