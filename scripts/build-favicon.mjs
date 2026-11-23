import { readFileSync, writeFileSync } from "node:fs";

// Favicon: lambang di atas latar krem (warna logo asli) supaya terbaca di tab browser.
const src = readFileSync("D:/Antigravity/futurebimbelkedinasan/public/logo-mark.png").toString("base64");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <rect width="120" height="120" rx="24" fill="#F5F4F0"/>
  <image href="data:image/png;base64,${src}" x="18" y="18" width="84" height="84" preserveAspectRatio="xMidYMid meet"/>
</svg>`;

writeFileSync("D:/Antigravity/futurebimbelkedinasan/public/fbk-logo.svg", svg);
console.log("fbk-logo.svg diperbarui dari lambang asli");
