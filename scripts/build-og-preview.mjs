// Ambil preview 1200x630 dari hero landing page produksi.
import { chromium } from "playwright";

const OUT = "D:/Antigravity/futurebimbelkedinasan/public/og-preview.png";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2,
});

await page.goto("https://www.futurebimbelkedinasan.com/", { waitUntil: "networkidle", timeout: 90000 });

// Sembunyikan elemen mengambang yang mengganggu preview.
await page.addStyleTag({
  content: `
    a[href*="wa.me"][class*="fixed"],
    a[href*="wa.me"][style*="fixed"],
    [class*="fixed"][class*="bottom"][class*="right"] { display: none !important; }
    * { animation: none !important; transition: none !important; }
  `,
});

// Pastikan font selesai dimuat agar teks tidak berubah bentuk.
await page.evaluate(() => document.fonts?.ready);
await page.waitForTimeout(700);

await page.screenshot({
  path: OUT,
  clip: { x: 0, y: 0, width: 1200, height: 630 },
  animations: "disabled",
});

console.log("og-preview.png dibuat 1200x630 (2x)");
await browser.close();
