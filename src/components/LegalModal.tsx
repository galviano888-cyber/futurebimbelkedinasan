import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, ShieldAlert } from "lucide-react";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

export function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  const isTerms = type === 'terms';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none bg-slate-900 rounded-[2.5rem] shadow-2xl">
        <div className="relative p-8 md:p-10">
          <DialogHeader className="mb-6">
            <div className={`w-12 h-12 ${isTerms ? 'bg-blue-600/20 text-blue-500' : 'bg-emerald-600/20 text-emerald-500'} rounded-xl flex items-center justify-center mb-4`}>
              {isTerms ? <FileText className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <DialogTitle className="text-2xl font-black text-white tracking-tight">
              {isTerms ? "Syarat & Ketentuan Layanan" : "Kebijakan Privasi"}
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">
              Terakhir diperbarui: 21 April 2026
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px] pr-6 -mr-2">
            <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
              {isTerms ? (
                <>
                  <section>
                    <h4 className="text-white font-bold mb-2 uppercase tracking-wider text-xs">1. Penerimaan Ketentuan</h4>
                    <p className="text-justify">Dengan mendaftar dan menggunakan layanan Future Bimbel Kedinasan (FBK), Anda menyatakan telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan ini. Jika Anda tidak setuju, mohon untuk tidak melanjutkan penggunaan layanan kami.</p>
                  </section>
                  <section>
                    <h4 className="text-white font-bold mb-2 uppercase tracking-wider text-xs">2. Akun Pengguna</h4>
                    <p className="text-justify">Anda bertanggung jawab penuh atas kerahasiaan akun dan password Anda. Satu akun hanya diperbolehkan digunakan oleh satu orang. Berbagi akun (account sharing) sangat dilarang dan dapat mengakibatkan pemblokiran akun secara permanen tanpa pengembalian dana.</p>
                  </section>
                  <section>
                    <h4 className="text-white font-bold mb-2 uppercase tracking-wider text-xs">3. Akses Produk & Konten Digital</h4>
                    <p className="text-justify">Layanan FBK menyediakan konten digital berupa video materi, file PDF, dan simulasi CAT (Tryout). Akses diberikan setelah pembayaran terkonfirmasi. FBK berhak mengubah, menambah, atau menghapus konten sewaktu-waktu demi meningkatkan kualitas layanan.</p>
                  </section>
                  <section>
                    <h4 className="text-white font-bold mb-2 uppercase tracking-wider text-xs">4. Kebijakan Pembatalan & Refund</h4>
                    <p className="text-justify">Karena produk kami bersifat digital yang langsung dapat diakses setelah pembelian, seluruh transaksi bersifat final. Tidak ada pengembalian dana (refund) dengan alasan apapun, kecuali terjadi kegagalan sistem fatal yang mengakibatkan konten tidak dapat diakses sama sekali.</p>
                  </section>
                  <section>
                    <h4 className="text-white font-bold mb-2 uppercase tracking-wider text-xs">5. Hak Kekayaan Intelektual</h4>
                    <p className="text-justify">Seluruh materi di FBK dilindungi hak cipta. Dilarang keras merekam, menyebarluaskan, atau menjual kembali materi FBK tanpa izin tertulis. Pelanggaran terhadap poin ini akan diproses secara hukum sesuai undang-undang yang berlaku di Indonesia.</p>
                  </section>
                </>
              ) : (
                <>
                  <section>
                    <h4 className="text-white font-bold mb-2 uppercase tracking-wider text-xs">1. Data yang Kami Kumpulkan</h4>
                    <p className="text-justify">Kami mengumpulkan informasi pribadi seperti Nama Lengkap, Alamat Email, Nomor WhatsApp, dan Asal Sekolah saat Anda mendaftar. Data ini diperlukan untuk identifikasi akun, pengiriman info belajar, dan keperluan administrasi transaksi.</p>
                  </section>
                  <section>
                    <h4 className="text-white font-bold mb-2 uppercase tracking-wider text-xs">2. Penggunaan Data Tryout</h4>
                    <p className="text-justify">Skor dan hasil simulasi (Tryout) yang Anda kerjakan akan kami simpan dan tampilkan di fitur Leaderboard (Ranking Nasional). Hal ini bertujuan untuk memberikan gambaran kompetisi yang nyata bagi seluruh siswa FBK. Anda menyetujui nama Anda muncul di papan peringkat tersebut.</p>
                  </section>
                  <section>
                    <h4 className="text-white font-bold mb-2 uppercase tracking-wider text-xs">3. Keamanan Informasi</h4>
                    <p className="text-justify">Kami berkomitmen untuk menjaga keamanan data Anda. Kami menggunakan enkripsi standar industri untuk melindungi informasi sensitif selama proses transmisi data. Kami tidak akan menjual atau menyewakan data pribadi Anda kepada pihak ketiga manapun.</p>
                  </section>
                  <section>
                    <h4 className="text-white font-bold mb-2 uppercase tracking-wider text-xs">4. Komunikasi</h4>
                    <p className="text-justify">Dengan mendaftar, Anda setuju untuk menerima komunikasi dari kami melalui Email atau WhatsApp terkait update materi, jadwal live class, atau informasi promo layanan Future Bimbel Kedinasan.</p>
                  </section>
                  <section>
                    <h4 className="text-white font-bold mb-2 uppercase tracking-wider text-xs">5. Cookies & Pelacakan</h4>
                    <p className="text-justify">Situs kami menggunakan cookies untuk meningkatkan pengalaman pengguna, mengingat sesi login Anda, dan menganalisis trafik situs demi optimasi layanan di masa depan.</p>
                  </section>
                </>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="mt-8 border-t border-white/5 pt-6 flex flex-col sm:flex-row gap-4">
             <Button 
                onClick={onClose} 
                className={`w-full h-12 ${isTerms ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white font-black uppercase tracking-widest rounded-xl transition-all`}
             >
               SAYA MENGERTI
             </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
