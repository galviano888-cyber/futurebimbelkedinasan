import { useState, useEffect } from "react";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface PaymentHistoryProps {
  onViewInvoice: (id: string) => void;
}

export function PaymentHistory({ onViewInvoice }: PaymentHistoryProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('transactions')
        .select('*, packages(title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>;
  if (transactions.length === 0) return null;

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm space-y-4">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Riwayat Pembayaran</h3>
      <div className="space-y-3">
        {transactions.map((tx) => (
          <button
            key={tx.id}
            onClick={() => onViewInvoice(tx.id)}
            className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-50 bg-slate-50/50 hover:bg-white hover:border-blue-100 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                tx.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' :
                tx.status === 'VERIFYING' ? 'bg-blue-50 text-blue-600' :
                tx.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                'bg-slate-100 text-slate-400'
              }`}>
                {tx.status === 'SUCCESS' ? <CheckCircle2 className="w-5 h-5" /> :
                 tx.status === 'PENDING' ? <Clock className="w-5 h-5" /> :
                 tx.status === 'VERIFYING' ? <AlertCircle className="w-5 h-5" /> :
                 <XCircle className="w-5 h-5" />}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-800 line-clamp-1">{tx.packages?.title}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{tx.invoice_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                 tx.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' :
                 tx.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                 tx.status === 'VERIFYING' ? 'bg-blue-100 text-blue-700' :
                 'bg-slate-200 text-slate-500'
               }`}>
                 {tx.status}
               </span>
               <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
