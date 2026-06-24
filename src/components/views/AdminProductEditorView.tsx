import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Save, Plus, X, Video, FileText, FileEdit, Loader2, ShoppingCart, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface AdminProductEditorViewProps {
  onBack: () => void;
  packageId?: string | null;
  editingProduct?: any;
}

export function AdminProductEditorView({ onBack, packageId = null, editingProduct = null }: AdminProductEditorViewProps) {
  const [productType, setProductType] = useState<'SATUAN' | 'BUNDLE' | 'INTENSIF' | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [guideText, setGuideText] = useState("Masuk grup dan baca langkah-langkah panduan Bimbel");
  const [guideUrl, setGuideUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
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
      setOriginalPrice(editingProduct.original_price || null);
      setDescription(editingProduct.description);
        setIsActive(editingProduct.is_active ?? true);
        setCoverImageUrl(editingProduct.cover_image_url || "");
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
        setOriginalPrice(data.original_price || null);
        setDescription(data.description);
        setIsActive(data.is_active);
        setGuideText(data.guide_text || "Masuk grup dan baca langkah-langkah panduan Bimbel");
        setGuideUrl(data.guide_url || "");
        setCoverImageUrl(data.cover_image_url || "");
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

  const handleCoverUpload = async (file: File) => {
    if (!supabase) return;
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB');
      return;
    }
    setUploadingCover(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `package-covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName);
      setCoverImageUrl(urlData.publicUrl);
      toast.success('Gambar berhasil diupload!');
    } catch (err: any) {
      toast.error('Gagal upload: ' + (err.message || 'Coba lagi'));
    } finally {
      setUploadingCover(false);
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
        original_price: originalPrice,
        product_type: productType,
        is_active: isActive,
        guide_text: guideText,
        guide_url: guideUrl,
        cover_image_url: coverImageUrl || null,
      };

      let pkgId = packageId || editingProduct?.id;

      if (pkgId && pkgId !== "") {
        const { error: updateError } = await supabase.from('packages').update(payload).eq('id', pkgId);
        if (updateError) throw updateError;
      } else {
        // Gunakan select('id') secara eksplisit untuk menjamin ID kembali
        const { data: newPkg, error: insertError } = await supabase
          .from('packages')
          .insert([payload])
          .select('id')
          .single();
        
        if (insertError) throw insertError;
        if (!newPkg?.id) throw new Error("Gagal mendapatkan ID produk baru.");
        pkgId = newPkg.id;
      }

      // Sync Contents (Hapus yang lama, pasang yang baru)
      // Gunakan delete hanya jika pkgId valid
      const { error: deleteError } = await supabase.from('package_contents').delete().eq('package_id', pkgId);
      if (deleteError) throw deleteError;

      if (contents.length > 0 && pkgId) {
        const contentsPayload = contents.map((c, idx) => ({
          package_id: pkgId,
          type: c.type,
          title: c.title,
          url: c.url || null,
          tryout_id: c.tryout_id || null,
          zoom_link: c.zoom_link || null,
          recording_url: c.recording_url || null,
          schedule_date: c.schedule_date || null,
          mentor_name: c.mentor_name || null,
          order_index: idx
        }));
        const { error: contentsError } = await supabase.from('package_contents').insert(contentsPayload);
        if (contentsError) throw contentsError;
      }

      toast.success("Produk berhasil disimpan!");
      onBack();
    } catch (err: any) {
      console.error("Error saving product:", err);
      toast.error(`Gagal menyimpan produk: ${err.message || "Terjadi kesalahan tidak dikenal"}`);
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

  const moveContent = (index: number, direction: 'up' | 'down') => {
    const newContents = [...contents];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newContents.length) return;
    [newContents[index], newContents[newIndex]] = [newContents[newIndex], newContents[index]];
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Harga Diskon (RP)</label>
                <input 
                  type="number" 
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-5 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Harga Asli (Coret) - Opsional</label>
                <input 
                  type="number" 
                  value={originalPrice || ""}
                  onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : null)}
                  placeholder="e.g. 150000"
                  className="w-full px-5 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none line-through"
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

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Gambar Header Paket (Opsional)</label>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }}
                />
                {coverImageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200">
                    <img src={coverImageUrl} alt="Cover" className="w-full h-32 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button type="button" onClick={() => coverInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-800 rounded-lg text-xs font-bold">
                        <ImagePlus className="w-3.5 h-3.5" /> Ganti
                      </button>
                      <button type="button" onClick={() => setCoverImageUrl('')} className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-bold">
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="w-full h-28 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors group"
                  >
                    {uploadingCover ? (
                      <><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /><span className="text-xs text-slate-400">Mengupload...</span></>
                    ) : (
                      <><ImagePlus className="w-6 h-6 text-slate-300 group-hover:text-blue-400 transition-colors" /><span className="text-xs text-slate-400 group-hover:text-blue-500">Klik untuk upload gambar</span><span className="text-[10px] text-slate-300">JPG, PNG, WebP &middot; Maks 5MB</span></>
                    )}
                  </button>
                )}
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

              {productType === 'INTENSIF' && (
                <div className="pt-6 border-t border-slate-100 space-y-5">
                  <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Pengaturan Panduan</h4>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Teks Panduan</label>
                    <input 
                      type="text" 
                      value={guideText}
                      onChange={(e) => setGuideText(e.target.value)}
                      placeholder="e.g. Masuk grup WA..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Link Panduan (URL)</label>
                    <input 
                      type="text" 
                      value={guideUrl}
                      onChange={(e) => setGuideUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>
              )}
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
                <div className="space-y-4">
                  {contents.map((item, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
                      {/* Control Buttons */}
                      <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => moveContent(idx, 'up')} disabled={idx === 0} className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:text-blue-600 disabled:opacity-30"><ArrowLeft className="w-3.5 h-3.5 rotate-90" /></button>
                        <button onClick={() => moveContent(idx, 'down')} disabled={idx === contents.length - 1} className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:text-blue-600 disabled:opacity-30"><ArrowLeft className="w-3.5 h-3.5 -rotate-90" /></button>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          item.type === 'tryout' ? 'bg-emerald-50 text-emerald-600' :
                          item.type === 'video' ? 'bg-purple-50 text-purple-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {item.type === 'tryout' ? <FileEdit className="w-5 h-5" /> : 
                           item.type === 'video' ? <Video className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                        </div>

                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-3">
                            <input 
                              type="text" 
                              value={item.title}
                              onChange={(e) => updateContent(idx, 'title', e.target.value)}
                              placeholder={`Judul ${item.type}...`}
                              className="flex-1 bg-transparent border-none text-base font-black focus:ring-0 p-0 text-slate-900 placeholder:text-slate-200"
                            />
                            <button onClick={() => removeContent(idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {item.type === 'tryout' ? (
                              <div className="md:col-span-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Bank Soal</label>
                                <select 
                                  value={item.tryout_id || ""}
                                  onChange={(e) => updateContent(idx, 'tryout_id', e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 py-3 px-4 outline-none transition-all"
                                >
                                  <option value="">-- Pilih Bank Soal --</option>
                                  {allTryouts.map((b: any) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <>
                                <div className="md:col-span-2">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Jadwal</label>
                                  <input 
                                    type="text" 
                                    value={item.schedule_date || ""}
                                    onChange={(e) => updateContent(idx, 'schedule_date', e.target.value)}
                                    placeholder="e.g. Selasa, 19:30 WIB"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 py-3 px-4 outline-none transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                                    {item.type === 'video' ? 'Link Zoom / YT' : 'Link File PDF'}
                                  </label>
                                  <input 
                                    type="text" 
                                    value={item.zoom_link || item.url || ""}
                                    onChange={(e) => updateContent(idx, item.type === 'video' ? 'zoom_link' : 'url', e.target.value)}
                                    placeholder="https://..."
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 py-3 px-4 outline-none transition-all"
                                  />
                                </div>
                                {item.type === 'video' && (
                                  <>
                                    <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Link Rekaman</label>
                                      <input 
                                        type="text" 
                                        value={item.recording_url || ""}
                                        onChange={(e) => updateContent(idx, 'recording_url', e.target.value)}
                                        placeholder="https://..."
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 py-3 px-4 outline-none transition-all"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nama Mentor</label>
                                      <input 
                                        type="text" 
                                        value={item.mentor_name || ""}
                                        onChange={(e) => updateContent(idx, 'mentor_name', e.target.value)}
                                        placeholder="Nama Mentor..."
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 py-3 px-4 outline-none transition-all"
                                      />
                                    </div>
                                  </>
                                )}
                                <div className="md:col-span-2">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Link Mini Tes (Optional)</label>
                                  <select 
                                    value={item.tryout_id || ""}
                                    onChange={(e) => updateContent(idx, 'tryout_id', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 py-3 px-4 outline-none transition-all"
                                  >
                                    <option value="">-- Pilih Mini Tes --</option>
                                    {allTryouts.map((b: any) => (
                                      <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                  </select>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
