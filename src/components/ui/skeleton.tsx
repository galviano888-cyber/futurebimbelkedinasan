import { motion, type HTMLMotionProps } from "framer-motion";

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
    <div className="p-8 space-y-10 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-12 w-12" variant="circle" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-3xl" />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
