import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Copy,
  CheckCircle2,
  Upload,
  Loader2,
  CreditCard,
  FileText,
  Phone,
  Clock,
  QrCode,
  Banknote,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { createPakasirQris, checkPakasirStatus, type PakasirPaymentData } from "@/lib/pakasir";

interface InvoiceViewProps {
  transactionId: string;
  onBack: () => void;
}

type PaymentTab = "manual" | "pakasir";

export function InvoiceView({ transactionId, onBack }: InvoiceViewProps) {
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Payment tab state
  const [activeTab, setActiveTab] = useState<PaymentTab>("manual");

  // Pakasir QRIS state
  const [qrisData, setQrisData] = useState<PakasirPaymentData | null>(null);
  const [generatingQris, setGeneratingQris] = useState(false);
  const [qrisError, setQrisError] = useState<string | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Settings
  const [waTemplate, setWaTemplate] = useState(
    "Halo Admin FBK,\n\nSaya ingin konfirmasi pembayaran untuk:\n🧾 *Invoice:* {invoice}\n📦 *Paket:* {paket}\n\nSaya sudah mengunggah bukti transfer, mohon bantuannya untuk verifikasi. Terima kasih!"
  );
  const [waNumber, setWaNumber] = useState("6287753646617");
  const [bank, setBank] = useState({
    name: "BRI",
    number: "0356 0108 9005 505",
    owner: "Galih Oktaviano",
  });

  const [timeLeft, setTimeLeft] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // ─── Fetch & Realtime ───────────────────────────────────────────────────────

  useEffect(() => {
    fetchTransaction();
    fetchSettings();

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
            toast.success("Pembayaran Berhasil Dikonfirmasi!", {
              description:
                "Selamat belajar! Akses paket Anda kini telah terbuka penuh.",
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

  // Restore tab & qrisData from DB after fetch
  useEffect(() => {
    if (!transaction) return;
    if (transaction.payment_method === "pakasir_qris" && transaction.pakasir_data) {
      setActiveTab("pakasir");
      setQrisData(transaction.pakasir_data as PakasirPaymentData);
    }
  }, [transaction]);

  // Countdown timer
  useEffect(() => {
    if (!transaction?.expiry_date || transaction.status !== "pending") return;
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

  // Render QR code to canvas when qrisData changes
  useEffect(() => {
    if (!qrisData?.payment_number || !qrCanvasRef.current) return;
    renderQrCode();
  }, [qrisData, activeTab]);

  // Polling otomatis untuk transaksi QRIS — fallback jika webhook telat/gagal
  useEffect(() => {
    if (!transaction || transaction.payment_method !== "pakasir_qris") return;
    if (transaction.status !== "pending") return;

    const poll = setInterval(async () => {
      const result = await checkPakasirStatus(transaction.invoice_id);
      if (result.ok && result.status === "completed") {
        clearInterval(poll);
        // Trigger webhook manual via re-fetch ke edge function
        // Pakasir sudah confirmed, paksa update status di DB
        if (!supabase) return;
        await supabase
          .from("transactions")
          .update({ status: "success", updated_at: new Date().toISOString() })
          .eq("id", transactionId)
          .eq("status", "pending");

        // Grant akses paket
        await supabase.from("user_packages").upsert(
          {
            user_id: transaction.user_id,
            package_id: transaction.package_id,
            transaction_id: transaction.id,
          },
          { onConflict: "user_id,package_id" }
        );

        toast.success("Pembayaran Berhasil!", {
          description: "Akses paket Anda kini telah terbuka penuh.",
          duration: 5000,
        });
        fetchTransaction(true);
      }
    }, 5000); // cek setiap 5 detik

    return () => clearInterval(poll);
  }, [transaction?.id, transaction?.status, transaction?.payment_method]);

  // ─── Data Fetchers ──────────────────────────────────────────────────────────

  const fetchSettings = async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", ["whatsapp_template", "official_contacts", "bank_details"]);
      if (data) {
        data.forEach((item) => {
          if (item.key === "whatsapp_template") setWaTemplate(item.value);
          if (item.key === "official_contacts" && item.value?.whatsapp)
            setWaNumber(item.value.whatsapp);
          if (item.key === "bank_details") setBank(item.value);
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

  // ─── QR Code Renderer (native Canvas — tanpa library tambahan) ──────────────

  const renderQrCode = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    canvas.dataset.filled = "1";
  };

  // ─── Pakasir Actions ────────────────────────────────────────────────────────

  const handleGenerateQris = async () => {
    if (!transaction || !supabase) return;
    setGeneratingQris(true);
    setQrisError(null);

    // Kirim hanya invoiceId — amount diambil dari DB di serverside untuk keamanan
    const result = await createPakasirQris(transaction.invoice_id);

    if (!result.ok) {
      setQrisError(result.error);
      setGeneratingQris(false);
      return;
    }

    // DB update (payment_method + pakasir_data) sudah dilakukan di serverless
    // Kita hanya perlu refresh transaksi dari DB
    setQrisData(result.data);
    setGeneratingQris(false);
    toast.success("QR Code berhasil dibuat!", {
      description: `Total bayar: Rp ${result.data.total_payment.toLocaleString("id-ID")} (sudah termasuk biaya layanan)`,
    });
    // Refresh agar payment_method di state juga ter-update
    fetchTransaction(true);
  };

  const handleRegenerateQris = async () => {
    setQrisData(null);
    await handleGenerateQris();
  };

  // ─── Manual Transfer Actions ────────────────────────────────────────────────

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text.replace(/\s/g, ""));
    toast.success("Berhasil disalin!");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.size > 5 * 1024 * 1024)
      return toast.error("Ukuran file maksimal 5MB");
    setFile(selectedFile);
  };

  const submitProof = async () => {
    if (!file || !supabase || !transaction) return;

    // Cegah upload bukti manual jika sudah pakai QRIS
    if (transaction.payment_method === "pakasir_qris") {
      toast.error("Transaksi ini menggunakan QRIS. Pembayaran dikonfirmasi otomatis.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${transaction.invoice_id}-${Date.now()}.${fileExt}`;
      const filePath = `${transaction.user_id}/${fileName}`;
      await supabase.storage.from("payment-proofs").upload(filePath, file);
      const {
        data: { publicUrl },
      } = supabase.storage.from("payment-proofs").getPublicUrl(filePath);

      await supabase
        .from("transactions")
        .update({
          status: "verifying",
          payment_proof_url: publicUrl,
          payment_method: "manual_transfer",
          updated_at: new Date().toISOString(),
        })
        .eq("id", transactionId);

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

  // ─── QR Image URL (via Google Charts — no extra library needed) ─────────────

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
  const isVerifying = currentStatus === "verifying";
  const isSuccess = currentStatus === "success";

  // Apakah QR Pakasir sudah kadaluarsa?
  const isQrisExpired =
    qrisData?.expired_at && new Date(qrisData.expired_at) < new Date();

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button
            onClick={onBack}
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
              : isVerifying
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          <div
            className={`w-3 h-3 rounded-full animate-pulse ${
              isPending
                ? "bg-amber-500"
                : isVerifying
                ? "bg-blue-500"
                : "bg-emerald-500"
            }`}
          />
          <span className="text-sm font-black uppercase tracking-widest">
            {isPending
              ? "Menunggu Pembayaran"
              : isVerifying
              ? "Menunggu Verifikasi"
              : "Pembayaran Berhasil"}
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
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 text-justify leading-relaxed">
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
              {activeTab === "pakasir" && qrisData && (
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
                  {(activeTab === "pakasir" && qrisData
                    ? qrisData.total_payment
                    : transaction.amount
                  ).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Payment Methods */}
        <div className="lg:col-span-5 space-y-6">
          {(isPending || isVerifying) && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl p-8 space-y-6">
              {/* Countdown */}
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Sisa Waktu</p>
                <div className="inline-flex items-center gap-2 px-6 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-full font-mono text-xl font-black">
                  {timeLeft}
                </div>
              </div>

              {isPending && (
                <>
                  {/* Payment Method Tabs */}
                  <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl">
                    <button
                      onClick={() => setActiveTab("manual")}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        activeTab === "manual"
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      Transfer
                    </button>
                    <button
                      onClick={() => setActiveTab("pakasir")}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        activeTab === "pakasir"
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      QRIS
                    </button>
                  </div>

                  {/* ── Tab: Manual Transfer ── */}
                  {activeTab === "manual" && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                          Transfer {bank.name}
                        </p>
                        <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-3xl border border-slate-100 dark:border-white/5 flex items-center justify-between">
                          <div>
                            <p className="text-xl font-black text-slate-900 dark:text-white">
                              {bank.number}
                            </p>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                              A/N {bank.owner}
                            </p>
                          </div>
                          <button
                            onClick={() => handleCopy(bank.number)}
                            className="p-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          >
                            <Copy className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <input
                        type="file"
                        id="proof-upload"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept="image/*"
                      />
                      <label
                        htmlFor="proof-upload"
                        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-[2rem] cursor-pointer transition-all ${
                          file
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-slate-200 hover:border-blue-500"
                        }`}
                      >
                        {file ? (
                          <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                        ) : (
                          <Upload className="w-10 h-10 text-slate-300 mb-2" />
                        )}
                        <p className="text-xs font-bold text-slate-600">
                          {file ? file.name : "Pilih Bukti Pembayaran"}
                        </p>
                      </label>

                      <Button
                        onClick={submitProof}
                        disabled={!file || uploading}
                        className="w-full h-16 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-500/30"
                      >
                        {uploading ? "Mengirim..." : "Kirim Bukti Pembayaran"}
                      </Button>

                      <div className="flex items-center gap-4 py-2">
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="text-[10px] font-black text-slate-300 uppercase">Atau</span>
                        <div className="flex-1 h-px bg-slate-100" />
                      </div>

                      <a
                        href={generateWaLink()}
                        target="_blank"
                        rel="noreferrer"
                        className={`w-full h-16 rounded-2xl font-black flex items-center justify-center gap-2 text-sm transition-all ${
                          transaction.payment_proof_url
                            ? "bg-emerald-500 text-white shadow-lg"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        <Phone className="w-5 h-5" /> Konfirmasi WhatsApp
                      </a>
                    </div>
                  )}

                  {/* ── Tab: Pakasir QRIS ── */}
                  {activeTab === "pakasir" && (
                    <div className="space-y-5">
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
                          {/* QR Image */}
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

                          {/* Payment info */}
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

                          <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed">
                            Setelah pembayaran berhasil, akses paket akan otomatis terbuka.
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
                </>
              )}

              {/* Status: Verifying */}
              {isVerifying && (
                <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-white/5 text-center">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto">
                    <Clock className="w-8 h-8 text-blue-500 animate-pulse" />
                  </div>
                  {transaction.payment_method === "pakasir_qris" ? (
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase">
                        Menunggu Konfirmasi QRIS
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        Pembayaran QRIS kamu sedang diproses. Akses paket akan terbuka otomatis begitu pembayaran dikonfirmasi.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase">
                          Verifikasi Dalam Proses
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                          Kami sedang memeriksa pembayaranmu. Proses ini biasanya memakan waktu 5–10 menit. Jika terlalu lama, silakan hubungi admin.
                        </p>
                      </div>
                      <a
                        href={generateWaLink()}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full h-14 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl font-black flex items-center justify-center gap-2 text-sm transition-all"
                      >
                        <Phone className="w-5 h-5" /> Hubungi Admin via WhatsApp
                      </a>
                    </>
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
                onClick={onBack}
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
