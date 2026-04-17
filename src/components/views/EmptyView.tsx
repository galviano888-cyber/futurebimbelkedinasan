interface EmptyViewProps {
  title: string;
}

export function EmptyView({ title }: EmptyViewProps) {
  return (
    <div className="space-y-6">
      <div className="mb-7">
        <h1 className="text-slate-900 font-bold text-2xl tracking-tight">
          {title}
        </h1>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-16 text-center">
        <p className="text-slate-500 font-medium">
          Konten sedang dipersiapkan...
        </p>
      </div>
    </div>
  );
}
