import { memo } from "react";
import { motion } from "framer-motion";

const team = [
  {
    name: "Indra",
    role: "Tentor TIU",
    photo: "/team-indra.jpeg",
    objectPosition: "object-top",
    skor: "SKD 458",
    pencapaian: "Ranking 1 Nasional",
    formasi: "Top 1 Formasi Regular Meteorologi STMKG 2024",
    badge: "TIU",
    badgeColor: "bg-white/10 text-white/70 border-white/15",
  },
  {
    name: "Rhea",
    role: "Tentor TKP",
    photo: "/team-rhea.jpeg",
    objectPosition: "object-top",
    skor: "SKD 468",
    pencapaian: "Top 3 Nasional",
    formasi: "Top 3 Formasi Regular Klimatologi STMKG 2025 · Rekor SKD 505 (2022)",
    badge: "TKP",
    badgeColor: "bg-white/10 text-white/70 border-white/15",
  },
  {
    name: "Syauqi",
    role: "Tentor TWK",
    photo: "/team-syauqi.jpeg",
    objectPosition: "object-top",
    skor: "SKD 439",
    pencapaian: "One Shot Lolos",
    formasi: "Lolos kedinasan dalam 1x percobaan. Spesialis TWK.",
    badge: "TWK",
    badgeColor: "bg-white/10 text-white/70 border-white/15",
  },
  {
    name: "Taviano",
    role: "Admin & Founder",
    photo: "/team-taviano.jpeg",
    objectPosition: "object-[center_20%]",
    skor: "SKD 433",
    pencapaian: "Pengelola Platform",
    formasi: "Membangun dan mengelola platform FBK dari awal.",
    badge: "Admin",
    badgeColor: "bg-white/10 text-white/70 border-white/15",
  },
];

export const TeamSection = memo(function TeamSection() {
  return (
    <section id="tim" className="relative py-20 lg:py-28 bg-[#0c2148] border-t border-white/[0.07]">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        {/* Section header */}
        <div className="max-w-2xl mb-12 lg:mb-16 text-center mx-auto">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-8 bg-blue-400/50" />
            <span className="text-[11px] font-bold text-blue-300 tracking-widest uppercase">Tim Kami</span>
            <span className="h-px w-8 bg-blue-400/50" />
          </div>
          <h2 className="text-[28px] lg:text-[40px] font-extrabold text-white tracking-tight leading-[1.12]">
            Belajar dari yang sudah terbukti lolos
          </h2>
          <p className="text-[15px] text-blue-100/65 mt-4 leading-relaxed">
            Tentor kami adalah mereka yang telah melewati seleksi sesungguhnya dan tahu persis apa yang dibutuhkan untuk lolos.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col rounded-2xl bg-white/[0.05] border border-white/[0.1] hover:border-blue-400/25 transition-all duration-300 overflow-hidden group"
            >
              {/* Foto */}
              <div className="relative h-52 lg:h-60 overflow-hidden shrink-0">
                <img
                  src={member.photo}
                  alt={member.name}
                  className={`w-full h-full object-cover ${member.objectPosition} group-hover:scale-105 transition-transform duration-500`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c2148]/90 via-[#0c2148]/20 to-transparent" />
                {/* Badge */}
                <span className={`absolute top-3 left-3 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${member.badgeColor}`}>
                  {member.badge}
                </span>
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="text-[15px] font-bold text-white leading-none">{member.name}</p>
                <p className="text-[12px] text-blue-300 mt-0.5 mb-3">{member.role}</p>

                {(member.skor || member.pencapaian) && (
                  <div className="mb-2">
                    {member.skor && <span className="text-[13px] font-bold text-white">{member.skor}</span>}
                    {member.pencapaian && (
                      <span className={`text-[11px] font-medium text-blue-200/70 ${member.skor ? 'ml-2' : ''}`}>{member.pencapaian}</span>
                    )}
                  </div>
                )}

                <p className="text-[11.5px] text-blue-100/55 leading-relaxed">{member.formasi}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});
