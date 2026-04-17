import { GraduationCap } from "lucide-react";

function Pulse({ className }: { className?: string }) {
  return (
    <div className={`bg-slate-200 animate-pulse rounded-lg ${className ?? ""}`} />
  );
}

export function LoadingSkeleton() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <div className="hidden lg:flex w-64 flex-col bg-[#0a192f] flex-shrink-0">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-8 bg-white/20 rounded animate-pulse" />
            <div className="h-2 w-28 bg-white/10 rounded animate-pulse" />
          </div>
        </div>

        <div className="flex-1 px-3 py-6 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            >
              <div
                className="w-4 h-4 rounded bg-white/10 animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              />
              <div
                className="h-3 rounded bg-white/10 animate-pulse"
                style={{
                  width: `${60 + Math.random() * 40}%`,
                  animationDelay: `${i * 80}ms`,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-16 bg-white border-b border-slate-200 flex items-center px-8 gap-4">
          <div className="flex-1 space-y-1.5">
            <Pulse className="h-4 w-36" />
            <Pulse className="h-2.5 w-24" />
          </div>
          <div className="flex items-center gap-3">
            <Pulse className="w-9 h-9 rounded-lg" />
            <Pulse className="w-32 h-9 rounded-xl" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mb-6">
            <Pulse className="h-7 w-56 mb-1.5" />
            <Pulse className="h-4 w-80" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Pulse className="h-2.5 w-28" />
                    <Pulse className="h-8 w-16" />
                    <Pulse className="h-2 w-24" />
                  </div>
                  <Pulse className="w-12 h-12 rounded-xl" />
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <Pulse className="h-5 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="space-y-1.5">
                  <Pulse className="h-5 w-52" />
                  <Pulse className="h-3 w-40" />
                </div>
                <div className="flex gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Pulse key={i} className="h-4 w-12 rounded-full" />
                  ))}
                </div>
              </div>
              <Pulse className="h-[350px] w-full rounded-xl" />
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-2 w-16 bg-white/10 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-white/20 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-5 w-14 bg-white/10 rounded-full animate-pulse" />
              </div>
              <div className="h-5 w-full bg-white/10 rounded animate-pulse" />
              <div className="h-5 w-4/5 bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-white/5 rounded animate-pulse" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-16 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-16 bg-white/5 rounded-xl animate-pulse" />
              </div>
              <div className="h-11 bg-blue-500/30 rounded-xl animate-pulse" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="space-y-1.5">
                <Pulse className="h-5 w-28" />
                <Pulse className="h-3 w-36" />
              </div>
              <Pulse className="h-9 w-32 rounded-xl" />
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 py-2"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <Pulse className="h-4 w-4 rounded" />
                  <Pulse className="h-4 w-24 rounded" />
                  <Pulse className="h-4 flex-1 rounded" />
                  <Pulse className="h-6 w-10 rounded-md" />
                  <Pulse className="h-6 w-10 rounded-md" />
                  <Pulse className="h-6 w-10 rounded-md" />
                  <Pulse className="h-6 w-14 rounded-md" />
                  <Pulse className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
