import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Vite config.
//
// Bundle dipecah agar pengguna mobile tidak perlu mengunduh 770 kB sekaligus:
//   - vendor di-cache terpisah (jarang berubah, jadi tidak diunduh ulang)
//   - halaman di-lazy-load oleh React Router (sudah, di App.tsx)
export default defineConfig({
  base: '/',
  plugins: [
    react(), 
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          // React + router: fondasi yang selalu dibutuhkan.
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react-router") ||
            id.includes("node_modules/scheduler/")
          ) {
            return "vendor-react";
          }

          // Klien Supabase cukup besar dan berdiri sendiri.
          if (id.includes("@supabase")) return "vendor-supabase";

          // Animasi hanya dipakai sebagian halaman.
          if (id.includes("framer-motion") || id.includes("motion-dom") || id.includes("motion-utils")) {
            return "vendor-motion";
          }

          // Ikon: satu paket besar, banyak dipakai.
          if (id.includes("lucide-react")) return "vendor-icons";

          // Catatan: recharts sengaja TIDAK dipaksa satu chunk. Rollup sudah
          // memisahkannya per komponen grafik, sehingga dashboard hanya
          // mengunduh grafik yang benar-benar dipakai.
        },
      },
    },
  },
})
