// Expo Router'ın web.output="single" modunda, app/+html.tsx özelleştirmesi
// dikkate alınmıyor ve üretilen index.html hep lang="en" ile çıkıyor.
// Bu, tarayıcının (özellikle telefonlarda) "Bu sayfayı çevir?" isteğini
// tetikliyor ve Google Translate, React'in güncellediği metinleri
// karıştırıyordu (ör. "Çorbalar" yerine "Günlar", "Market" yerine "Pazar"
// görünmesi). Bu script, build sonrası index.html'i doğrudan düzeltir.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(__dirname, "..", "dist", "web", "index.html");

if (!fs.existsSync(indexPath)) {
  console.warn(`[patch-index-html] Uyarı: ${indexPath} bulunamadı, atlanıyor.`);
  process.exit(0);
}

let html = fs.readFileSync(indexPath, "utf8");

html = html.replace('<html lang="en">', '<html lang="tr" translate="no" class="notranslate">');

if (!html.includes('name="google"')) {
  html = html.replace("<head>", '<head>\n    <meta name="google" content="notranslate" />');
}

fs.writeFileSync(indexPath, html, "utf8");
console.log("[patch-index-html] index.html düzeltildi (lang=tr, Google Translate devre dışı).");
