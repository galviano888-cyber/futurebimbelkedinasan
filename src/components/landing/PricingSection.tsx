import { memo } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PricingSectionProps {
  packages: Array<{
    name: string;
    price: string;
    originalPrice: string;
    benefits: string[];
    isRecommended: boolean;
  }>;
  onEnter: () => void;
}

export const PricingSection = memo(function PricingSection({ packages, onEnter }: PricingSectionProps) {
  return (
    <section id="paket" className="py-32 bg-[#050b18]">
       <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
             <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Pilih Paket Belajarmu</h2>
             <p className="text-slate-400 font-medium">Investasi terbaik untuk masa depan seragam kedinasanmu.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
             {packages.map((p, i) => (
               <motion.div 
                 key={i} 
                 whileHover={{ y: -10 }}
                 className={`relative p-10 rounded-[3rem] border transition-all duration-500 ${p.isRecommended ? 'bg-blue-600 border-blue-500 shadow-2xl shadow-blue-600/20' : 'bg-white/[0.03] border-white/10 hover:border-white/20'}`}
               >
                  {p.isRecommended && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-blue-600 text-[10px] font-black px-4 py-1.5 rounded-full shadow-xl uppercase tracking-widest">Terpopuler</div>
                  )}
                  <h3 className={`text-xl font-black mb-2 text-white`}>{p.name}</h3>
                  <div className="flex flex-col mb-8">
                     {p.originalPrice && p.originalPrice !== "0" && (
                       <span className={`text-sm font-bold line-through decoration-red-500 decoration-2 mb-1 ${p.isRecommended ? 'text-white/50' : 'text-slate-400'}`}>
                         {p.originalPrice}
                       </span>
                     )}
                     <span className={`text-3xl font-black ${p.isRecommended ? 'text-white' : 'text-blue-500'}`}>{p.price}</span>
                  </div>
                  <div className="space-y-4 mb-10">
                     {p.benefits.map((b: string, bi: number) => (
                       <div key={bi} className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${p.isRecommended ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-500'}`}>
                             <Check className="w-3 h-3" />
                          </div>
                          <span className={`text-sm font-medium ${p.isRecommended ? 'text-blue-50' : 'text-slate-400'}`}>{b}</span>
                       </div>
                     ))}
                  </div>
                  <Button 
                    onClick={onEnter} 
                    className={`w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${p.isRecommended ? 'bg-white text-blue-600 hover:bg-slate-50' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'}`}
                  >
                     Daftar Sekarang
                  </Button>
               </motion.div>
             ))}
          </div>
       </div>
    </section>
  );
});
