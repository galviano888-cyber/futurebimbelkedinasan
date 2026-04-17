import { useState, useEffect } from "react";
import { 
  FileText, 
  PlaySquare, 
  FileEdit, 
  ChevronDown,
  Library,
  Loader2,
  PackageX
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

interface PackageContent {
  id: string;
  type: string;
  title: string;
  url: string | null;
}

interface Package {
  id: string;
  title: string;
  description: string;
  contents: PackageContent[];
}

interface UserPackage {
  id: string;
  activated_at: string;
  package: Package;
}

const getIconForType = (type: string) => {
  switch (type) {
    case "file":
      return <FileText className="w-5 h-5 text-blue-500" />;
    case "video":
      return <PlaySquare className="w-5 h-5 text-blue-500" />;
    case "tryout":
      return <FileEdit className="w-5 h-5 text-emerald-500" />;
    default:
      return <FileText className="w-5 h-5 text-slate-400" />;
  }
};

interface PaketSayaProps {
  onNavigate?: (page: string) => void;
}

export function PaketSayaView({ onNavigate }: PaketSayaProps) {
  const [openPackages, setOpenPackages] = useState<Record<string, boolean>>({});
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPackages() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Ambil paket yang dimiliki user beserta isinya
        const { data, error } = await supabase
          .from('user_packages')
          .select(`
            id,
            activated_at,
            package:packages (
              id,
              title,
              description,
              contents:package_contents (
                id,
                type,
                title,
                url,
                order_index
              )
            )
          `)
          .eq('user_id', user.id);

        if (error) throw error;

        // Mengurutkan konten berdasarkan order_index
        const formattedData = (data as any[] || []).map(up => ({
          ...up,
          package: {
            ...up.package,
            contents: (up.package.contents || []).sort((a: any, b: any) => a.order_index - b.order_index)
          }
        })) as UserPackage[];

        setUserPackages(formattedData);

        // Buka paket pertama secara otomatis jika ada
        if (formattedData.length > 0) {
          setOpenPackages({ [formattedData[0].package.id]: true });
        }
      } catch (error) {
        console.error("Gagal mengambil paket:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPackages();
  }, []);

  const togglePackage = (id: string) => {
    setOpenPackages(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="mb-7">
        <h1 className="text-slate-900 font-bold text-2xl tracking-tight flex items-center gap-3">
          <Library className="w-7 h-7 text-blue-500" />
          Paket Saya
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Akses seluruh materi, rekaman kelas, dan tryout dari paket yang telah Anda beli di sini.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-500 mt-4 text-sm font-medium">Memuat paket Anda...</p>
        </div>
      ) : userPackages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm text-center px-6">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <PackageX className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Paket</h2>
          <p className="text-slate-500 max-w-md text-sm mb-6">
            Anda belum memiliki akses ke paket pembelajaran apapun. Silakan kunjungi katalog untuk melihat paket yang tersedia.
          </p>
          <button 
            onClick={() => onNavigate?.('Paket dan Tryout SKD')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-full transition-colors"
          >
            Lihat Katalog Paket
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {userPackages.map((up) => {
            const pkg = up.package;
            const isOpen = openPackages[pkg.id];
            
            return (
              <div 
                key={up.id} 
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <button
                  onClick={() => togglePackage(pkg.id)}
                  className="w-full flex items-center justify-between p-5 bg-white hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-bold text-slate-900">
                        {pkg.title}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {pkg.contents.length} Modul Pembelajaran
                      </p>
                    </div>
                  </div>
                  <ChevronDown 
                    className={cn(
                      "w-5 h-5 text-slate-400 transition-transform duration-300",
                      isOpen ? "rotate-180" : ""
                    )} 
                  />
                </button>

                <div 
                  className={cn(
                    "grid transition-all duration-300 ease-in-out",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="p-5 pt-0 bg-slate-50/50 border-t border-slate-100">
                      <div className="space-y-2 mt-4">
                        {pkg.contents.map((item) => (
                          <button 
                            key={item.id}
                            className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                              {getIconForType(item.type)}
                            </div>
                            <span className="font-semibold text-slate-700 group-hover:text-blue-600 transition-colors text-left flex-1">
                              {item.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
