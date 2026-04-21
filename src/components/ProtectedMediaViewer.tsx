import { useState } from "react";
import { X, Shield, Loader2, AlertCircle, Video, FileText } from "lucide-react";

interface ProtectedMediaViewerProps {
  url: string;
  title: string;
  type: 'file' | 'video';
  onClose: () => void;
}

export function ProtectedMediaViewer({ url, title, type, onClose }: ProtectedMediaViewerProps) {
  const [loading, setLoading] = useState(true);

  // Helper to detect and format URLs for embedding
  const getEmbedUrl = (originalUrl: string) => {
    // 1. YouTube detection
    if (originalUrl.includes('youtube.com/watch?v=')) {
      const id = originalUrl.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    }
    if (originalUrl.includes('youtu.be/')) {
      const id = originalUrl.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    }

    // 2. Google Drive detection
    if (originalUrl.includes('drive.google.com')) {
      // Convert /view or /edit to /preview for embedding
      let embedLink = originalUrl;
      if (embedLink.includes('/view')) {
        embedLink = embedLink.replace('/view', '/preview');
      } else if (embedLink.includes('/edit')) {
        embedLink = embedLink.replace('/edit', '/preview');
      } else if (!embedLink.includes('/preview')) {
        // If it's just the file link, append /preview
        if (embedLink.endsWith('/')) embedLink += 'preview';
        else embedLink += '/preview';
      }
      return embedLink;
    }

    // 3. Google Docs detection
    if (originalUrl.includes('docs.google.com')) {
       // Convert to preview mode which is embed friendly
       if (originalUrl.includes('/edit')) {
         return originalUrl.replace('/edit', '/preview');
       }
       return originalUrl;
    }

    // 4. Default for other files (PDFs etc)
    if (type === 'file') return `${originalUrl}#toolbar=0&navpanes=0&scrollbar=0`;
    
    return originalUrl;
  };

  const embedUrl = getEmbedUrl(url);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col bg-slate-950/98 backdrop-blur-xl animate-in fade-in duration-500"
      onContextMenu={handleContextMenu}
    >
      {/* Header Viewer */}
      <div className="flex items-center justify-between px-8 py-5 bg-white/5 border-b border-white/10 shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
            {type === 'video' ? <Video className="w-6 h-6 text-white" /> : <FileText className="w-6 h-6 text-white" />}
          </div>
          <div>
            <h3 className="text-white font-black text-lg tracking-tight leading-none">{title}</h3>
            <div className="flex items-center gap-2 mt-2">
               <Shield className="w-3 h-3 text-blue-400" />
               <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">Protected Mode Active</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="p-3 text-white/40 hover:text-white hover:bg-white/10 rounded-2xl transition-all group"
        >
          <X className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* Viewer Area */}
      <div className="flex-1 relative overflow-hidden group bg-black/40">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-950">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
              <div className="absolute inset-0 blur-2xl bg-blue-500/20 rounded-full animate-pulse" />
            </div>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Mendekripsi Materi...</p>
          </div>
        )}
        
        {/* Anti-screenshot/copy Overlay (Subtle Watermark) */}
        <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.02] flex flex-wrap gap-24 p-24 content-start select-none overflow-hidden rotate-12">
           {Array.from({ length: 40 }).map((_, i) => (
             <span key={i} className="text-white font-black text-5xl uppercase whitespace-nowrap">FUTURE BIMBEL KEDINASAN</span>
           ))}
        </div>

        {/* The Media Iframe */}
        <iframe 
          src={embedUrl} 
          className="w-full h-full border-none shadow-2xl"
          onLoad={() => setLoading(false)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
        
        {/* Warning Banner on Hover */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-red-600/90 backdrop-blur-md text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-2xl shadow-red-600/40 translate-y-10 group-hover:translate-y-0 border border-red-500/30">
          <AlertCircle className="w-5 h-5" /> 
          Penggandaan materi tanpa izin dapat berakibat sanksi hukum sesuai ketentuan yang berlaku.
        </div>
      </div>

      {/* Footer / Protection Notice */}
      <div className="px-8 py-5 bg-black/60 backdrop-blur-md text-center shrink-0 border-t border-white/5">
        <p className="text-[10px] text-white/20 font-black tracking-[0.4em] uppercase">
          {type === 'video' ? 'Recorded Live Session' : 'Exclusive E-Book Material'} &bull; Hak Cipta &copy; 2026 Future Bimbel Kedinasan
        </p>
      </div>
    </div>
  );
}
