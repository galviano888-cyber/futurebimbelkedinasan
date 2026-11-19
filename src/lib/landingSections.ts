export interface HeroSignal {
  label: string;
  value: string;
}

export interface LandingSections {
  hero: {
    image: string;
    secondaryCta: string;
    loginHint: string;
    signals: HeroSignal[];
  };
  features: {
    eyebrow: string;
    title: string;
    description: string;
  };
  plan: {
    eyebrow: string;
    title: string;
    description: string;
    steps: Array<{ title: string; text: string }>;
  };
  pricing: {
    eyebrow: string;
    title: string;
    description: string;
    note: string;
  };
  faq: {
    eyebrow: string;
    title: string;
    description: string;
  };
  footer: {
    ctaTitle: string;
    ctaText: string;
    ctaButton: string;
    description: string;
  };
}

export const DEFAULT_LANDING_SECTIONS: LandingSections = {
  hero: {
    image: "/hero-squad-blue.webp",
    secondaryCta: "Lihat Paket",
    loginHint: "Sudah punya akun? Masuk",
    signals: [
      { label: "Fokus", value: "Seleksi kedinasan" },
      { label: "Latihan", value: "Tryout & simulasi" },
      { label: "Tinjauan", value: "Skor & pembahasan" },
    ],
  },
  features: {
    eyebrow: "Fitur Belajar",
    title: "Persiapan menuju sekolah kedinasan.",
    description:
      "Bangun rutinitas belajar, berlatih untuk seleksi, dan tinjau perkembanganmu secara berkala.",
  },
  plan: {
    eyebrow: "Rencana Belajar",
    title: "Dari latihan ke tinjauan hasil.",
    description:
      "Pilih latihan, kerjakan soal, lalu gunakan hasilnya untuk menentukan fokus belajar berikutnya.",
    steps: [
      {
        title: "Tentukan tujuan",
        text: "Kenali sekolah kedinasan dan tahapan seleksi yang ingin kamu persiapkan.",
      },
      {
        title: "Susun rutinitas",
        text: "Pilih materi dan latihan yang tersedia, termasuk tryout SKD TWK, TIU, dan TKP.",
      },
      {
        title: "Tinjau progres",
        text: "Tinjau hasil latihan dan gunakan pembahasan yang tersedia untuk merencanakan langkah berikutnya.",
      },
    ],
  },
  pricing: {
    eyebrow: "Pilihan Paket",
    title: "Pilih dukungan belajar untuk tujuan kedinasanmu.",
    description: "Temukan paket belajar atau latihan yang sesuai dengan tahap persiapanmu.",
    note: "Detail akses dan langkah pemesanan tersedia di halaman katalog paket.",
  },
  faq: {
    eyebrow: "Pertanyaan Umum",
    title: "Masih ada pertanyaan?",
    description: "Informasi singkat tentang latihan dan paket FBK.",
  },
  footer: {
    ctaTitle: "Siapkan langkahmu menuju sekolah kedinasan.",
    ctaText:
      "Mulai persiapan masuk sekolah kedinasan dengan latihan dan tinjauan belajar yang terarah.",
    ctaButton: "Mulai Sekarang",
    description:
      "Platform pendamping persiapan sekolah kedinasan dengan latihan seleksi, tryout, hasil, dan pembahasan.",
  },
};

const text = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() !== "" ? value : fallback;

/**
 * Gabungkan nilai dari CMS dengan nilai bawaan. Field yang belum diisi admin
 * tetap memakai teks bawaan supaya landing page tidak pernah kosong.
 */
export function mergeLandingSections(value: unknown): LandingSections {
  const raw = (value ?? {}) as Record<string, any>;
  const base = DEFAULT_LANDING_SECTIONS;

  const signals = Array.isArray(raw?.hero?.signals)
    ? base.hero.signals.map((fallback, index) => {
        const item = raw.hero.signals[index] ?? {};
        return {
          label: text(item.label, fallback.label),
          value: text(item.value, fallback.value),
        };
      })
    : base.hero.signals;

  const steps = Array.isArray(raw?.plan?.steps)
    ? base.plan.steps.map((fallback, index) => {
        const item = raw.plan.steps[index] ?? {};
        return {
          title: text(item.title, fallback.title),
          text: text(item.text, fallback.text),
        };
      })
    : base.plan.steps;

  return {
    hero: {
      image: text(raw?.hero?.image, base.hero.image),
      secondaryCta: text(raw?.hero?.secondaryCta, base.hero.secondaryCta),
      loginHint: text(raw?.hero?.loginHint, base.hero.loginHint),
      signals,
    },
    features: {
      eyebrow: text(raw?.features?.eyebrow, base.features.eyebrow),
      title: text(raw?.features?.title, base.features.title),
      description: text(raw?.features?.description, base.features.description),
    },
    plan: {
      eyebrow: text(raw?.plan?.eyebrow, base.plan.eyebrow),
      title: text(raw?.plan?.title, base.plan.title),
      description: text(raw?.plan?.description, base.plan.description),
      steps,
    },
    pricing: {
      eyebrow: text(raw?.pricing?.eyebrow, base.pricing.eyebrow),
      title: text(raw?.pricing?.title, base.pricing.title),
      description: text(raw?.pricing?.description, base.pricing.description),
      note: text(raw?.pricing?.note, base.pricing.note),
    },
    faq: {
      eyebrow: text(raw?.faq?.eyebrow, base.faq.eyebrow),
      title: text(raw?.faq?.title, base.faq.title),
      description: text(raw?.faq?.description, base.faq.description),
    },
    footer: {
      ctaTitle: text(raw?.footer?.ctaTitle, base.footer.ctaTitle),
      ctaText: text(raw?.footer?.ctaText, base.footer.ctaText),
      ctaButton: text(raw?.footer?.ctaButton, base.footer.ctaButton),
      description: text(raw?.footer?.description, base.footer.description),
    },
  };
}
