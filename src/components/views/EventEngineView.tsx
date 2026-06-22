import { Suspense, lazy } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const TryoutEngineView = lazy(() =>
  import("@/components/views/TryoutEngineView").then(m => ({ default: m.TryoutEngineView }))
);

const fallback = (
  <div className="fixed inset-0 bg-[#eef0f4] dark:bg-[#0a0a0f] flex flex-col items-center justify-center">
    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Memuat Sesi Event...</p>
  </div>
);

export function EventEngineView() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  // Read context stored by EventsView before navigation
  const raw = sessionStorage.getItem("fbk_event_context");
  const context = raw ? JSON.parse(raw) : null;

  if (!context || context.eventId !== eventId) {
    // Guard: if someone lands here without context, send back
    navigate("/events", { replace: true });
    return null;
  }

  const handleFinish = async (result: any) => {
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      // Save result to event_results
      const { error } = await supabase.from("event_results").insert({
        event_id: context.eventId,
        user_id: user.id,
        total: result.totalScore ?? result.total ?? 0,
        twk: result.twkScore ?? result.twk ?? 0,
        tiu: result.tiuScore ?? result.tiu ?? 0,
        tkp: result.tkpScore ?? result.tkp ?? 0,
        answers: result.answers || {},
        score_details: result.score_details || null,
        finished_at: new Date().toISOString(),
      });

      if (error) {
        // If duplicate (user already submitted), just continue
        if (error.code === "23505") {
          toast.info("Kamu sudah pernah mengikuti event ini.");
        } else {
          throw error;
        }
      } else {
        toast.success("Hasil event berhasil disimpan!");
      }
    } catch (err: any) {
      toast.error("Gagal menyimpan hasil event: " + err.message);
    } finally {
      sessionStorage.removeItem("fbk_event_context");
      navigate("/events", { replace: true });
    }
  };

  const handleExit = () => {
    sessionStorage.removeItem("fbk_event_context");
    navigate("/events", { replace: true });
  };

  return (
    <Suspense fallback={fallback}>
      <TryoutEngineView
        packageId={context.packageId}
        questionsId={context.questionsId}
        onFinish={handleFinish}
        onExit={handleExit}
      />
    </Suspense>
  );
}
