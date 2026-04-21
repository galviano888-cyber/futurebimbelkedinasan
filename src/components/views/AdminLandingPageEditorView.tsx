import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Save, Plus, Trash2, Layout, MessageSquare, HelpCircle, Loader2, Phone, CreditCard, Zap } from "lucide-react";
import { toast } from "sonner";

export function AdminLandingPageEditorView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings State
  const [hero, setHero] = useState({ 
    badge: "Platform Persiapan Kedinasan #1",
    title: "Wujudkan Mimpi Menjadi Abdi Negara.", 
    subtitle: "Persiapkan dirimu menghadapi seleksi sekolah kedinasan bersama Future Bimbel Kedinasan. Belajar lebih efektif dengan sistem CAT standar BKN.",
    cta: "Masuk Sekarang",
    image: "https://images.unsplash.com/photo-1523240715632-d984bb4b990a?q=80&w=2070&auto=format&fit=crop"
  });
  const [features, setFeatures] = useState<any[]>([
    { title: "Eksklusif: Mentor Kedinasan", desc: "Dibimbing langsung oleh Kakak tingkat yang telah berhasil lolos seleksi dengan strategi efektif." },
    { title: "Engine CAT Standar BKN", desc: "Uji kemampuan dengan platform simulasi presisi sesuai standar sistem CAT BKN asli." },
    { title: "Bank Soal Terupdate", desc: "Akses materi belajar dan bank soal yang telah disesuaikan dengan standar seleksi terbaru." }
  ]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
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
  const [waTemplate, setWaTemplate] = useState("Halo Admin, saya ingin konfirmasi pembayaran untuk paket {paket} dengan nomor invoice {invoice}. Berikut bukti pembayarannya.");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('site_settings').select('*');
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
    console.log(`[CMS] Mencoba menyimpan ke key: ${key}`, value);
    
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Memuat Konten CMS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* SECTION 1: HERO */}
      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><Layout className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Hero Section</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Header Utama Website</p>
            </div>
          </div>
          <button 
            onClick={() => handleSave('hero_content', hero)} 
            disabled={saving}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
            SIMPAN PERUBAHAN
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* EDITOR */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Label Badge (Atas Judul)</label>
              <input 
                value={hero.badge} 
                onChange={(e) => setHero({ ...hero, badge: e.target.value })} 
                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-slate-950 font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" 
                placeholder="Misal: #1 Platform Kedinasan"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Judul Utama (H1)</label>
              <input 
                value={hero.title} 
                onChange={(e) => setHero({ ...hero, title: e.target.value })} 
                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-slate-950 font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" 
                placeholder="Masukkan judul menarik..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Sub-judul (Deskripsi)</label>
              <textarea 
                value={hero.subtitle} 
                onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} 
                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-slate-950 font-medium h-32 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" 
                placeholder="Jelaskan bimbelmu secara singkat..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Teks Tombol (CTA)</label>
              <input 
                value={hero.cta} 
                onChange={(e) => setHero({ ...hero, cta: e.target.value })} 
                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-slate-950 font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" 
                placeholder="Misal: Masuk Sekarang"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">URL Gambar Hero</label>
              <input 
                value={hero.image} 
                onChange={(e) => setHero({ ...hero, image: e.target.value })} 
                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-slate-950 font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" 
                placeholder="Masukkan URL gambar..."
              />
            </div>
          </div>

          {/* LIVE PREVIEW */}
          <div className="relative">
             <div className="absolute top-0 right-0 px-3 py-1 bg-blue-600 text-white text-[8px] font-black uppercase rounded-bl-xl rounded-tr-2xl z-10">Live Preview</div>
             <div className="bg-[#050b18] p-8 rounded-[2rem] border border-slate-800 shadow-2xl min-h-full flex flex-col justify-center overflow-hidden">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[8px] font-black uppercase mb-4 w-fit" style={{ color: colors.badge }}>
                  <span>{hero.badge || "#1 Platform Kedinasan"}</span>
                </div>
                <h1 className="text-xl font-black leading-tight mb-3 tracking-tight" style={{ color: colors.title }}>
                  {hero.title || "Wujudkan Mimpi Menjadi Abdi Negara"}
                </h1>
                <p className="text-[10px] leading-relaxed" style={{ color: colors.subtitle }}>
                  {hero.subtitle || "Persiapkan dirimu menghadapi seleksi sekolah kedinasan bersama Future Bimbel Kedinasan."}
                </p>
                <div className="mt-6">
                  <div className="inline-block px-4 py-2 text-white font-black rounded-lg text-[8px] uppercase" style={{ backgroundColor: colors.cta }}>
                    {hero.cta || "Masuk Sekarang"}
                  </div>
                </div>
                {hero.image && (
                  <div className="mt-6 rounded-xl overflow-hidden border border-white/5 opacity-40">
                    <img src={hero.image} alt="Preview" className="w-full h-auto grayscale" />
                  </div>
                )}

                {/* Features Preview */}
                <div className="mt-8 grid grid-cols-3 gap-2">
                   {features.map((f, i) => (
                     <div key={i} className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                        <div className="w-4 h-4 bg-blue-600 rounded-md mb-2" />
                        <div className="text-[6px] font-black text-white mb-1">{f.title}</div>
                        <div className="text-[5px] text-slate-500 leading-tight">{f.desc}</div>
                     </div>
                   ))}
                </div>

                {/* Packages Preview */}
                <div className="mt-8 space-y-2">
                   <div className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-2">Paket SKD Preview</div>
                   <div className="grid grid-cols-3 gap-2">
                      {packages.map((p, i) => (
                        <div key={i} className={`p-2 rounded-lg border ${p.isRecommended ? 'border-blue-500 bg-blue-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
                           <div className="text-[5px] font-black text-white">{p.name}</div>
                           <div className="text-[7px] font-black text-blue-500 mt-1">{p.price}</div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* SECTION: BRAND COLORS */}
      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><Layout className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Pengaturan Warna</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Kustomisasi Skema Warna Landing Page</p>
            </div>
          </div>
          <button 
            onClick={() => handleSave('site_colors', colors)} 
            className="px-6 py-3 bg-indigo-600 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            SIMPAN WARNA
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {[
            { label: "Warna Badge", key: "badge" },
            { label: "Warna Judul", key: "title" },
            { label: "Warna Deskripsi", key: "subtitle" },
            { label: "Warna Logo", key: "logo" },
            { label: "Warna Tombol", key: "cta" },
          ].map((item) => (
            <div key={item.key} className="space-y-3">
               <label className="text-[10px] font-black text-slate-500 uppercase ml-1 block">{item.label}</label>
               <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  <input 
                    type="color" 
                    value={(colors as any)[item.key]} 
                    onChange={(e) => setColors({ ...colors, [item.key]: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border-none bg-transparent"
                  />
                  <input 
                    type="text"
                    value={(colors as any)[item.key]}
                    onChange={(e) => setColors({ ...colors, [item.key]: e.target.value })}
                    className="flex-1 bg-transparent border-none text-[10px] font-black text-slate-600 outline-none uppercase"
                  />
               </div>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><Zap className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Fitur Utama</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">3 Kartu Fitur di Landing Page</p>
            </div>
          </div>
          <button 
            onClick={() => handleSave('features', features)} 
            className="px-6 py-3 bg-blue-600 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            SIMPAN FITUR
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
               <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-black">{i+1}</div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fitur {i+1}</span>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Judul Fitur</label>
                  <input 
                    value={f.title} 
                    onChange={(e) => {
                      const newFeatures = [...features];
                      newFeatures[i].title = e.target.value;
                      setFeatures(newFeatures);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-950 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Deskripsi</label>
                  <textarea 
                    value={f.desc} 
                    onChange={(e) => {
                      const newFeatures = [...features];
                      newFeatures[i].desc = e.target.value;
                      setFeatures(newFeatures);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-950 font-medium text-xs h-24 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
               </div>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><Phone className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Official Contacts</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Kontak Resmi Bimbel</p>
            </div>
          </div>
          <button 
            onClick={() => handleSave('official_contacts', contacts)} 
            disabled={saving}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
            SIMPAN KONTAK
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp (Format: 628xxx)</label>
            <input value={contacts.whatsapp} onChange={(e) => setContacts({ ...contacts, whatsapp: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Instagram (Username)</label>
            <input value={contacts.instagram} onChange={(e) => setContacts({ ...contacts, instagram: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">TikTok (Username)</label>
            <input value={contacts.tiktok} onChange={(e) => setContacts({ ...contacts, tiktok: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
          </div>
        </div>
      </section>

      {/* SECTION 2: TESTIMONIALS */}
      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><MessageSquare className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Testimoni Siswa</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Kata mereka yang sudah lolos</p>
            </div>
          </div>
          <button onClick={() => setTestimonials([...testimonials, { name: "Nama Siswa", text: "Tulis testimoni...", school: "Tahun/Lulusan" }])} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><Plus className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {testimonials.map((t, i) => (
            <div key={i} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative group">
              <button onClick={() => setTestimonials(testimonials.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 w-8 h-8 bg-white text-red-500 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
              <input value={t.name} onChange={(e) => { const newT = [...testimonials]; newT[i].name = e.target.value; setTestimonials(newT); }} className="bg-transparent font-black text-slate-900 block w-full mb-1 outline-none" placeholder="Nama Siswa" />
              <input value={t.school} onChange={(e) => { const newT = [...testimonials]; newT[i].school = e.target.value; setTestimonials(newT); }} className="bg-transparent text-[10px] font-black text-blue-500 uppercase tracking-widest block w-full mb-4 outline-none" placeholder="Sekolah/Tahun" />
              <textarea value={t.text} onChange={(e) => { const newT = [...testimonials]; newT[i].text = e.target.value; setTestimonials(newT); }} className="bg-transparent text-sm text-slate-500 w-full h-20 outline-none resize-none" placeholder="Isi testimoni..." />
            </div>
          ))}
        </div>
        <button 
          onClick={() => handleSave('testimonials', testimonials)} 
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
          SIMPAN TESTIMONI
        </button>
      </section>

      {/* SECTION 3: FAQ */}
      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600"><HelpCircle className="w-6 h-6" /></div>
            <div><h2 className="text-xl font-black text-slate-900 tracking-tight">FAQ</h2><p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Informasi Siswa</p></div>
          </div>
          <button onClick={() => setFaqs([...faqs, { q: "Pertanyaan baru?", a: "Jawaban..." }])} className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all"><Plus className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4 mb-8">
          {faqs.map((f, i) => (
            <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group">
              <div className="flex items-center justify-between gap-4 mb-2">
                 <input value={f.q} onChange={(e) => { const newF = [...faqs]; newF[i].q = e.target.value; setFaqs(newF); }} className="bg-transparent font-bold text-slate-900 w-full outline-none" />
                 <button onClick={() => setFaqs(faqs.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
              <textarea value={f.a} onChange={(e) => { const newF = [...faqs]; newF[i].a = e.target.value; setFaqs(newF); }} className="bg-transparent text-sm text-slate-500 w-full h-16 outline-none resize-none" />
            </div>
          ))}
        </div>
        <button 
          onClick={() => handleSave('faqs', faqs)} 
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-amber-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-amber-500/20 hover:bg-amber-700 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
          SIMPAN FAQ
        </button>
      </section>

      {/* SECTION: SKD PACKAGES */}
      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><CreditCard className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Daftar Paket SKD</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Atur Paket & Harga di Landing Page</p>
            </div>
          </div>
          <button 
            onClick={() => handleSave('skd_packages', packages)} 
            className="px-6 py-3 bg-blue-600 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            SIMPAN PAKET
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {packages.map((p, i) => (
            <div key={i} className={`p-6 rounded-[2.5rem] border ${p.isRecommended ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100 bg-slate-50'} space-y-6`}>
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-black">{i+1}</div>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paket {i+1}</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={p.isRecommended} 
                      onChange={(e) => {
                        const newPackages = [...packages];
                        newPackages[i].isRecommended = e.target.checked;
                        setPackages(newPackages);
                      }}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="text-[10px] font-black text-slate-500 uppercase">Rekomendasi</span>
                  </label>
               </div>

               <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 block">Nama Paket</label>
                    <input 
                      value={p.name} 
                      onChange={(e) => {
                        const newPkgs = [...packages];
                        newPkgs[i].name = e.target.value;
                        setPackages(newPkgs);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-950 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 block">Harga Diskon (Tampil)</label>
                    <input 
                      value={p.price} 
                      onChange={(e) => {
                        const newPkgs = [...packages];
                        newPkgs[i].price = e.target.value;
                        setPackages(newPkgs);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-blue-600 font-black text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 block">Harga Asli (Coret)</label>
                    <input 
                      value={p.originalPrice} 
                      onChange={(e) => {
                        const newPkgs = [...packages];
                        newPkgs[i].originalPrice = e.target.value;
                        setPackages(newPkgs);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-400 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20 line-through"
                      placeholder="Rp 499.000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 block">Keunggulan (Pisah dengan koma)</label>
                    <textarea 
                      value={p.benefits.join(", ")} 
                      onChange={(e) => {
                         const newPkgs = [...packages];
                         // Biarkan user mengetik bebas, pisahkan saja berdasarkan koma
                         newPkgs[i].benefits = e.target.value.split(",");
                         setPackages(newPkgs);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-950 font-medium text-xs h-24 outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Benefit 1, Benefit 2, ..."
                    />
                  </div>
               </div>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><CreditCard className="w-6 h-6" /></div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Bank Details</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Informasi Pembayaran Siswa</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nama Bank</label>
            <input value={bank.name} onChange={(e) => setBank({ ...bank, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nomor Rekening</label>
            <input value={bank.number} onChange={(e) => setBank({ ...bank, number: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Atas Nama (Owner)</label>
            <input value={bank.owner} onChange={(e) => setBank({ ...bank, owner: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none" />
          </div>
        </div>
        <button 
          onClick={() => handleSave('bank_details', bank)} 
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
          SIMPAN DATA BANK
        </button>
      </section>

      {/* SECTION 5: WHATSAPP AUTO-FORMAT */}
      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600"><Phone className="w-6 h-6" /></div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">WhatsApp Template</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Otomatisasi Pesan Konfirmasi</p>
          </div>
        </div>
        <div className="space-y-6">
           <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">💡 Tips Placeholder</p>
              <p className="text-xs text-blue-800 leading-relaxed">Gunakan <b>{"{paket}"}</b> untuk nama paket dan <b>{"{invoice}"}</b> untuk nomor invoice. Sistem akan mengisinya otomatis saat tombol diklik oleh siswa.</p>
           </div>
           <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Template Pesan</label>
              <textarea 
                value={waTemplate}
                onChange={(e) => setWaTemplate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-700 font-medium h-32 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                placeholder="Contoh: Halo Admin, saya konfirmasi pembayaran {paket} dengan invoice {invoice}..."
              />
           </div>
           <button 
             onClick={() => handleSave('whatsapp_template', waTemplate)}
             disabled={saving}
             className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-green-600 text-white rounded-2xl font-black text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
           >
             {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
             SIMPAN TEMPLATE WHATSAPP
           </button>
        </div>
      </section>

    </div>
  );
}
