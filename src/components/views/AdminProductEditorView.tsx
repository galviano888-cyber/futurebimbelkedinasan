import { useState, useEffect } from "react";
import { ArrowLeft, Save, Plus, X, Video, FileText, FileEdit, Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

interface AdminProductEditorViewProps {
  onBack: () => void;
  packageId?: string | null;
  editingProduct?: any;
}

export function AdminProductEditorView({ onBack, packageId = null, editingProduct = null }: AdminProductEditorViewProps) {
  const [productType, setProductType] = useState<'SATUAN' | 'BUNDLE' | 'INTENSIF' | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allTryouts, setAllTryouts] = useState<any[]>([]);

  useEffect(() => {
    fetchTryouts();
    if (packageId) {
      fetchProductDetails();
    } else if (editingProduct) {
      // Fallback if full object is passed
      setProductType(editingProduct.product_type);
      setTitle(editingProduct.title);
      setPrice(editingProduct.price);
      setDescription(editingProduct.description);
      setIsActive(editingProduct.is_active ?? true);
      setContents(editingProduct.contents || []);
    }
  }, [packageId, editingProduct]);

  const fetchProductDetails = async () => {
    if (!supabase || !packageId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('packages')
        .select(`
          *,
          contents:package_contents(*)
        `)
        .eq('id', packageId)
        .single();
      
      if (error) throw error;
      if (data) {
        setProductType(data.product_type);
        setTitle(data.title);
        setPrice(data.price);
        setDescription(data.description);
        setIsActive(data.is_active);
        // Sort contents by order_index if available
        const sortedContents = data.contents ? [...data.contents].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)) : [];
        setContents(sortedContents);
      }
    } catch (err) {
      console.error("Error fetching product details:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTryouts = async () => {
    if (!supabase) return;
    try {
      // Fetch all to be safe, then filter in JS
      const { data, error } = await supabase
        .from('tryout_packages')
        .select('id, name, status');
      
      if (error) throw error;
      if (data) {
        const published = data.filter(p => p.status === 'Published');
        setAllTryouts(published);
      }
    } catch (err) {
      console.error("Error fetching tryouts for product editor:", err);
    }
  };

  const handleSave = async () => {
    if (!supabase) return;
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        price,
        product_type: productType,
        is_active: isActive
      };

      let pkgId = packageId || editingProduct?.id;

      if (packageId || editingProduct) {
        const { error: updateError } = await supabase.from('packages').update(payload).eq('id', pkgId);
        if (updateError) throw updateError;
      } else {
        const { data: newPkg, error: insertError } = await supabase.from('packages').insert([payload]).select().single();
        if (insertError) throw insertError;
        pkgId = newPkg.id;
      }

      // Sync Contents (Hapus yang lama, pasang yang baru)
      const { error: deleteError } = await supabase.from('package_contents').delete().eq('package_id', pkgId);
      if (deleteError) throw deleteError;

      if (contents.length > 0) {
        const contentsPayload = contents.map((c, idx) => ({
          package_id: pkgId,
          type: c.type,
          title: c.title,
          url: c.url || null,
          tryout_id: c.tryout_id || null,
          zoom_link: c.zoom_link || null,
          recording_url: c.recording_url || null,
          order_index: idx
        }));
        const { error: contentsError } = await supabase.from('package_contents').insert(contentsPayload);
        if (contentsError) throw contentsError;
      }

      alert("Produk berhasil disimpan!");
      onBack();
    } catch (err: any) {
      console.error("Error saving product:", err);
      alert(`Gagal menyimpan produk: ${err.message || "Terjadi kesalahan tidak dikenal"}`);
    } finally {
      setSaving(false);
    }
  };

  const addContent = (type: 'tryout' | 'video' | 'file') => {
    setContents([...contents, { type, title: "", url: "", tryout_id: null }]);
  };

  const removeContent = (index: number) => {
    setContents(contents.filter((_, i) => i !== index));
  };

  const updateContent = (index: number, field: string, value: any) => {
    const newContents = [...contents];
    newContents[index] = { ...newContents[index], [field]: value };
    setContents(newContents);
  };

  // ============================
  // SELECTION SCREEN
  // ============================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-medium">Memuat data produk...</p>
      </div>
    );
  }

  if (!productType) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Pilih Tipe Paket Belajar</h2>
          <p className="text-slate-500 text-sm mt-1">Tentukan jenis produk yang ingin Anda buat untuk dijual ke siswa.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={() => setProductType('SATUAN')}
            className="bg-white border-2 border-slate-100 hover:border-blue-500 p-8 rounded-[2.5rem] text-left transition-all group hover:shadow-2xl hover:shadow-blue-500/10"
          >
            <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:rotate-6 transition-all duration-500">
              <FileEdit className="w-8 h-8 text-emerald-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Tryout Satuan</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Jual satu buah tryout spesifik dari Bank Soal. Cocok untuk paket eceran.</p>
          </button>

          <button 
            onClick={() => setProductType('BUNDLE')}
            className="bg-white border-2 border-slate-100 hover:border-blue-500 p-8 rounded-[2.5rem] text-left transition-all group hover:shadow-2xl hover:shadow-blue-500/10"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:rotate-6 transition-all duration-500">
              <Plus className="w-8 h-8 text-blue-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Bundle Tryout</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Gabungkan beberapa Bank Soal sekaligus ke dalam satu harga paket lebih hemat.</p>
          </button>

          <button 
            onClick={() => setProductType('INTENSIF')}
            className="bg-white border-2 border-slate-100 hover:border-blue-500 p-8 rounded-[2.5rem] text-left transition-all group hover:shadow-2xl hover:shadow-blue-500/10"
          >
            <div className="w-16 h-16 bg-purple-50 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-purple-500 group-hover:rotate-6 transition-all duration-500">
              <Video className="w-8 h-8 text-purple-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Paket Intensif</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Program bimbel lengkap berisi Materi PDF, Link Zoom, dan bonus Tryout.</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <button onClick={() => setProductType(null)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-2 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Pemilihan Tipe
          </button>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            {editingProduct ? "Edit" : "Buat"} {productType === 'INTENSIF' ? 'Paket Intensif' : productType === 'BUNDLE' ? 'Bundle Tryout' : 'Tryout Satuan'}
          </h2>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Menyimpan..." : "Simpan Produk"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Kolom Kiri: Info Dasar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-500" /> Informasi Produk
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Judul Paket</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: SKD Pretest Batch 1"
                  className="w-full px-5 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Harga (RP)</label>
                <input 
                  type="number" 
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-5 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Deskripsi Singkat</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Jelaskan keunggulan paket ini..."
                  className="w-full px-5 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all resize-none outline-none"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer group mt-4">
                <input 
                  type="checkbox" 
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                />
                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Tampilkan di Katalog</span>
              </label>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Daftar Isi Paket */}
        <div className="lg:col-span-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[500px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <X className="w-5 h-5 text-blue-500 rotate-45" /> Daftar Isi Paket
              </h3>
              
              <div className="flex gap-2">
                {(productType === 'SATUAN' || productType === 'BUNDLE' || productType === 'INTENSIF') && (
                  <Button variant="outline" size="sm" onClick={() => addContent('tryout')} className="rounded-xl font-bold gap-1.5 border-slate-200 text-slate-600">
                    <FileEdit className="w-3.5 h-3.5" /> Tryout
                  </Button>
                )}
                {productType === 'INTENSIF' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => addContent('video')} className="rounded-xl font-bold gap-1.5 border-slate-200 text-slate-600">
                      <Video className="w-3.5 h-3.5" /> Video/Zoom
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addContent('file')} className="rounded-xl font-bold gap-1.5 border-slate-200 text-slate-600">
                      <FileText className="w-3.5 h-3.5" /> File PDF
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {contents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-100 rounded-[2rem]">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Plus className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">Belum ada konten. Klik tombol di atas untuk menambah.</p>
                </div>
              ) : (
                contents.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:border-blue-200 transition-all group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            item.type === 'tryout' ? 'bg-emerald-100 text-emerald-700' :
                            item.type === 'video' ? 'bg-purple-100 text-purple-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {item.type}
                          </span>
                          <input 
                            type="text" 
                            value={item.title}
                            onChange={(e) => updateContent(idx, 'title', e.target.value)}
                            placeholder={`Judul ${item.type}...`}
                            className="flex-1 bg-transparent border-none text-sm font-bold focus:ring-0 p-0 text-slate-900 placeholder:text-slate-300"
                          />
                        </div>

                        {item.type === 'tryout' ? (
                          <select 
                            value={item.tryout_id || ""}
                            onChange={(e) => updateContent(idx, 'tryout_id', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 py-3 px-4 outline-none"
                          >
                            <option value="" className="text-slate-400">-- Pilih Bank Soal (Published) --</option>
                            {allTryouts.map((b: any) => (
                              <option key={b.id} value={b.id} className="text-slate-900">{b.name}</option>
                            ))}
                          </select>
                        ) : item.type === 'video' ? (
                          <div className="grid grid-cols-2 gap-4">
                            <input 
                              type="text" 
                              value={item.zoom_link || ""}
                              onChange={(e) => updateContent(idx, 'zoom_link', e.target.value)}
                              placeholder="Link Zoom (Live)"
                              className="w-full bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 py-3 px-4 outline-none"
                            />
                            <input 
                              type="text" 
                              value={item.recording_url || ""}
                              onChange={(e) => updateContent(idx, 'recording_url', e.target.value)}
                              placeholder="Link Rekaman"
                              className="w-full bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 py-3 px-4 outline-none"
                            />
                          </div>
                        ) : (
                          <input 
                            type="text" 
                            value={item.url || ""}
                            onChange={(e) => updateContent(idx, 'url', e.target.value)}
                            placeholder="Link Download PDF (GDrive/S3)"
                            className="w-full bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 py-3 px-4 outline-none"
                          />
                        )}
                      </div>
                      <button 
                        onClick={() => removeContent(idx)}
                        className="p-2 bg-white text-slate-400 hover:text-red-500 rounded-xl transition-colors shadow-sm border border-slate-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
