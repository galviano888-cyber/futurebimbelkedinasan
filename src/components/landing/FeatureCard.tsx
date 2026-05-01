import { memo } from "react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

export const FeatureCard = memo(function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <div className="p-8 lg:p-10 bg-white/[0.03] rounded-[2rem] lg:rounded-[2.5rem] border border-white/5 hover:border-blue-500/30 transition-all group h-full">
       <div className="w-12 h-12 lg:w-14 lg:h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8 text-blue-500">{icon}</div>
       <h3 className="text-lg lg:text-xl font-black text-white mb-4 group-hover:text-blue-400 group-hover:drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300">{title}</h3>
       <p className="text-sm text-slate-400 leading-relaxed font-medium text-justify">{desc}</p>
    </div>
  );
});
