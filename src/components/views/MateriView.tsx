import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";

const dummyMaterials = [
  {
    id: 1,
    title: "Panduan TWK (Tes Wawasan Kebangsaan)",
    category: "TWK",
    pages: 45,
  },
  {
    id: 2,
    title: "Modul TIU (Tes Intelegensia Umum)",
    category: "TIU",
    pages: 52,
  },
  {
    id: 3,
    title: "Bahan TKP (Tes Karakteristik Pribadi)",
    category: "TKP",
    pages: 38,
  },
  {
    id: 4,
    title: "Ringkasan Persiapan CPNS 2024",
    category: "Umum",
    pages: 60,
  },
];

export function MateriView() {
  return (
    <div className="space-y-6">
      <div className="mb-7">
        <h1 className="text-slate-900 font-bold text-2xl tracking-tight">
          Materi Belajar
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Akses materi pembelajaran dan panduan persiapan
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dummyMaterials.map((material) => (
          <Card key={material.id} className="p-6 bg-slate-900 border-slate-800 hover:border-blue-500 hover:shadow-lg transition-all duration-200 group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-slate-800 p-2.5 rounded-lg mr-3 group-hover:bg-slate-700 transition-colors">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white line-clamp-1">
                    {material.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    {material.pages} halaman
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <span className="inline-flex items-center px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-md border border-slate-700">
                {material.category}
              </span>
            </div>

            <Button variant="outline" className="w-full border-slate-700 bg-transparent text-slate-300 hover:border-blue-500 hover:text-blue-500 hover:bg-slate-800 transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
