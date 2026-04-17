import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Clock, Zap } from "lucide-react";

const dummyTests = [
  {
    id: 1,
    title: "Paket SKD CPNS Gelombang I",
    duration: 120,
    questions: 110,
    description: "Latihan lengkap TWK, TIU, dan TKP untuk CPNS",
  },
  {
    id: 2,
    title: "Paket Simulasi SKD Nasional",
    duration: 120,
    questions: 110,
    description: "Simulasi resmi dengan standar ujian nasional",
  },
  {
    id: 3,
    title: "Paket SKD Kedinasan Premium",
    duration: 120,
    questions: 110,
    description: "Persiapan khusus untuk ujian kedinasan",
  },
];

export function TryoutView() {
  return (
    <div className="space-y-6">
      <div className="mb-7">
        <h1 className="text-slate-900 font-bold text-2xl tracking-tight">
          Tryout SKD
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Pilih paket tryout yang ingin kamu kerjakan
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dummyTests.map((test) => (
          <Card key={test.id} className="p-6 border-slate-200 hover:shadow-md transition-shadow">
            <div className="mb-4">
              <h3 className="font-semibold text-slate-900 mb-2">
                {test.title}
              </h3>
              <p className="text-slate-500 text-sm">
                {test.description}
              </p>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center text-slate-600 text-sm">
                <BookOpen className="w-4 h-4 mr-2" />
                {test.questions} Soal
              </div>
              <div className="flex items-center text-slate-600 text-sm">
                <Clock className="w-4 h-4 mr-2" />
                {test.duration} Menit
              </div>
            </div>

            <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white">
              <Zap className="w-4 h-4 mr-2" />
              Mulai
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
