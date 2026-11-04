#!/usr/bin/env node
/**
 * Build + validate SKD tryout packages.
 *
 *   node scripts/build-tryout.mjs            -> validate all packages
 *   node scripts/build-tryout.mjs 1          -> build+validate package 01
 *   node scripts/build-tryout.mjs --all-out  -> write every package to dist-seed
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SEED = join(ROOT, "supabase", "seed", "skd-2026");
const OUT = join(ROOT, "dist-seed");

const BLUEPRINT = {
  duration_minutes: 100,
  total: 110,
  categories: {
    TWK: { count: 30, scoring: "correct" },
    TIU: { count: 35, scoring: "correct" },
    TKP: { count: 45, scoring: "weighted" },
  },
};

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

const OPTIONS = ["A", "B", "C", "D", "E"];

function readPart(dir, category) {
  const file = join(SEED, dir, `${category.toLowerCase()}.json`);
  if (!existsSync(file)) return { file, questions: null };
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    const arr = Array.isArray(parsed) ? parsed : parsed.questions;
    return { file, questions: Array.isArray(arr) ? arr : null };
  } catch (err) {
    return { file, questions: null, error: err.message };
  }
}

function validatePackage(dir) {
  const errors = [];
  const parts = {};

  for (const category of Object.keys(BLUEPRINT.categories)) {
    const { file, questions, error } = readPart(dir, category);
    if (error) {
      errors.push(`${category}: JSON tidak valid (${error})`);
      parts[category] = [];
      continue;
    }
    if (!questions) {
      errors.push(`${category}: file ${file.replace(ROOT + "\\", "")} belum ada`);
      parts[category] = [];
      continue;
    }
    parts[category] = questions;
  }

  for (const [category, spec] of Object.entries(BLUEPRINT.categories)) {
    const list = parts[category] || [];
    if (list.length !== spec.count) {
      errors.push(`${category}: ${list.length} soal, harus ${spec.count}`);
    }

    list.forEach((q, i) => {
      const tag = `${category}[${i + 1}]`;
      if (q.category !== category) errors.push(`${tag}: category harus "${category}"`);
      if (!q.question_text || q.question_text.trim().length < 20)
        errors.push(`${tag}: question_text terlalu pendek`);
      if (!ALLOWED_SUB[category].includes(q.sub_category))
        errors.push(`${tag}: sub_category "${q.sub_category}" tidak dikenal`);

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

      if (spec.scoring === "correct") {
        if (!OPTIONS.includes(q.correct_answer))
          errors.push(`${tag}: correct_answer harus A-E`);
        if (q.tkp_scores) errors.push(`${tag}: TWK/TIU tidak boleh punya tkp_scores`);
      } else {
        if (q.correct_answer) errors.push(`${tag}: TKP tidak boleh punya correct_answer`);
        if (!q.tkp_scores) {
          errors.push(`${tag}: TKP wajib punya tkp_scores`);
        } else {
          const scores = OPTIONS.map((o) => q.tkp_scores[o]);
          if (scores.some((s) => !Number.isInteger(s) || s < 1 || s > 5))
            errors.push(`${tag}: skor TKP harus bilangan bulat 1-5`);
          if (new Set(scores).size !== 5)
            errors.push(`${tag}: skor TKP kelima opsi harus berbeda`);
        }
      }
    });
  }

  return { errors, parts };
}

function buildPackage(dir, parts) {
  const questions = [];
  let number = 1;
  for (const category of Object.keys(BLUEPRINT.categories)) {
    for (const q of parts[category] || []) {
      questions.push({
        number: number++,
        category,
        sub_category: q.sub_category,
        question_text: q.question_text,
        question_image_url: q.question_image_url || "",
        options: q.options,
        options_image_url: q.options_image_url || { A: "", B: "", C: "", D: "", E: "" },
        correct_answer: q.correct_answer ?? null,
        tkp_scores: q.tkp_scores ?? null,
        explanation: q.explanation,
        fast_tips: q.fast_tips || "",
      });
    }
  }
  return {
    package_name: `Tryout SKD ${dir} - 2026`,
    duration_minutes: BLUEPRINT.duration_minutes,
    questions,
  };
}

const arg = process.argv[2];
const dirs = arg && !arg.startsWith("-") ? [String(arg).padStart(2, "0")] : 
  existsSync(SEED) ? readdirSync(SEED).filter((d) => /^\d{2}$/.test(d)).sort() : [];

if (dirs.length === 0) {
  console.error("Tidak ada paket di supabase/seed/skd-2026/");
  process.exit(1);
}

let failed = 0;
for (const dir of dirs) {
  const { errors, parts } = validatePackage(dir);
  const total = Object.values(parts).reduce((n, l) => n + (l?.length || 0), 0);
  if (errors.length) {
    failed++;
    console.log(`\n✗ Paket ${dir} — ${errors.length} masalah (${total}/110 soal)`);
    errors.slice(0, 15).forEach((e) => console.log("   • " + e));
    if (errors.length > 15) console.log(`   … ${errors.length - 15} masalah lain`);
  } else {
    console.log(`\n✓ Paket ${dir} — 110 soal valid`);
    if (process.argv.includes("--out")) {
      if (!existsSync(OUT)) mkdirSync(OUT);
      const file = join(OUT, `tryout-${dir}.json`);
      writeFileSync(file, JSON.stringify(buildPackage(dir, parts), null, 2), "utf8");
      console.log(`   ditulis: ${file.replace(ROOT + "\\", "")}`);
    }
  }
}

process.exit(failed ? 1 : 0);
