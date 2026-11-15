import { readFileSync, writeFileSync } from "node:fs";

const input = process.argv[2] || "dist-seed/tryout-06.json";
const output = process.argv[3] || "dist-seed/preview-06.html";
const pkg = JSON.parse(readFileSync(input, "utf8"));
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const cards = pkg.questions
  .map((q) => {
    const isTkp = q.category === "TKP";
    const best = isTkp
      ? Object.entries(q.tkp_scores).sort((a, b) => b[1] - a[1])[0][0]
      : q.correct_answer;

    const options = ["A", "B", "C", "D", "E"]
      .map((L) => {
        const score = isTkp ? `<span class="score">${q.tkp_scores[L]}</span>` : "";
        return `<li class="opt${L === best ? " best" : ""}" data-letter="${L}">
          <span class="letter">${L}</span>
          <span class="otext">${esc(q.options[L])}</span>${score}
        </li>`;
      })
      .join("");

    return `<article class="card" data-cat="${q.category}">
      <header>
        <span class="num">${q.number}</span>
        <span class="badge ${q.category}">${q.category}</span>
        <span class="sub">${esc(q.sub_category)}</span>
      </header>
      <p class="q">${esc(q.question_text).replace(/\n/g, "<br>")}</p>
      <ol class="opts">${options}</ol>
      <div class="answer">
        <p><strong>Kunci:</strong> ${isTkp ? "skor tertinggi " + best : best} — ${esc(q.options[best])}</p>
        <p><strong>Pembahasan:</strong> ${esc(q.explanation)}</p>
        ${q.fast_tips ? `<p class="tips"><strong>Tips:</strong> ${esc(q.fast_tips)}</p>` : ""}
      </div>
    </article>`;
  })
  .join("\n");

const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pratinjau — ${esc(pkg.name)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
         background:#f1f5f9; color:#0f172a; line-height:1.6; }
  .wrap { max-width: 860px; margin: 0 auto; padding: 28px 18px 80px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .meta { color:#64748b; font-size: 13px; margin-bottom: 18px; }
  .toolbar { position: sticky; top:0; z-index:5; background:rgba(241,245,249,.95);
             backdrop-filter: blur(6px); padding:12px 0; display:flex; gap:8px; flex-wrap:wrap;
             border-bottom:1px solid #e2e8f0; margin-bottom:18px; }
  .toolbar button { border:1px solid #cbd5e1; background:#fff; border-radius:999px;
                    padding:7px 14px; font-size:13px; font-weight:600; cursor:pointer; }
  .toolbar button.active { background:#0f172a; color:#fff; border-color:#0f172a; }
  .toolbar .spacer { flex:1; }
  .toolbar label { font-size:13px; display:flex; align-items:center; gap:6px; color:#334155; }
  .card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:18px 20px;
          margin-bottom:14px; box-shadow:0 1px 2px rgba(15,23,42,.04); }
  .card header { display:flex; align-items:center; gap:8px; margin-bottom:10px; flex-wrap:wrap; }
  .num { font-weight:800; color:#0f172a; }
  .badge { font-size:11px; font-weight:700; padding:3px 9px; border-radius:999px; }
  .badge.TWK { background:#dbeafe; color:#1d4ed8; }
  .badge.TIU { background:#dcfce7; color:#15803d; }
  .badge.TKP { background:#fef3c7; color:#b45309; }
  .sub { font-size:12px; color:#64748b; }
  .q { margin:0 0 12px; }
  .opts { list-style:none; margin:0; padding:0; display:grid; gap:6px; }
  .opt { display:flex; gap:10px; align-items:flex-start; border:1px solid #e2e8f0;
         border-radius:10px; padding:9px 12px; background:#f8fafc; }
  .opt .letter { font-weight:800; color:#475569; min-width:16px; }
  .opt .otext { flex:1; }
  .opt .score { font-size:12px; font-weight:800; color:#b45309; background:#fef3c7;
                border-radius:999px; padding:1px 8px; }
  .opt.best { border-color:#22c55e; background:#f0fdf4; }
  .answer { display:none; margin-top:12px; padding-top:12px; border-top:1px dashed #cbd5e1;
            font-size:14px; }
  .answer p { margin:0 0 6px; }
  .tips { color:#0f766e; }
  body.show-answers .answer { display:block; }
  .hide { display:none !important; }
  @media print {
    .toolbar { display:none; }
    .answer { display:block; }
    .card { break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="wrap">
  <h1>${esc(pkg.name)}</h1>
  <div class="meta">${pkg.questions.length} soal · 30 TWK · 35 TIU · 45 TKP · durasi 100 menit · paket ${esc(pkg.category)}</div>

  <div class="toolbar">
    <button data-filter="ALL" class="active">Semua (${pkg.questions.length})</button>
    <button data-filter="TWK">TWK (30)</button>
    <button data-filter="TIU">TIU (35)</button>
    <button data-filter="TKP">TKP (45)</button>
    <span class="spacer"></span>
    <label><input type="checkbox" id="toggleAnswers"> Tampilkan kunci &amp; pembahasan</label>
  </div>

  <main id="list">
${cards}
  </main>
</div>
<script>
  const buttons = document.querySelectorAll(".toolbar button[data-filter]");
  buttons.forEach(b => b.addEventListener("click", () => {
    buttons.forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    const f = b.dataset.filter;
    document.querySelectorAll(".card").forEach(c => {
      c.classList.toggle("hide", f !== "ALL" && c.dataset.cat !== f);
    });
  }));
  document.getElementById("toggleAnswers").addEventListener("change", (e) => {
    document.body.classList.toggle("show-answers", e.target.checked);
  });
</script>
</body>
</html>`;

writeFileSync(output, html, "utf8");
console.log("preview ditulis: " + output);
