import { memo } from "react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

export const FeatureCard = memo(function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <div className="p-7 bg-blue-950/30 rounded-2xl border border-blue-800/30 hover:border-blue-700/50 hover:bg-blue-950/40 transition-colors duration-300 h-full flex flex-col gap-5">
      <div className="w-10 h-10 bg-blue-600/15 rounded-xl flex items-center justify-center text-blue-300 shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-[15px] font-semibold text-white mb-2 leading-snug">{title}</h3>
        <p className="text-[13px] text-blue-200/50 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
});
