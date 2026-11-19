import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Save, Plus, Trash2, Layout, HelpCircle, Loader2, Phone, CreditCard, Zap, Type } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_LANDING_SECTIONS, mergeLandingSections, type LandingSections } from "@/lib/landingSections";

export function AdminLandingPageEditorView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings State
  const [hero, setHero] = useState({ 
    badge: "Persiapan Masuk Sekolah Kedinasan",
    title: "Langkahmu menuju | sekolah kedinasan.",
    subtitle: "Temani persiapanmu dengan latihan terarah, simulasi seleksi, dan tinjauan hasil belajar di satu platform.",
    cta: "Lihat pilihan persiapan",
    image: "https://images.unsplash.com/photo-1523240715632-d984bb4b990a?q=80&w=2070&auto=format&fit=crop"
  });
  const [features, setFeatures] = useState<any[]>([
    { title: "Persiapan seleksi kedinasan", desc: "Gunakan latihan dan tryout yang tersedia untuk membangun rutinitas persiapan masuk sekolah kedinasan." },
    { title: "Latihan terarah", desc: "Mulai dari latihan SKD seperti TWK, TIU, dan TKP sesuai materi yang ingin kamu pelajari." },
    { title: "Simulasi dan tinjauan hasil", desc: "Kerjakan tryout dengan batas waktu, lalu tinjau skor dan pembahasan yang tersedia." }
  ]);
  const [_testimonials, setTestimonials] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [contacts, setContacts] = useState({ whatsapp: "6287753646617", instagram: "futurebimbelkedinasan", tiktok: "futurebimbelkedinasan" });
  const [colors, setColors] = useState({
    badge: "#3b82f6",
    title: "#ffffff",
    subtitle: "#94a3b8",
    logo: "#3b82f6",
    cta: "#2563eb"
  });
  const [bank, setBank] = useState({ name: "BRI", number: "0356 0108 9005 505", owner: "Galih Oktaviano" });
  const [packages, setPackages] = useState<any[]>([
    { name: "Paket Mandiri", price: "Gratis", originalPrice: "", benefits: ["Akses 1 Tryout SKD", "Hasil Skor Instan", "Pembahasan Soal"], isRecommended: false },
    { name: "Paket Premium", price: "Rp 149.000", originalPrice: "Rp 499.000", benefits: ["Akses Semua Tryout", "Ranking Nasional", "Materi Eksklusif", "Grup Konsultasi"], isRecommended: true },
    { name: "Paket Platinum", price: "Rp 299.000", originalPrice: "Rp 999.000", benefits: ["Semua Fitur Premium", "Bimbingan Live Zoom", "Prediksi Soal Akurat", "Sertifikat Kelulusan"], isRecommended: false }
  ]);
  const [waTemplate, setWaTemplate] = useState("Halo Admin, saya ingin pesan paket {paket} seharga {harga}. Berikut bukti transfernya.");
  const [sections, setSections] = useState<LandingSections>(DEFAULT_LANDING_SECTIONS);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('site_settings').select('*');
      const { data: products } = await supabase
        .from('packages')
        .select('id, title, price, product_type, sales_status, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      setCatalogProducts(products ?? []);
      if (data) {
        data.forEach(item => {
          if (item.key === 'hero_content') setHero(item.value);
          if (item.key === 'features') setFeatures(item.value);
          if (item.key === 'testimonials') setTestimonials(item.value);
          if (item.key === 'faqs') setFaqs(item.value);
          if (item.key === 'site_colors') setColors(item.value);
          if (item.key === 'skd_packages') setPackages(item.value);
          if (item.key === 'official_contacts') setContacts(item.value);
          if (item.key === 'bank_details') setBank(item.value);
          if (item.key === 'whatsapp_template') setWaTemplate(item.value);
          if (item.key === 'landing_sections') setSections(mergeLandingSections(item.value));
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string, value: any) => {
    if (!supabase) return;
    setSaving(true);
    
    try {
      let finalValue = value;
      
      // Sanitize benefits before saving packages
      if (key === 'skd_packages' && Array.isArray(value)) {
        finalValue = value.map(pkg => ({
          ...pkg,
          benefits: pkg.benefits.map((b: string) => b.trim()).filter((b: string) => b !== "")
        }));
      }

      const { error } = await supabase
        .from('site_settings')
        .upsert(
          { key, value: finalValue, updated_at: new Date().toISOString() }, 
          { onConflict: 'key' }
        )
        .select();
        
      if (error) {
        console.error(`[CMS ERROR] Gagal simpan ${key}:`, error);
        if (error.code === '42501') {
          toast.error("Akses Ditolak! Pastikan Anda login sebagai Admin Utama.");
        } else {
          toast.error(`Error ${error.code}: ${error.message}`);
        }
        return;
      }
      
      toast.success(`${key.replace('_', ' ').toUpperCase()} Berhasil Diperbarui! ✨`);
    } catch (err: any) {
      console.error(`[CMS CATCH] Exception ${key}:`, err);
      toast.error("Terjadi kesalahan sistem saat menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  function updateSection<K extends keyof LandingSections>(key: K, patch: Partial<LandingSections[K]>) {
    setSections(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  const selectedLandingPackageIds = sections.pricing.packageIds ?? catalogProducts.map(product => product.id);
  const setLandingPackageVisible = (packageId: string, visible: boolean) => {
    const selected = new Set(selectedLandingPackageIds);
    if (visible) selected.add(packageId);
    else selected.delete(packageId);
    updateSection('pricing', { packageIds: Array.from(selected) });
  };

  const inputClass = "w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-white font-bold text-sm placeholder:text-slate-600 outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/10 transition-all";
  const textareaClass = `${inputClass} resize-none`;
  const sectionClass = "bg-[#0d0d14] border border-white/5 rounded-2xl p-7 space-y-6";
  const sectionHeaderClass = "flex items-center justify-between pb-5 border-b border-white/5";
  const iconBoxClass = "w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center shrink-0";
  const labelClass = "text-[9px] font-bold text-slate-600 uppercase tracking-widest block mb-1.5";
  const saveBtn = (onClick: () => void, label = 'Simpan') => (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 disabled:opacity-40 transition-all"
    >
      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-3" />
        <p className="text-slate-600 font-bold text-xs uppercase tracking-widest">Memuat Konten CMS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">

      <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3">
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Perubahan langsung tampil di landing page setelah disimpan. Kosongkan sebuah kolom untuk memakai teks bawaan.
        </p>
      </div>

      {/* HERO */}
      <section className={sectionClass}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center gap-3">
            <div className={iconBoxClass}><Layout className="w-4 h-4 text-blue-400" /></div>
            <div>
              <h2 className="text-[15px] font-semibold text-white">Hero Section</h2>
              <p className="text-[10px] text-slate-600 font-bold">Header utama website</p>
            </div>
          </div>
          {saveBtn(() => handleSave('hero_content', hero), 'Simpan Hero')}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            {[{label:'Label Badge', key:'badge', ph:'Persiapan Masuk Sekolah Kedinasan'},{label:'Judul Utama (H1)', key:'title', ph:'Langkahmu menuju | sekolah kedinasan.'},{label:'Teks Tombol CTA', key:'cta', ph:'Lihat pilihan persiapan'}].map(({label,key,ph}) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <input value={(hero as any)[key]} onChange={e => setHero({...hero,[key]:e.target.value})} className={inputClass} placeholder={ph} />
              </div>
            ))}
            <div>
              <label className={labelClass}>Sub-judul</label>
              <textarea value={hero.subtitle} onChange={e => setHero({...hero, subtitle:e.target.value})} className={textareaClass} rows={3} placeholder="Deskripsi singkat bimbel..." />
            </div>
          </div>
          {/* Live Preview */}
          <div className="relative">
            <div className="absolute top-0 right-0 px-2 py-1 bg-blue-600 text-white text-[8px] font-bold uppercase rounded-bl-xl rounded-tr-xl z-10">Preview</div>
            <div className="bg-[#050b18] p-6 rounded-xl border border-white/5 min-h-full flex flex-col justify-center overflow-hidden">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[8px] font-bold uppercase mb-3 w-fit" style={{color:colors.badge}}>
                {hero.badge || '#1 Platform'}
              </div>
              <h1 className="text-lg font-bold leading-tight mb-2 tracking-tight" style={{color:colors.title}}>{hero.title || 'Wujudkan Mimpi...'}</h1>
              <p className="text-[9px] leading-relaxed" style={{color:colors.subtitle}}>{hero.subtitle || 'Deskripsi...'}</p>
              <div className="mt-4">
                <span className="inline-block px-3 py-1.5 text-white font-bold rounded-lg text-[8px] uppercase" style={{backgroundColor:colors.cta}}>{hero.cta || 'Mulai'}</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-1.5">
                {features.map((f,i) => (
                  <div key={i} className="p-2 bg-white/[0.03] rounded-lg border border-white/5">
                    <div className="w-3 h-3 bg-blue-600 rounded mb-1" />
                    <div className="text-[5px] font-bold text-white truncate">{f.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TEKS BAGIAN LANDING */}
      <section className={sectionClass}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center gap-3">
            <div className={iconBoxClass}><Type className="w-4 h-4 text-blue-400" /></div>
            <div>
              <h2 className="text-[15px] font-semibold text-white">Teks Bagian Landing</h2>
              <p className="text-[10px] text-slate-600 font-bold">Penanda hero, judul tiap section, alur belajar, dan footer</p>
            </div>
          </div>
          {saveBtn(() => handleSave('landing_sections', sections), 'Simpan Teks')}
        </div>

        {/* HERO */}
        <div className="space-y-4">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Hero</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>URL Gambar Hero</label>
              <input value={sections.hero.image} onChange={e => updateSection('hero', { image: e.target.value })} className={inputClass} placeholder="/hero-squad-blue.webp" />
            </div>
            <div>
              <label className={labelClass}>Tombol Kedua (lihat paket)</label>
              <input value={sections.hero.secondaryCta} onChange={e => updateSection('hero', { secondaryCta: e.target.value })} className={inputClass} placeholder="Lihat Paket" />
            </div>
            <div>
              <label className={labelClass}>Teks Tautan Masuk</label>
              <input value={sections.hero.loginHint} onChange={e => updateSection('hero', { loginHint: e.target.value })} className={inputClass} placeholder="Sudah punya akun? Masuk" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sections.hero.signals.map((signal, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Penanda {i + 1}</span>
                <div>
                  <label className={labelClass}>Label</label>
                  <input
                    value={signal.label}
                    onChange={e => {
                      const signals = sections.hero.signals.map((item, index) =>
                        index === i ? { ...item, label: e.target.value } : item
                      );
                      updateSection('hero', { signals });
                    }}
                    className={inputClass}
                    placeholder="Fokus"
                  />
                </div>
                <div>
                  <label className={labelClass}>Isi</label>
                  <input
                    value={signal.value}
                    onChange={e => {
                      const signals = sections.hero.signals.map((item, index) =>
                        index === i ? { ...item, value: e.target.value } : item
                      );
                      updateSection('hero', { signals });
                    }}
                    className={inputClass}
                    placeholder="Seleksi kedinasan"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FITUR */}
        <div className="space-y-4 pt-6 border-t border-white/5">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Section Fitur</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Label Kecil</label>
              <input value={sections.features.eyebrow} onChange={e => updateSection('features', { eyebrow: e.target.value })} className={inputClass} placeholder="Fitur Belajar" />
            </div>
            <div>
              <label className={labelClass}>Judul</label>
              <input value={sections.features.title} onChange={e => updateSection('features', { title: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Deskripsi</label>
            <textarea value={sections.features.description} onChange={e => updateSection('features', { description: e.target.value })} className={textareaClass} rows={2} />
          </div>
        </div>

        {/* RENCANA BELAJAR */}
        <div className="space-y-4 pt-6 border-t border-white/5">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Section Rencana Belajar</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Label Kecil</label>
              <input value={sections.plan.eyebrow} onChange={e => updateSection('plan', { eyebrow: e.target.value })} className={inputClass} placeholder="Rencana Belajar" />
            </div>
            <div>
              <label className={labelClass}>Judul</label>
              <input value={sections.plan.title} onChange={e => updateSection('plan', { title: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Deskripsi</label>
            <textarea value={sections.plan.description} onChange={e => updateSection('plan', { description: e.target.value })} className={textareaClass} rows={2} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sections.plan.steps.map((step, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Langkah {i + 1}</span>
                <div>
                  <label className={labelClass}>Judul Langkah</label>
                  <input
                    value={step.title}
                    onChange={e => {
                      const steps = sections.plan.steps.map((item, index) =>
                        index === i ? { ...item, title: e.target.value } : item
                      );
                      updateSection('plan', { steps });
                    }}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Penjelasan</label>
                  <textarea
                    value={step.text}
                    onChange={e => {
                      const steps = sections.plan.steps.map((item, index) =>
                        index === i ? { ...item, text: e.target.value } : item
                      );
                      updateSection('plan', { steps });
                    }}
                    className={textareaClass}
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PAKET */}
        <div className="space-y-4 pt-6 border-t border-white/5">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Section Paket</p>
          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Paket yang tampil di Landing Page</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">Pengaturan ini hanya mengatur promosi di landing. Paket yang tidak dicentang tetap ada di katalog dan status jualnya tidak berubah.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => updateSection('pricing', { packageIds: catalogProducts.map(product => product.id) })} className="border border-blue-400/30 px-3 py-2 text-[11px] font-semibold text-blue-200 hover:bg-blue-500/10">Pilih semua</button>
                <button type="button" onClick={() => updateSection('pricing', { packageIds: [] })} className="border border-white/15 px-3 py-2 text-[11px] font-semibold text-slate-300 hover:bg-white/5">Kosongkan</button>
              </div>
            </div>
            {catalogProducts.length === 0 ? (
              <p className="border-t border-white/10 pt-3 text-xs text-slate-500">Belum ada produk aktif di katalog.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border-t border-white/10 pt-3">
                {catalogProducts.map(product => {
                  const checked = selectedLandingPackageIds.includes(product.id);
                  return (
                    <label key={product.id} className={`flex cursor-pointer items-start gap-3 border p-3 transition-colors ${checked ? 'border-blue-400/40 bg-blue-500/10' : 'border-white/10 hover:bg-white/[0.03]'}`}>
                      <input type="checkbox" checked={checked} onChange={event => setLandingPackageVisible(product.id, event.target.checked)} className="mt-0.5 h-4 w-4 accent-blue-500" />
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-white">{product.title}</span>
                        <span className="mt-1 block text-[10px] text-slate-400">{product.product_type} · {product.price === 0 ? 'Gratis' : `Rp ${Number(product.price).toLocaleString('id-ID')}`}{product.sales_status === 'CLOSED' ? ' · Pendaftaran ditutup' : ''}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-blue-200/70">Dipilih: {selectedLandingPackageIds.filter(id => catalogProducts.some(product => product.id === id)).length} dari {catalogProducts.length} produk aktif.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Label Kecil</label>
              <input value={sections.pricing.eyebrow} onChange={e => updateSection('pricing', { eyebrow: e.target.value })} className={inputClass} placeholder="Pilihan Paket" />
            </div>
            <div>
              <label className={labelClass}>Judul</label>
              <input value={sections.pricing.title} onChange={e => updateSection('pricing', { title: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Deskripsi</label>
            <textarea value={sections.pricing.description} onChange={e => updateSection('pricing', { description: e.target.value })} className={textareaClass} rows={2} />
          </div>
          <div>
            <label className={labelClass}>Catatan Bawah</label>
            <input value={sections.pricing.note} onChange={e => updateSection('pricing', { note: e.target.value })} className={inputClass} />
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-4 pt-6 border-t border-white/5">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Section FAQ</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Label Kecil</label>
              <input value={sections.faq.eyebrow} onChange={e => updateSection('faq', { eyebrow: e.target.value })} className={inputClass} placeholder="Pertanyaan Umum" />
            </div>
            <div>
              <label className={labelClass}>Judul</label>
              <input value={sections.faq.title} onChange={e => updateSection('faq', { title: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Deskripsi</label>
            <textarea value={sections.faq.description} onChange={e => updateSection('faq', { description: e.target.value })} className={textareaClass} rows={2} />
          </div>
        </div>

        {/* FOOTER */}
        <div className="space-y-4 pt-6 border-t border-white/5">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Footer</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Judul Ajakan</label>
              <input value={sections.footer.ctaTitle} onChange={e => updateSection('footer', { ctaTitle: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Teks Tombol</label>
              <input value={sections.footer.ctaButton} onChange={e => updateSection('footer', { ctaButton: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Penjelasan Ajakan</label>
            <textarea value={sections.footer.ctaText} onChange={e => updateSection('footer', { ctaText: e.target.value })} className={textareaClass} rows={2} />
          </div>
          <div>
            <label className={labelClass}>Deskripsi Brand</label>
            <textarea value={sections.footer.description} onChange={e => updateSection('footer', { description: e.target.value })} className={textareaClass} rows={2} />
          </div>
        </div>
      </section>

      {/* WARNA */}
      <section className={sectionClass}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center gap-3">
            <div className={iconBoxClass}><Layout className="w-4 h-4 text-blue-400" /></div>
            <div>
              <h2 className="text-[15px] font-semibold text-white">Pengaturan Warna</h2>
              <p className="text-[10px] text-slate-600 font-bold">Kustomisasi skema warna landing page</p>
            </div>
          </div>
          {saveBtn(() => handleSave('site_colors', colors), 'Simpan Warna')}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[{label:'Badge',key:'badge'},{label:'Judul',key:'title'},{label:'Deskripsi',key:'subtitle'},{label:'Logo',key:'logo'},{label:'Tombol',key:'cta'}].map(({label,key}) => (
            <div key={key}>
              <label className={labelClass}>{label}</label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/8 p-2 rounded-xl">
                <input type="color" value={(colors as any)[key]} onChange={e => setColors({...colors,[key]:e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent" />
                <input type="text" value={(colors as any)[key]} onChange={e => setColors({...colors,[key]:e.target.value})} className="flex-1 bg-transparent border-none text-[10px] font-bold text-slate-400 outline-none uppercase" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FITUR */}
      <section className={sectionClass}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center gap-3">
            <div className={iconBoxClass}><Zap className="w-4 h-4 text-blue-400" /></div>
            <div>
              <h2 className="text-[15px] font-semibold text-white">Fitur Utama</h2>
              <p className="text-[10px] text-slate-600 font-bold">3 kartu fitur di landing page</p>
            </div>
          </div>
          {saveBtn(() => handleSave('features', features), 'Simpan Fitur')}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f,i) => (
            <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 font-bold text-[10px]">{i+1}</div>
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Fitur {i+1}</span>
              </div>
              <div>
                <label className={labelClass}>Judul</label>
                <input value={f.title} onChange={e => { const n=[...features]; n[i].title=e.target.value; setFeatures(n); }} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Deskripsi</label>
                <textarea value={f.desc} onChange={e => { const n=[...features]; n[i].desc=e.target.value; setFeatures(n); }} className={textareaClass} rows={3} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* KONTAK */}
      <section className={sectionClass}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center gap-3">
            <div className={iconBoxClass}><Phone className="w-4 h-4 text-blue-400" /></div>
            <div>
              <h2 className="text-sm font-bold text-white">Kontak Resmi</h2>
              <p className="text-[10px] text-slate-600 font-bold">WhatsApp, Instagram, TikTok</p>
            </div>
          </div>
          {saveBtn(() => handleSave('official_contacts', contacts), 'Simpan Kontak')}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[{label:'WhatsApp (628xxx)',key:'whatsapp'},{label:'Instagram (username)',key:'instagram'},{label:'TikTok (username)',key:'tiktok'}].map(({label,key}) => (
            <div key={key}>
              <label className={labelClass}>{label}</label>
              <input value={(contacts as any)[key]} onChange={e => setContacts({...contacts,[key]:e.target.value})} className={inputClass} />
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className={sectionClass}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center gap-3">
            <div className={iconBoxClass}><HelpCircle className="w-4 h-4 text-blue-400" /></div>
            <div>
              <h2 className="text-[15px] font-semibold text-white">FAQ</h2>
              <p className="text-[10px] text-slate-600 font-bold">Pertanyaan yang sering diajukan siswa</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setFaqs([...faqs,{q:'Pertanyaan baru?',a:'Jawaban...'}])} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/8 text-slate-400 hover:text-white rounded-xl font-bold text-xs transition-all">
              <Plus className="w-3.5 h-3.5" /> Tambah
            </button>
            {saveBtn(() => handleSave('faqs', faqs), 'Simpan FAQ')}
          </div>
        </div>
        <div className="space-y-3">
          {faqs.map((f,i) => (
            <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <input value={f.q} onChange={e => { const n=[...faqs]; n[i].q=e.target.value; setFaqs(n); }} className="bg-transparent font-bold text-white w-full outline-none text-sm placeholder:text-slate-600" placeholder="Pertanyaan..." />
                <button onClick={() => setFaqs(faqs.filter((_,idx) => idx!==i))} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <textarea value={f.a} onChange={e => { const n=[...faqs]; n[i].a=e.target.value; setFaqs(n); }} className="bg-transparent text-sm text-slate-500 w-full h-14 outline-none resize-none" placeholder="Jawaban..." />
            </div>
          ))}
          {faqs.length === 0 && <p className="text-slate-700 text-xs text-center py-6">Belum ada FAQ. Klik Tambah untuk menambahkan.</p>}
        </div>
      </section>

      {/* PAKET SKD */}
      <section className={sectionClass}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center gap-3">
            <div className={iconBoxClass}><CreditCard className="w-4 h-4 text-blue-400" /></div>
            <div>
              <h2 className="text-[15px] font-semibold text-white">Daftar Paket SKD</h2>
              <p className="text-[10px] text-slate-600 font-bold">Cadangan tampilan jika katalog produk kosong</p>
            </div>
          </div>
          {saveBtn(() => handleSave('skd_packages', packages), 'Simpan Paket')}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {packages.map((p,i) => (
            <div key={i} className={`bg-white/[0.02] border rounded-xl p-5 space-y-4 ${p.isRecommended ? 'border-blue-500/30' : 'border-white/5'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Paket {i+1}</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={p.isRecommended} onChange={e => { const n=[...packages]; n[i].isRecommended=e.target.checked; setPackages(n); }} className="w-3.5 h-3.5 rounded accent-blue-500" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Rekomendasi</span>
                </label>
              </div>
              {[{label:'Nama Paket',key:'name'},{label:'Harga Tampil',key:'price'},{label:'Harga Asli (Coret)',key:'originalPrice'}].map(({label,key}) => (
                <div key={key}>
                  <label className={labelClass}>{label}</label>
                  <input value={(p as any)[key]} onChange={e => { const n=[...packages]; (n[i] as any)[key]=e.target.value; setPackages(n); }} className={inputClass} />
                </div>
              ))}
              <div>
                <label className={labelClass}>Keunggulan (pisah dengan koma)</label>
                <textarea value={p.benefits.join(', ')} onChange={e => { const n=[...packages]; n[i].benefits=e.target.value.split(','); setPackages(n); }} className={textareaClass} rows={3} placeholder="Benefit 1, Benefit 2, ..." />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BANK */}
      <section className={sectionClass}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center gap-3">
            <div className={iconBoxClass}><CreditCard className="w-4 h-4 text-blue-400" /></div>
            <div>
              <h2 className="text-[15px] font-semibold text-white">Bank Details</h2>
              <p className="text-[10px] text-slate-600 font-bold">Informasi pembayaran siswa</p>
            </div>
          </div>
          {saveBtn(() => handleSave('bank_details', bank), 'Simpan Bank')}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[{label:'Nama Bank',key:'name'},{label:'Nomor Rekening',key:'number'},{label:'Atas Nama',key:'owner'}].map(({label,key}) => (
            <div key={key}>
              <label className={labelClass}>{label}</label>
              <input value={(bank as any)[key]} onChange={e => setBank({...bank,[key]:e.target.value})} className={inputClass} />
            </div>
          ))}
        </div>
      </section>

      {/* WHATSAPP TEMPLATE */}
      <section className={sectionClass}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center gap-3">
            <div className={iconBoxClass}><Phone className="w-4 h-4 text-blue-400" /></div>
            <div>
              <h2 className="text-[15px] font-semibold text-white">WhatsApp Template</h2>
              <p className="text-[10px] text-slate-600 font-bold">Otomatisasi pesan konfirmasi pembayaran</p>
            </div>
          </div>
          {saveBtn(() => handleSave('whatsapp_template', waTemplate), 'Simpan Template')}
        </div>
        <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4 text-xs text-slate-400">
          Gunakan <code className="text-blue-400 bg-blue-500/10 px-1 rounded">{'{paket}'}</code> untuk nama paket dan <code className="text-blue-400 bg-blue-500/10 px-1 rounded">{'{harga}'}</code> untuk nominal harga.
        </div>
        <div>
          <label className={labelClass}>Template Pesan</label>
          <textarea value={waTemplate} onChange={e => setWaTemplate(e.target.value)} className={textareaClass} rows={4} placeholder="Halo Admin, saya ingin pesan paket {paket} seharga {harga}..." />
        </div>
      </section>

    </div>
  );
}
