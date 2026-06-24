import { motion, type HTMLMotionProps } from "framer-motion";

/** Spinner dengan logo FBK kecil di tengah — dipakai di semua loading screen utama */
export function FBKLoader({ text, dark = false }: { text?: string; dark?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative w-12 h-12">
        {/* Ring spinner */}
        <div className={`absolute inset-0 rounded-full border-2 animate-spin ${
          dark
            ? 'border-blue-400/20 border-t-blue-400'
            : 'border-blue-500/20 border-t-blue-500'
        }`} />
        {/* Logo FBK di tengah */}
        <div className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold tracking-tight ${
          dark ? 'text-blue-300' : 'text-blue-600'
        }`}>
          FBK
        </div>
      </div>
      {text && (
        <p className={`text-[12px] ${
          dark ? 'text-blue-200/60' : 'text-slate-400'
        }`}>{text}</p>
      )}
    </div>
  );
}

interface SkeletonProps extends HTMLMotionProps<"div"> {
  className?: string;
  variant?: "rect" | "circle" | "text";
}

export function Skeleton({ className = "", variant = "rect", ...props }: SkeletonProps) {
  const variants = {
    rect: "rounded-xl",
    circle: "rounded-full",
    text: "rounded-lg h-4 w-3/4"
  };

  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className={`bg-slate-200/60 dark:bg-slate-800/40 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 lg:p-8 space-y-5 lg:space-y-10 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 lg:h-8 lg:w-64" />
          <Skeleton className="h-3 w-32 lg:h-4 lg:w-48" />
        </div>
        <Skeleton className="h-10 w-10 lg:h-12 lg:w-12" variant="circle" />
      </div>

      {/* Stats Grid — mobile 2 col, desktop 3 col */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 lg:gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className={`h-24 lg:h-32 w-full rounded-2xl lg:rounded-3xl ${i === 3 ? 'col-span-2 md:col-span-1' : ''}`} />
        ))}
      </div>

      {/* Content — mobile single col */}
      <div className="space-y-3 lg:hidden">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-36 w-full rounded-2xl" />
        ))}
      </div>

      {/* Content Grid — desktop only */}
      <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-3xl" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-[400px] w-full rounded-[2.5rem]" />
        </div>
      </div>
    </div>
  );
}

export function PaketSkeleton() {
  return (
    <div className="p-8 space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-[350px] w-full rounded-[2.5rem]" />
        ))}
      </div>
    </div>
  );
}
