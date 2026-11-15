#!/usr/bin/env node
/**
 * Validate + build SKD tryout packages into the exact admin import format.
 *
 *   node scripts/validate-tryout.mjs        validate all packages
 *   node scripts/validate-tryout.mjs 1      validate + build package 01
 *   node scripts/validate-tryout.mjs --all  validate + build every package
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SEED = join(ROOT, "supabase", "seed", "skd-2026");
const OUT = join(ROOT, "dist-seed");

const CATEGORIES = { TWK: 30, TIU: 35, TKP: 45 };
const TOTAL = 110;
const OPTIONS = ["A", "B", "C", "D", "E"];

const ALLOWED_SUB = {
  TWK: ["Nasionalisme", "Integritas", "Bela Negara", "Pilar Negara", "Bahasa Indonesia"],
  TIU: [
    "Analogi",
    "Silogisme",
    "Analitis",
    "Deret Angka",
    "Perbandingan Kuantitatif",
    "Numerik",
    "Soal Cerita",
  ],
  TKP: [
    "Pelayanan Publik",
    "Jejaring Kerja",
    "Sosial Budaya",
    "Profesionalisme",
    "Anti Radikalisme",
    "TIK",
  ],
};

function readPart(dir, category) {
  const file = join(SEED, dir, `${category.toLowerCase()}.json`);
  if (!existsSync(file)) return { missing: true, questions: [] };
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    const list = Array.isArray(parsed) ? parsed : parsed.questions;
    return { questions: Array.isArray(list) ? list : [] };
  } catch (err) {
    return { questions: [], parseError: err.message };
  }
}

function validate(dir) {
  const errors = [];
  const parts = {};

  for (const category of Object.keys(CATEGORIES)) {
    const { missing, parseError, questions } = readPart(dir, category);
    parts[category] = questions || [];

    if (missing) {
      errors.push(`${category}: file ${category.toLowerCase()}.json belum ada`);
      continue;
    }
    if (parseError) {
      errors.push(`${category}: JSON tidak valid (${parseError})`);
      continue;
    }
    if (parts[category].length !== CATEGORIES[category]) {
      errors.push(
        `${category}: ${parts[category].length} soal, harus ${CATEGORIES[category]}`,
      );
    }

    parts[category].forEach((q, i) => {
      const tag = `${category}[${i + 1}]`;
      if (q.category !== category) errors.push(`${tag}: category harus "${category}"`);
      if (!ALLOWED_SUB[category].includes(q.sub_category))
        errors.push(`${tag}: sub_category "${q.sub_category}" tidak dikenal`);
      if (!q.question_text || q.question_text.trim().length < 20)
        errors.push(`${tag}: question_text terlalu pendek`);
      if (!q.options || typeof q.options !== "object") {
        errors.push(`${tag}: options wajib ada`);
        return;
      }
      for (const opt of OPTIONS) {
        if (!q.options[opt] || !String(q.options[opt]).trim())
          errors.push(`${tag}: opsi ${opt} kosong`);
      }
      if (!q.explanation || q.explanation.trim().length < 40)
        errors.push(`${tag}: penjelasan minimal 40 karakter`);

      if (category === "TKP") {
        if (q.correct_answer) errors.push(`${tag}: TKP tidak boleh punya correct_answer`);
        if (!q.tkp_scores) {
          errors.push(`${tag}: TKP wajib punya tkp_scores`);
          return;
        }
        const scores = OPTIONS.map((o) => q.tkp_scores[o]);
        if (scores.some((s) => !Number.isInteger(s) || s < 1 || s > 5))
          errors.push(`${tag}: skor TKP harus bilangan bulat 1-5`);
        if (Math.max(...scores) !== 5)
          errors.push(`${tag}: harus ada satu opsi dengan skor 5`);
      } else {
        if (!OPTIONS.includes(q.correct_answer))
          errors.push(`${tag}: correct_answer harus A-E`);
        if (q.tkp_scores) errors.push(`${tag}: ${category} tidak boleh punya tkp_scores`);
      }
    });
  }

  return { errors, parts };
}

function packageName(dir) {
  const meta = join(SEED, dir, "meta.json");
  if (existsSync(meta)) {
    try {
      const parsed = JSON.parse(readFileSync(meta, "utf8"));
      if (parsed && typeof parsed.name === "string" && parsed.name.trim()) {
        return parsed.name.trim();
      }
    } catch {
      // fall through to default
    }
  }
  return `Tryout SKD ${dir} - 2026`;
}

function build(dir, parts) {
  const questions = [];
  let number = 1;
  for (const category of Object.keys(CATEGORIES)) {
    for (const q of parts[category] || []) {
      const row = {
        number: number++,
        category,
        sub_category: q.sub_category,
        question_text: q.question_text,
        options: q.options,
        correct_answer: category === "TKP" ? null : q.correct_answer,
        explanation: q.explanation,
      };
      if (q.fast_tips) row.fast_tips = q.fast_tips;
      if (category === "TKP") row.tkp_scores = q.tkp_scores;
      questions.push(row);
    }
  }
  return { name: packageName(dir), category: "SKD", questions };
}

const arg = process.argv[2];
const dirs =
  arg && !arg.startsWith("-")
    ? [String(arg).padStart(2, "0")]
    : existsSync(SEED)
      ? readdirSync(SEED)
          .filter((d) => /^\d{2}$/.test(d))
          .sort()
      : [];

if (dirs.length === 0) {
  console.log("Tidak ada paket di supabase/seed/skd-2026/");
  process.exit(1);
}

let failed = 0;
for (const dir of dirs) {
  const { errors, parts } = validate(dir);
  const total = Object.values(parts).reduce((n, l) => n + l.length, 0);

  if (errors.length) {
    failed++;
    console.log(`\nGAGAL Paket ${dir} - ${errors.length} masalah (${total}/${TOTAL} soal)`);
    errors.slice(0, 12).forEach((e) => console.log("  - " + e));
    if (errors.length > 12) console.log(`  ... ${errors.length - 12} masalah lain`);
  } else {
    console.log(`\nLULUS Paket ${dir} - ${TOTAL} soal valid (30 TWK / 35 TIU / 45 TKP)`);
    if (!existsSync(OUT)) mkdirSync(OUT);
    const file = join(OUT, `tryout-${dir}.json`);
    writeFileSync(file, JSON.stringify(build(dir, parts), null, 2), "utf8");
    console.log(`  ditulis: dist-seed/tryout-${dir}.json`);
  }
}

process.exit(failed ? 1 : 0);
