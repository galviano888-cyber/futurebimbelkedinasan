import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Loader2,
  CreditCard,
  FileText,
  CheckCircle2,
  QrCode,
  RefreshCw,
  AlertCircle,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { createPakasirQris, type PakasirPaymentData } from "@/lib/pakasir";

interface InvoiceViewProps {
  transactionId: string;
  onBack: (success?: boolean) => void;
}

export function InvoiceView({ transactionId, onBack }: InvoiceViewProps) {
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Pakasir QRIS state
  const [qrisData, setQrisData] = useState<PakasirPaymentData | null>(null);
  const [generatingQris, setGeneratingQris] = useState(false);
  const [qrisError, setQrisError] = useState<string | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Countdown timer — ikut QR expired_at kalau ada, fallback ke expiry_date transaksi
  const [timeLeft, setTimeLeft] = useState("");

  // ─── Fetch & Realtime ───────────────────────────────────────────────────────

  useEffect(() => {
    fetchTransaction();

    if (!supabase) return;
    const channel = supabase
      .channel(`transaction-status-${transactionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "transactions",
          filter: `id=eq.${transactionId}`,
        },
        (payload: any) => {
          if (payload.new?.status === "success") {
            toast.success("Pembayaran Berhasil!", {
              description: "Selamat belajar! Akses paket Anda kini telah terbuka penuh.",
              duration: 5000,
            });
          }
          fetchTransaction();
        }
      )
      .subscribe();

    return () => {
      if (supabase) supabase.removeChannel(channel);
    };
  }, [transactionId]);

  // Restore qrisData dari DB setelah fetch, atau auto-generate kalau belum ada
  useEffect(() => {
    if (!transaction) return;
    if (transaction.pakasir_data) {
      // QR sudah pernah dibuat, restore dari DB
      setQrisData(transaction.pakasir_data as PakasirPaymentData);
    } else if (transaction.status === 'pending' && !qrisData && !generatingQris) {
      // QR belum pernah dibuat, auto-generate
      handleGenerateQris();
    }
  }, [transaction?.id]);

  // Countdown timer — pakai expired_at dari QR jika ada, fallback ke expiry_date transaksi
  useEffect(() => {
    if (transaction?.status !== "pending") return;

    // Prioritas: QR expired_at (lebih relevan untuk user), fallback expiry_date transaksi
    const expirySource = qrisData?.expired_at ?? transaction?.expiry_date;
    if (!expirySource) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expirySource).getTime();
      const diff = expiry - now;
      if (diff <= 0) {
        setTimeLeft("KADALUARSA");
        clearInterval(timer);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours > 0 ? hours + 'j ' : ''}${minutes}m ${seconds}d`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [transaction?.status, qrisData?.expired_at, transaction?.expiry_date]);

  // ─── Data Fetchers ──────────────────────────────────────────────────────────

  const fetchTransaction = async (silent = false) => {
    if (!supabase) return;
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`*, packages (title, description, price)`)
        .eq("id", transactionId)
        .single();
      if (error) throw error;
      setTransaction(data);
    } catch (err) {
      console.error("Error fetching invoice:", err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Pakasir Actions ────────────────────────────────────────────────────────

  const handleGenerateQris = async () => {
    if (!transaction || !supabase) return;
    setGeneratingQris(true);
    setQrisError(null);

    const result = await createPakasirQris(transaction.invoice_id);

    if (!result.ok) {
      setQrisError(result.error);
      setGeneratingQris(false);
      return;
    }

    setQrisData(result.data);
    setGeneratingQris(false);
    toast.success("QR Code berhasil dibuat!", {
      description: `Total bayar: Rp ${result.data.total_payment.toLocaleString("id-ID")} (sudah termasuk biaya layanan)`,
    });
    fetchTransaction(true);
  };

  const handleRegenerateQris = async () => {
    setQrisData(null);
    await handleGenerateQris();
  };

  // Tombol "Saya Sudah Bayar" — panggil pakasir-activate Edge Function
  // Verify ke Pakasir + aktifkan paket dalam satu call, dengan JWT auth + service role
  const handleAlreadyPaid = async () => {
    if (!transaction || !supabase) return;
    setCheckingPayment(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sesi habis. Silakan login ulang.");
        setCheckingPayment(false);
        return;
      }

      const functionsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

      const res = await fetch(`${functionsUrl}/pakasir-activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ invoiceId: transaction.invoice_id }),
      });

      const json = await res.json();
      console.log("pakasir-activate response:", json);

      if (res.ok && json.message === "OK") {
        toast.success("Pembayaran Berhasil!", {
          description: "Akses paket sudah terbuka. Selamat belajar!",
          duration: 3000,
        });
        setTimeout(() => onBack(true), 2000);
      } else if (res.status === 402) {
        toast.error("Pembayaran belum terkonfirmasi", {
          description: "Pastikan pembayaran sudah berhasil di aplikasi kamu, lalu coba lagi.",
        });
      } else {
        toast.error("Terjadi kesalahan", {
          description: json.error ?? "Coba beberapa saat lagi.",
        });
      }
    } catch (err: any) {
      console.error("handleAlreadyPaid error:", err);
      toast.error("Koneksi bermasalah. Coba lagi.");
    } finally {
      setCheckingPayment(false);
    }
  };

  // ─── QR Image URL ──────────────────────────────────────────────────────────────

  const getQrImageUrl = (qrString: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrString)}&margin=10`;

  // ─── Render Guards ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-bold mt-4 tracking-widest uppercase text-[10px]">
          Menyiapkan Invoice...
        </p>
      </div>
    );
  }

  if (!transaction)
    return <div className="p-8 text-center">Invoice tidak ditemukan.</div>;

  const currentStatus = transaction.status?.toLowerCase();
  const isPending = currentStatus === "pending";
  const isSuccess = currentStatus === "success";
  const isQrisExpired =
    qrisData?.expired_at && new Date(qrisData.expired_at) < new Date();

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button
            onClick={() => onBack()}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-4 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" /> Invoice Pembayaran
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            ID:{" "}
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {transaction.invoice_id}
            </span>
          </p>
        </div>
        <div
          className={`px-6 py-3 rounded-2xl flex items-center gap-3 border shadow-sm ${
            isPending
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          <div className={`w-3 h-3 rounded-full animate-pulse ${
            isPending ? "bg-amber-500" : "bg-emerald-500"
          }`} />
          <span className="text-sm font-black uppercase tracking-widest">
            {isPending ? "Menunggu Pembayaran" : "Pembayaran Berhasil"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Order Summary */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl p-8">
            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6">
              Ringkasan Pesanan
            </h3>
            <div className="flex items-start gap-4 p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 dark:text-white">
                  {transaction.packages.title}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 text-left leading-relaxed">
                  {transaction.packages.description}
                </p>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-slate-500 dark:text-slate-400">Harga Paket</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  Rp {transaction.amount.toLocaleString("id-ID")}
                </span>
              </div>
              {qrisData && (
                <div className="flex justify-between items-center mt-3">
                  <span className="text-base font-bold text-slate-500 dark:text-slate-400">
                    Biaya Layanan QRIS
                  </span>
                  <span className="text-base font-black text-orange-500">
                    +Rp {qrisData.fee.toLocaleString("id-ID")}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                <span className="text-lg font-black text-slate-900 dark:text-white">Total Tagihan</span>
                <span className="text-2xl font-black text-blue-600">
                  Rp{" "}
                  {(qrisData ? qrisData.total_payment : transaction.amount).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: QRIS Payment */}
        <div className="lg:col-span-5 space-y-6">
          {isPending && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl p-8 space-y-6">
              {/* Countdown — ikut QR timer kalau sudah generate */}
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">
                  {qrisData ? "QR Berlaku" : "Sisa Waktu"}
                </p>
                <div className={`inline-flex items-center gap-2 px-6 py-2 rounded-full font-mono text-xl font-black ${
                  timeLeft === "KADALUARSA"
                    ? "bg-red-500 text-white"
                    : "bg-slate-900 dark:bg-blue-600 text-white"
                }`}>
                  {timeLeft || "--:--"}
                </div>
              </div>

              {/* Belum generate QR */}
              {!qrisData && !generatingQris && (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-500/20">
                    <QrCode className="w-10 h-10 text-indigo-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Bayar via QRIS
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Scan QR code dengan aplikasi apapun — GoPay, OVO, Dana, ShopeePay, mobile banking, dll.
                    </p>
                    <p className="text-[10px] font-bold text-orange-500 mt-2">
                      * Biaya layanan QRIS akan ditambahkan ke total tagihan
                    </p>
                  </div>
                  {qrisError && (
                    <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-left">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs font-bold text-red-600 dark:text-red-400">{qrisError}</p>
                    </div>
                  )}
                  <Button
                    onClick={handleGenerateQris}
                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/30"
                  >
                    <QrCode className="w-5 h-5 mr-2" />
                    Buat QR Code
                  </Button>
                </div>
              )}

              {/* Loading generate */}
              {generatingQris && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Membuat QR Code...
                  </p>
                </div>
              )}

              {/* QR sudah ada */}
              {qrisData && !generatingQris && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-white rounded-3xl border-2 border-slate-100 shadow-lg">
                      {isQrisExpired ? (
                        <div className="w-[200px] h-[200px] flex flex-col items-center justify-center gap-2 bg-slate-50 rounded-2xl">
                          <AlertCircle className="w-10 h-10 text-slate-300" />
                          <p className="text-xs font-bold text-slate-400">QR Kadaluarsa</p>
                        </div>
                      ) : (
                        <img
                          src={getQrImageUrl(qrisData.payment_number)}
                          alt="QR Code Pembayaran"
                          width={200}
                          height={200}
                          className="rounded-2xl"
                          loading="eager"
                        />
                      )}
                    </div>
                    <canvas ref={qrCanvasRef} className="hidden" />
                  </div>

                  <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl p-4 space-y-2 border border-indigo-100 dark:border-indigo-500/20">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Bayar</span>
                      <span className="text-lg font-black text-indigo-700 dark:text-indigo-300">
                        Rp {qrisData.total_payment.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Berlaku Hingga</span>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {new Date(qrisData.expired_at).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Tombol Saya Sudah Bayar */}
                  {!isQrisExpired && (
                    <Button
                      onClick={handleAlreadyPaid}
                      disabled={checkingPayment}
                      className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/30"
                    >
                      {checkingPayment ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Mengecek Pembayaran...</>
                      ) : (
                        <><CheckCheck className="w-5 h-5 mr-2" /> Saya Sudah Bayar</>
                      )}
                    </Button>
                  )}

                  <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed">
                    Tekan tombol di atas setelah scan & bayar berhasil.
                  </p>

                  {isQrisExpired && (
                    <Button
                      onClick={handleRegenerateQris}
                      variant="outline"
                      className="w-full h-12 rounded-2xl font-black text-xs"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Buat QR Baru
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Status: Success */}
          {isSuccess && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl p-12 text-center space-y-6">
              <CheckCircle2 className="w-20 h-20 text-emerald-600 mx-auto" />
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Pembayaran Berhasil!
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Selamat! Akses paket sudah terbuka.
              </p>
              <Button
                className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-black"
                onClick={() => { onBack(true); }}
              >
                Mulai Belajar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
