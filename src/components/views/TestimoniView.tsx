import { Card } from "@/components/ui/card";
import { Quote } from "lucide-react";

const dummyTestimonials = [
  {
    id: 1,
    name: "Siswa FBK 1",
    role: "Catar Kedinasan 2026",
    content: "Materi di FBK sangat lengkap dan terstruktur. Mentornya juga sangat sabar dalam menjelaskan materi yang sulit dipahami.",
    avatar: "S1"
  },
  {
    id: 2,
    name: "Siswa FBK 2",
    role: "Lulus SKD 2025",
    content: "Tryout di sini soal-soalnya sangat mirip dengan SKD aslinya. Sangat membantu saya beradaptasi dengan waktu dan tipe soal HOTS.",
    avatar: "S2"
  },
  {
    id: 3,
    name: "Siswa FBK 3",
    role: "Pejuang Sekolah Kedinasan",
    content: "Grup diskusi belajarnya sangat aktif. Saya bisa bertanya kapan saja dan selalu mendapat jawaban yang memuaskan dari mentor maupun teman-teman.",
    avatar: "S3"
  }
];

export function TestimoniView() {
  return (
    <div className="space-y-6">
      <div className="mb-7">
        <h1 className="text-slate-900 font-bold text-2xl tracking-tight">
          Testimoni Alumni
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Kisah sukses dan ulasan dari para siswa yang telah belajar bersama FBK.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dummyTestimonials.map((testimonial) => (
          <Card key={testimonial.id} className="p-6 bg-slate-900 border-slate-800 relative">
            <Quote className="absolute top-6 right-6 w-8 h-8 text-slate-800" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-slate-900 font-bold text-sm">
                {testimonial.avatar}
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">
                  {testimonial.name}
                </h3>
                <p className="text-slate-400 text-xs">
                  {testimonial.role}
                </p>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed relative z-10">
              "{testimonial.content}"
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
