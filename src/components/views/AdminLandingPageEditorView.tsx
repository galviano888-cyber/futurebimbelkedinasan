import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Save, Plus, Trash2, Layout, HelpCircle, Loader2, Phone, CreditCard, Zap } from "lucide-react";
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

  const inputClass = "w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-white font-bold text-sm placeholder:text-slate-600 outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/10 transition-all";
  const textareaClass = `${inputClass} resize-none`;
  const sectionClass = "bg-[#0d0d14] border border-white/5 rounded-2xl p-7 space-y-6";
  const sectionHeaderClass = "flex items-center justify-between pb-5 border-b border-white/5";
  const iconBoxClass = "w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center shrink-0";
  const labelClass = "text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1.5";
  const saveBtn = (onClick: () => void, label = 'Simpan') => (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs shadow-lg shadow-indigo-500/20 disabled:opacity-40 transition-all"
    >
      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-3" />
        <p className="text-slate-600 font-bold text-xs uppercase tracking-widest">Memuat Konten CMS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">

      {/* HERO */}
      <section className={sectionClass}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center gap-3">
            <div className={iconBoxClass}><Layout className="w-4 h-4 text-indigo-400" /></div>
            <div>
              <h2 className="text-sm font-black text-white">Hero Section</h2>
              <p className="text-[10px] text-slate-600 font-bold">Header utama website</p>
            </div>
          </div>
          {saveBtn(() => handleSave('hero_content', hero), 'Simpan Hero')}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            {[{label:'Label Badge', key:'badge', ph:'#1 Platform Kedinasan'},{label:'Judul Utama (H1)', key:'title', ph:'Wujudkan Mimpi...'},{label:'Teks Tombol CTA', key:'cta', ph:'Masuk Sekarang'},{label:'URL Gambar Hero', key:'image', ph:'https://...'}].map(({label,key,ph}) => (
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
            <div className="absolute top-0 right-0 px-2 py-1 bg-indigo-600 text-white text-[8px] font-black uppercase rounded-bl-xl rounded-tr-xl z-10">Preview</div>
            <div className="bg-[#050b18] p-6 rounded-xl border border-white/5 min-h-full flex flex-col justify-center overflow-hidden">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[8px] font-black uppercase mb-3 w-fit" style={{color:colors.badge}}>
                {hero.badge || '#1 Platform'}
              </div>
              <h1 className="text-lg font-black leading-tight mb-2 tracking-tight" style={{color:colors.title}}>{hero.title || 'Wujudkan Mimpi...'}</h1>
              <p className="text-[9px] leading-relaxed" style={{color:colors.subtitle}}>{hero.subtitle || 'Deskripsi...'}</p>
              <div className="mt-4">
                <span className="inline-block px-3 py-1.5 text-white font-black rounded-lg text-[8px] uppercase" style={{backgroundColor:colors.cta}}>{hero.cta || 'Mulai'}</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-1.5">
                {features.map((f,i) => (
                  <div key={i} className="p-2 bg-white/[0.03] rounded-lg border border-white/5">
                    <div className="w-3 h-3 bg-indigo-600 rounded mb-1" />
                    <div className="text-[5px] font-black text-white truncate">{f.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WARNA */}
      <section className={sectionClass}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center gap-3">
            <div className={iconBoxClass}><Layout className="w-4 h-4 text-indigo-400" /></div>
            <div>
              <h2 className="text-sm font-black text-white">Pengaturan Warna</h2>
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
                <input type="text" value={(colors as any)[key]} onChange={e => setColors({...colors,[key]:e.target.value})} className="flex-1 bg-transparent border-none text-[10px] font-black text-slate-400 outline-none uppercase" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FITUR */}
      <section className={sectionClass}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center gap-3">
            <div className={iconBoxClass}><Zap className="w-4 h-4 text-indigo-400" /></div>
            <div>
              <h2 className="text-sm font-black text-white">Fitur Utama</h2>
              <p className="text-[10px] text-slate-600 font-bold">3 kartu fitur di landing page</p>
            </div>
          </div>
          {saveBtn(() => handleSave('features', features), 'Simpan Fitur')}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f,i) => (
            <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 font-black text-[10px]">{i+1}</div>
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Fitur {i+1}</span>
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
            <div className={iconBoxClass}><Phone className="w-4 h-4 text-indigo-400" /></div>
            <div>
              <h2 className="text-sm font-black text-white">Kontak Resmi</h2>
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
            <div className={iconBoxClass}><HelpCircle className="w-4 h-4 text-indigo-400" /></div>
            <div>
              <h2 className="text-sm font-black text-white">FAQ</h2>
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
            <div className={iconBoxClass}><CreditCard className="w-4 h-4 text-indigo-400" /></div>
            <div>
              <h2 className="text-sm font-black text-white">Daftar Paket SKD</h2>
              <p className="text-[10px] text-slate-600 font-bold">Atur paket & harga di landing page</p>
            </div>
          </div>
          {saveBtn(() => handleSave('skd_packages', packages), 'Simpan Paket')}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {packages.map((p,i) => (
            <div key={i} className={`bg-white/[0.02] border rounded-xl p-5 space-y-4 ${p.isRecommended ? 'border-indigo-500/30' : 'border-white/5'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Paket {i+1}</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={p.isRecommended} onChange={e => { const n=[...packages]; n[i].isRecommended=e.target.checked; setPackages(n); }} className="w-3.5 h-3.5 rounded accent-indigo-500" />
                  <span className="text-[9px] font-black text-slate-500 uppercase">Rekomendasi</span>
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
            <div className={iconBoxClass}><CreditCard className="w-4 h-4 text-indigo-400" /></div>
            <div>
              <h2 className="text-sm font-black text-white">Bank Details</h2>
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
            <div className={iconBoxClass}><Phone className="w-4 h-4 text-indigo-400" /></div>
            <div>
              <h2 className="text-sm font-black text-white">WhatsApp Template</h2>
              <p className="text-[10px] text-slate-600 font-bold">Otomatisasi pesan konfirmasi pembayaran</p>
            </div>
          </div>
          {saveBtn(() => handleSave('whatsapp_template', waTemplate), 'Simpan Template')}
        </div>
        <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-xl p-4 text-xs text-slate-400">
          Gunakan <code className="text-indigo-400 bg-indigo-500/10 px-1 rounded">{'{paket}'}</code> untuk nama paket dan <code className="text-indigo-400 bg-indigo-500/10 px-1 rounded">{'{invoice}'}</code> untuk nomor invoice.
        </div>
        <div>
          <label className={labelClass}>Template Pesan</label>
          <textarea value={waTemplate} onChange={e => setWaTemplate(e.target.value)} className={textareaClass} rows={4} placeholder="Halo Admin, saya konfirmasi pembayaran {paket} dengan invoice {invoice}..." />
        </div>
      </section>

    </div>
  );
}
