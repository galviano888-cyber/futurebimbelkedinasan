import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const SRC = "C:/Users/MyBook Hype AMD/Downloads/Gemini_Generated_Image_ywcq59ywcq59ywcq.jpg";
const OUT = "D:/Antigravity/futurebimbelkedinasan/public";

// Batas konten logo pada gambar asli (1408 x 768).
const CROP = { x: 514, y: 200, w: 380, h: 368 };

const base64 = readFileSync(SRC).toString("base64");

const browser = await chromium.launch();
const page = await browser.newPage();

const result = await page.evaluate(
  async ({ src, crop }) => {
    const img = new Image();
    img.src = src;
    await img.decode();

    const size = Math.max(crop.w, crop.h);

    function draw({ white }) {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      // Isi kotak dengan lambang, dipusatkan.
      const offX = (size - crop.w) / 2;
      const offY = (size - crop.h) / 2;
      ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, offX, offY, crop.w, crop.h);

      // Latar krem dijadikan transparan (warna lambang navy tetap utuh).
      const data = ctx.getImageData(0, 0, size, size);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        const r = px[i];
        const g = px[i + 1];
        const b = px[i + 2];
        const isCream = r > 222 && g > 222 && b > 214;
        if (isCream) {
          px[i + 3] = 0;
        } else {
          // Tepi anti-alias: jadikan separuh transparan agar tidak bergerigi.
          const light = (r + g + b) / 3;
          if (light > 190) px[i + 3] = Math.round(((232 - light) / 42) * 255);
        }
      }
      ctx.putImageData(data, 0, 0);

      // Versi putih: warnai seluruh piksel yang tersisa, alpha dipertahankan.
      if (white) {
        const whiteData = ctx.getImageData(0, 0, size, size);
        const wp = whiteData.data;
        for (let i = 0; i < wp.length; i += 4) {
          if (wp[i + 3] === 0) continue;
          wp[i] = 255;
          wp[i + 1] = 255;
          wp[i + 2] = 255;
        }
        ctx.putImageData(whiteData, 0, 0);
      }

      return canvas.toDataURL("image/png");
    }

    return {
      mark: draw({ white: false }),
      markLight: draw({ white: true }),
    };
  },
  { src: `data:image/jpeg;base64,${base64}`, crop: CROP }
);

for (const [key, file] of [
  ["mark", "logo-mark.png"],
  ["markLight", "logo-mark-light.png"],
]) {
  writeFileSync(`${OUT}/${file}`, Buffer.from(result[key].split(",")[1], "base64"));
  console.log(`${file} dibuat`);
}

await browser.close();
