import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpandableDescProps {
  text: string;
  maxVisible?: number;
  className?: string;
}

/**
 * Menampilkan teks deskripsi sebagai checklist.
 * Teks dipecah berdasarkan koma atau newline.
 * Jika item > maxVisible, sisanya disembunyikan dengan tombol expand.
 */
export function ExpandableDesc({ text, maxVisible = 3, className }: ExpandableDescProps) {
  const [expanded, setExpanded] = useState(false);

  const items = text
    .split(/,|\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const isLong = items.length > maxVisible;
  const visible = !expanded && isLong ? items.slice(0, maxVisible) : items;

  return (
    <div className={cn("mb-3 flex-1 space-y-1.5", className)}>
      {visible.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="w-4 h-4 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0 mt-px">
            <Check className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" strokeWidth={3} />
          </span>
          <span className="text-[12px] text-slate-600 dark:text-slate-400 leading-snug">{item}</span>
        </div>
      ))}
      {isLong && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="flex items-center gap-1 mt-1 text-[11px] text-blue-500 hover:text-blue-600 font-medium transition-colors"
        >
          {expanded ? "Sembunyikan" : `+${items.length - maxVisible} lainnya`}
          <ChevronDown className={cn("w-3 h-3 transition-transform", expanded && "rotate-180")} />
        </button>
      )}
    </div>
  );
}
