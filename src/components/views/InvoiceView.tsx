import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Copy, 
  CheckCircle2, 
  Upload, 
  Loader2,
  CreditCard,
  FileText,
  Phone,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";


interface InvoiceViewProps {
  transactionId: string;
  onBack: () => void;
}

export function InvoiceView({ transactionId, onBack }: InvoiceViewProps) {
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Settings
  const [waTemplate, setWaTemplate] = useState("Halo Admin FBK,\n\nSaya ingin konfirmasi pembayaran untuk:\n🧾 *Invoice:* {invoice}\n📦 *Paket:* {paket}\n\nSaya sudah mengunggah bukti transfer, mohon bantuannya untuk verifikasi. Terima kasih!");
  const [waNumber, setWaNumber] = useState("6287753646617");
  const [bank, setBank] = useState({ name: "BRI", number: "0356 0108 9005 505", owner: "Galih Oktaviano" });

  const [timeLeft, setTimeLeft] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchTransaction();
    fetchSettings();

    if (!supabase) return;
    const channel = supabase
      .channel(`transaction-status-${transactionId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'transactions', 
        filter: `id=eq.${transactionId}` 
      }, (payload: any) => {
        if (payload.new?.status === 'success') {
          toast.success("Pembayaran Berhasil Dikonfirmasi!", {
            description: "Selamat belajar! Akses paket Anda kini telah terbuka penuh.",
            duration: 5000
          });
        }
        fetchTransaction();
      })
      .subscribe();

    return () => {
      if (supabase) supabase.removeChannel(channel);
    };
  }, [transactionId]);

  useEffect(() => {
    if (!transaction?.expiry_date || transaction.status !== 'pending') return;
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

  const fetchSettings = async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('site_settings').select('*').in('key', ['whatsapp_template', 'official_contacts', 'bank_details']);
      if (data) {
        data.forEach(item => {
          if (item.key === 'whatsapp_template') setWaTemplate(item.value);
          if (item.key === 'official_contacts' && item.value?.whatsapp) setWaNumber(item.value.whatsapp);
          if (item.key === 'bank_details') setBank(item.value);
        });
      }
    } catch (err) {
      console.error("Gagal ambil settings:", err);
    }
  };

  const fetchTransaction = async (silent = false) => {
    if (!supabase) return;
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`*, packages (title, description, price)`)
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
    navigator.clipboard.writeText(text.replace(/\s/g, ''));
    toast.success("Berhasil disalin!");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.size > 5 * 1024 * 1024) return toast.error("Ukuran file maksimal 5MB");
    setFile(selectedFile);
  };

  const submitProof = async () => {
    if (!file || !supabase || !transaction) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${transaction.invoice_id}-${Date.now()}.${fileExt}`;
      const filePath = `${transaction.user_id}/${fileName}`;
      await supabase.storage.from('payment-proofs').upload(filePath, file);
      const { data: { publicUrl } } = supabase.storage.from('payment-proofs').getPublicUrl(filePath);

      await supabase.from('transactions').update({
        status: 'verifying',
        payment_proof_url: publicUrl,
        updated_at: new Date().toISOString()
      }).eq('id', transactionId);

      toast.success("Bukti pembayaran berhasil dikirim!");
      fetchTransaction(true);
    } catch (err: any) {
      toast.error("Terjadi kesalahan: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const generateWaLink = () => {
    if (!transaction) return "#";
    const message = waTemplate
      .replace(/{paket}/g, transaction.packages.title)
      .replace(/{invoice}/g, transaction.invoice_id);
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
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

  const currentStatus = transaction.status?.toLowerCase();
  const isPending = currentStatus === 'pending';
  const isVerifying = currentStatus === 'verifying';
  const isSuccess = currentStatus === 'success';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-4 text-sm font-medium"><ArrowLeft className="w-4 h-4" /> Kembali</button>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3"><FileText className="w-8 h-8 text-blue-600" /> Invoice Pembayaran</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">ID: <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{transaction.invoice_id}</span></p>
        </div>
        <div className={`px-6 py-3 rounded-2xl flex items-center gap-3 border shadow-sm ${isPending ? 'bg-amber-50 border-amber-200 text-amber-700' : isVerifying ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
          <div className={`w-3 h-3 rounded-full animate-pulse ${isPending ? 'bg-amber-500' : isVerifying ? 'bg-blue-500' : 'bg-emerald-500'}`} />
          <span className="text-sm font-black uppercase tracking-widest">{isPending ? 'Menunggu Pembayaran' : isVerifying ? 'Menunggu Verifikasi' : 'Pembayaran Berhasil'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl p-8">
            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6">Ringkasan Pesanan</h3>
            <div className="flex items-start gap-4 p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5">
               <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shrink-0"><CreditCard className="w-6 h-6 text-white" /></div>
               <div>
                 <h4 className="font-black text-slate-900 dark:text-white">{transaction.packages.title}</h4>
                 <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 text-justify leading-relaxed">{transaction.packages.description}</p>
               </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
              <span className="text-lg font-black text-slate-900 dark:text-white">Total Tagihan</span>
              <span className="text-2xl font-black text-blue-600">Rp {transaction.amount.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          {(isPending || isVerifying) && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl p-8 space-y-8">
               <div className="text-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Sisa Waktu</p>
                 <div className="inline-flex items-center gap-2 px-6 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-full font-mono text-xl font-black">{timeLeft}</div>
               </div>
               
               <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Transfer {bank.name}</p>
                  <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex items-center justify-between">
                     <div><p className="text-xl font-black text-slate-900 dark:text-white">{bank.number}</p><p className="text-xs font-bold text-slate-500 dark:text-slate-400">A/N {bank.owner}</p></div>
                     <button 
                       onClick={() => handleCopy(bank.number)} 
                       className="p-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                     >
                       <Copy className="w-5 h-5" />
                     </button>
                  </div>
               </div>

               {isPending ? (
                 <div className="space-y-4">
                    <input type="file" id="proof-upload" className="hidden" onChange={handleFileUpload} accept="image/*" />
                    <label htmlFor="proof-upload" className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-[2rem] cursor-pointer transition-all ${file ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-blue-500'}`}>
                      {file ? <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" /> : <Upload className="w-10 h-10 text-slate-300 mb-2" />}
                      <p className="text-xs font-bold text-slate-600">{file ? file.name : "Pilih Bukti Pembayaran"}</p>
                    </label>
                    
                    <Button onClick={submitProof} disabled={!file || uploading} className="w-full h-16 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-500/30">
                      {uploading ? "Mengirim..." : "Kirim Bukti Pembayaran"}
                    </Button>

                    <div className="flex items-center gap-4 py-2"><div className="flex-1 h-px bg-slate-100" /><span className="text-[10px] font-black text-slate-300 uppercase">Atau</span><div className="flex-1 h-px bg-slate-100" /></div>

                    <a href={generateWaLink()} target="_blank" rel="noreferrer" className={`w-full h-16 rounded-2xl font-black flex items-center justify-center gap-2 text-sm transition-all ${transaction.payment_proof_url ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                      <Phone className="w-5 h-5" /> Konfirmasi WhatsApp
                    </a>
                 </div>
               ) : (
                  <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-white/5 text-center">
                     <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto">
                       <Clock className="w-8 h-8 text-blue-500 animate-pulse" />
                     </div>
                     <div>
                       <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase">Verifikasi Dalam Proses</h4>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Kami sedang memeriksa pembayaranmu. Proses ini biasanya memakan waktu 5-10 menit. Jika terlalu lama, silakan hubungi admin.</p>
                     </div>
                    <a href={generateWaLink()} target="_blank" rel="noreferrer" className="w-full h-14 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl font-black flex items-center justify-center gap-2 text-sm transition-all">
                      <Phone className="w-5 h-5" /> Hubungi Admin via WhatsApp
                    </a>
                 </div>
               )}
            </div>
          )}

          {isSuccess && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl p-12 text-center space-y-6">
              <CheckCircle2 className="w-20 h-20 text-emerald-600 mx-auto" />
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Pembayaran Berhasil!</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Selamat! Akses paket sudah terbuka.</p>
              <Button className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-black" onClick={onBack}>Mulai Belajar</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
