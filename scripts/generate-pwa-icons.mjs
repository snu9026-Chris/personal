#!/usr/bin/env node
/**
 * PWA 아이콘 생성기
 * public/icon-source.png (1024x1024) → 다양한 사이즈 PNG로 변환
 *
 * 생성 파일:
 *   public/icon-192.png         — Android/일반 PWA
 *   public/icon-512.png         — Android/일반 PWA + splash
 *   public/icon-maskable-512.png — Android adaptive icon
 *   public/apple-touch-icon.png — iOS 홈화면 (180x180)
 *   public/favicon-32.png       — 브라우저 탭
 *   public/favicon-16.png       — 브라우저 탭 (작은)
 */

import sharp from "sharp";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "public", "icon-source.png");

const targets = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "favicon-32.png", size: 32 },
  { name: "favicon-16.png", size: 16 },
];

console.log(`Source: ${SRC}`);
for (const t of targets) {
  const out = join(ROOT, "public", t.name);
  await sharp(SRC).resize(t.size, t.size, { fit: "cover" }).png().toFile(out);
  console.log(`  ✓ ${t.name} (${t.size}x${t.size})`);
}

// maskable icon: Android adaptive icons은 가장자리가 잘릴 수 있어
// 안전 영역(safe zone) 80%만 차지하도록 padding 추가
const maskableOut = join(ROOT, "public", "icon-maskable-512.png");
await sharp(SRC)
  .resize(410, 410, { fit: "cover" }) // 80% of 512
  .extend({
    top: 51,
    bottom: 51,
    left: 51,
    right: 51,
    background: { r: 168, g: 85, b: 247, alpha: 1 }, // brand purple #a855f7
  })
  .png()
  .toFile(maskableOut);
console.log(`  ✓ icon-maskable-512.png (512x512, padded for adaptive)`);

console.log("\nDone.");
