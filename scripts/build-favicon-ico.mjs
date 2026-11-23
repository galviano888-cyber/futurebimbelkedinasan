import { readFileSync, writeFileSync } from "node:fs";

// Buat favicon.ico dari PNG 48px (format ICO dengan PNG tersemat).
// Google dan browser lama sering meminta /favicon.ico secara langsung,
// jadi berkas ini membantu mempercepat penggantian ikon lama.
const png = readFileSync("D:/Antigravity/futurebimbelkedinasan/public/favicon-48.png");

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // jumlah gambar

const entry = Buffer.alloc(16);
entry.writeUInt8(48, 0); // lebar
entry.writeUInt8(48, 1); // tinggi
entry.writeUInt8(0, 2); // warna palet
entry.writeUInt8(0, 3); // reserved
entry.writeUInt16LE(1, 4); // color planes
entry.writeUInt16LE(32, 6); // bit depth
entry.writeUInt32LE(png.length, 8); // ukuran data
entry.writeUInt32LE(header.length + entry.length, 12); // offset data

writeFileSync(
  "D:/Antigravity/futurebimbelkedinasan/public/favicon.ico",
  Buffer.concat([header, entry, png])
);
console.log("favicon.ico dibuat");
