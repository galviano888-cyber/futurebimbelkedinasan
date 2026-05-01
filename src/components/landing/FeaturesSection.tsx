import { memo } from "react";
import { GraduationCap, Zap, BookOpen } from "lucide-react";
import { FeatureCard } from "./FeatureCard";

interface FeaturesSectionProps {
  features: Array<{
    title: string;
    desc: string;
  }>;
}

export const FeaturesSection = memo(function FeaturesSection({ features }: FeaturesSectionProps) {
  return (
    <section id="fitur" className="pt-16 pb-24 bg-[#0a1425]/50 content-auto">
      <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {features.map((f, i) => (
               <FeatureCard 
                 key={i}
                 icon={i === 0 ? <GraduationCap className="w-6 h-6 text-blue-600" /> : i === 1 ? <Zap className="w-6 h-6 text-blue-600" /> : <BookOpen className="w-6 h-6 text-blue-600" />} 
                 title={f.title} 
                 desc={f.desc} 
               />
             ))}
          </div>
      </div>
    </section>
  );
});
