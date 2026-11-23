import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const OUT = "D:/Antigravity/futurebimbelkedinasan/public";
const markBase64 = readFileSync(`${OUT}/logo-mark.png`).toString("base64");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 256, height: 256 }, deviceScaleFactor: 1 });

async function png(size, file) {
  await page.setContent(`
    <body style="margin:0">
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 256 256">
        <rect width="256" height="256" rx="52" fill="#F5F4F0"/>
        <image href="data:image/png;base64,${markBase64}" x="36" y="36" width="184" height="184" preserveAspectRatio="xMidYMid meet"/>
      </svg>
    </body>
  `);
  await page.waitForTimeout(120);
  const el = await page.$("svg");
  const buffer = await el.screenshot({ omitBackground: true });
  writeFileSync(`${OUT}/${file}`, buffer);
  console.log(`${file} -> ${size}x${size}`);
}

await png(48, "favicon-48.png");
await png(96, "favicon-96.png");
await png(192, "favicon-192.png");
await png(180, "apple-touch-icon.png");

await browser.close();
