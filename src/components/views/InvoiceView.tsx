import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Copy, 
  CheckCircle2, 
  Clock, 
  Upload, 
  AlertCircle, 
  ChevronRight, 
  CreditCard, 
  FileText,
  Loader2,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";


interface InvoiceViewProps {
  transactionId: string;
  onBack: () => void;
}

export function InvoiceView({ transactionId, onBack }: InvoiceViewProps) {
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [timeLeft, setTimeLeft] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchTransaction();
  }, [transactionId]);

  useEffect(() => {
    if (!transaction?.expiry_date || transaction.status !== 'PENDING') return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(transaction.expiry_date).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft("EXPIRED");
        clearInterval(timer);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}j ${minutes}m ${seconds}d`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [transaction]);

  const fetchTransaction = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          packages (
            title,
            description,
            price
          )
        `)
        .eq('id', transactionId)
        .single();

      if (error) throw error;
      setTransaction(data);
    } catch (err) {
      console.error("Error fetching invoice:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Berhasil disalin!");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validasi
    if (selectedFile.size > 2 * 1024 * 1024) {
      alert("Ukuran file maksimal 2MB");
      return;
    }
    if (!['image/jpeg', 'image/png'].includes(selectedFile.type)) {
      alert("Hanya file JPG/PNG yang diizinkan");
      return;
    }

    setFile(selectedFile);
  };

  const submitProof = async () => {
    if (!file || !supabase || !transaction) return;

    setUploading(true);
    try {
      // 1. Upload ke Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${transaction.invoice_id}-${Date.now()}.${fileExt}`;
      const filePath = `${transaction.user_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      // 2. Update status transaksi
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'VERIFYING',
          payment_proof_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (updateError) throw updateError;


      fetchTransaction();
    } catch (err: any) {
      alert("Gagal mengunggah bukti: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-bold mt-4 tracking-widest uppercase text-[10px]">Menyiapkan Invoice...</p>
      </div>
    );
  }

  if (!transaction) return <div className="p-8 text-center">Invoice tidak ditemukan.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-4 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Katalog
          </button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Invoice Pembayaran
          </h1>
          <p className="text-slate-500 text-sm mt-1">ID: <span className="font-mono font-bold text-slate-900">{transaction.invoice_id}</span></p>
        </div>

        <div className={`px-6 py-3 rounded-2xl flex items-center gap-3 border shadow-sm ${
          transaction.status === 'PENDING' ? 'bg-amber-50 border-amber-200 text-amber-700' :
          transaction.status === 'VERIFYING' ? 'bg-blue-50 border-blue-200 text-blue-700' :
          'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          <div className={`w-3 h-3 rounded-full animate-pulse ${
            transaction.status === 'PENDING' ? 'bg-amber-500' :
            transaction.status === 'VERIFYING' ? 'bg-blue-500' :
            'bg-emerald-500'
          }`} />
          <span className="text-sm font-black uppercase tracking-widest">
            {transaction.status === 'PENDING' ? 'Menunggu Pembayaran' :
             transaction.status === 'VERIFYING' ? 'Menunggu Verifikasi' :
             'Pembayaran Berhasil'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* KOLOM KIRI: Rincian Tagihan */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="p-8 border-b border-slate-50">
              <h3 className="text-lg font-black text-slate-800 mb-6">Ringkasan Pesanan</h3>
              <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900">{transaction.packages.title}</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed line-clamp-2">{transaction.packages.description}</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-4">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-500">Harga Paket</span>
                <span className="text-slate-900">Rp {transaction.packages.price.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-500">Biaya Layanan</span>
                <span className="text-slate-900 text-emerald-600 font-bold">GRATIS</span>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-lg font-black text-slate-900">Total Tagihan</span>
                <span className="text-2xl font-black text-blue-600">Rp {transaction.amount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="p-8 bg-slate-900 text-white/50 text-[10px] font-bold text-center uppercase tracking-widest">
              Dibuat pada {new Date(transaction.created_at).toLocaleString('id-ID')}
            </div>
          </div>

          {/* S&K Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 space-y-3">
             <div className="flex items-center gap-2 text-amber-700 font-black text-xs uppercase tracking-wider">
               <AlertCircle className="w-4 h-4" /> Informasi Penting
             </div>
             <ul className="text-xs text-amber-900/70 space-y-2 list-disc ml-4 font-medium leading-relaxed">
               <li>Setelah pembayaran dikonfirmasi, akses kelas akan diberikan maksimal 1x24 jam.</li>
               <li>Pastikan mengunggah bukti transfer yang jelas (struk ATM / Screenshot m-banking).</li>
               <li><span className="font-bold text-amber-900">Tidak ada refund</span> setelah akses kelas diberikan.</li>
             </ul>
          </div>
        </div>

        {/* KOLOM KANAN: Instruksi Pembayaran */}
        <div className="lg:col-span-5 space-y-6">
          {transaction.status === 'PENDING' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
              <div className="text-center mb-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sisa Waktu Pembayaran</p>
                <div className="inline-flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-full font-mono text-xl font-black">
                  <Clock className="w-5 h-5 text-amber-400" />
                  {timeLeft}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider text-center">Tujuan Transfer</h3>
                
                {/* Bank Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <div className="bg-white px-3 py-1 rounded-lg border border-slate-200 inline-block mb-3">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" alt="BCA" className="h-4" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nomor Rekening</p>
                      <p className="text-2xl font-black text-slate-900 tracking-tight">8831 2940 33</p>
                      <p className="text-sm font-bold text-slate-600 mt-1 uppercase">A/N Galviano Rizky</p>
                    </div>
                    <button 
                      onClick={() => handleCopy("8831294033")}
                      className="p-4 bg-white hover:bg-blue-600 hover:text-white text-slate-400 rounded-2xl transition-all shadow-sm border border-slate-100"
                    >
                      <Copy className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Upload Form */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider text-center">Konfirmasi Pembayaran</h3>
                  
                  <div className="relative group">
                    <input 
                      type="file" 
                      id="proof-upload"
                      className="hidden" 
                      onChange={handleFileUpload}
                      accept="image/jpeg,image/png"
                    />
                    <label 
                      htmlFor="proof-upload"
                      className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-[2rem] cursor-pointer transition-all ${
                        file ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-blue-500 bg-slate-50'
                      }`}
                    >
                      {file ? (
                        <>
                          <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                          <p className="text-xs font-bold text-emerald-700">{file.name}</p>
                          <p className="text-[10px] text-emerald-600 mt-1">Klik untuk mengganti</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 text-slate-300 mb-2 group-hover:text-blue-500" />
                          <p className="text-xs font-bold text-slate-600">Klik untuk Pilih Foto Bukti</p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">JPG / PNG (MAX 2MB)</p>
                        </>
                      )}
                    </label>
                  </div>

                  <Button 
                    onClick={submitProof}
                    disabled={!file || uploading}
                    className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg shadow-blue-500/30 disabled:opacity-50 transition-all text-base"
                  >
                    {uploading ? (
                      <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Mengirim Bukti...</>
                    ) : (
                      <>Kirim Bukti Pembayaran <ChevronRight className="w-5 h-5 ml-2" /></>
                    )}
                  </Button>

                  <div className="relative py-2 flex items-center gap-4">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Atau</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  <a 
                    href={`https://wa.me/628831294033?text=${encodeURIComponent(
                      `Halo Admin FBK Kedinasan,\n\nSaya ingin konfirmasi pembayaran untuk:\n🧾 *Invoice:* ${transaction.invoice_id}\n📦 *Paket:* ${transaction.packages.title}\n💰 *Total:* Rp ${transaction.amount.toLocaleString('id-ID')}\n\nSaya sudah melakukan transfer, mohon bantuannya untuk verifikasi. Terima kasih!`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Konfirmasi via WhatsApp
                  </a>
                </div>
              </div>
            </div>
          )}

          {transaction.status === 'VERIFYING' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-12 text-center space-y-6">
              <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mx-auto relative">
                <div className="absolute inset-0 bg-blue-400/20 rounded-[2.5rem] animate-ping opacity-30" />
                <ShieldCheck className="w-12 h-12 text-blue-600 relative z-10" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Verifikasi Sedang Berjalan</h3>
                <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                  Bukti pembayaran Anda telah diterima. Admin kami akan melakukan verifikasi maksimal dalam <span className="font-bold text-slate-800">1x24 jam</span>.
                </p>
              </div>
              <div className="pt-4 flex flex-col gap-3">
                <Button variant="outline" className="h-12 rounded-xl border-slate-200 font-bold" onClick={onBack}>
                  Kembali ke Dashboard
                </Button>
                <a 
                  href={`https://wa.me/628831294033?text=Halo Admin, saya sudah bayar invoice ${transaction.invoice_id}`} 
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 text-blue-600 text-xs font-bold hover:underline"
                >
                  Butuh bantuan? Hubungi Admin <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {transaction.status === 'SUCCESS' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-12 text-center space-y-6">
              <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Pembayaran Berhasil!</h3>
                <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                  Selamat! Pembayaran Anda telah dikonfirmasi. Akses paket <span className="font-bold text-slate-800">{transaction.packages.title}</span> kini sudah terbuka.
                </p>
              </div>
              <Button className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black" onClick={onBack}>
                Mulai Belajar Sekarang <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
