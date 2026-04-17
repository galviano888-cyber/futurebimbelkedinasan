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
          <Card key={material.id} className="p-6 border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-amber-500 mr-3" />
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {material.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {material.pages} halaman
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {material.category}
              </span>
            </div>

            <Button variant="outline" className="w-full border-slate-200">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
