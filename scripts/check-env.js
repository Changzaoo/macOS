import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const REQUIRED = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

// Parse .env file if it exists
function parseEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, "utf-8");
    const vars = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx < 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      vars[key] = value;
    }
    return vars;
  } catch {
    return {};
  }
}

const envLocal = parseEnvFile(resolve(__dirname, "../.env.local"));
const envFile = parseEnvFile(resolve(__dirname, "../.env"));
const envAll = { ...envFile, ...envLocal, ...process.env };

console.log("\nFirebase env check:");
let allOk = true;
for (const key of REQUIRED) {
  const val = envAll[key];
  const ok = typeof val === "string" && val.trim() !== "";
  console.log(`  ${key}: ${ok ? "OK" : "MISSING"}`);
  if (!ok) allOk = false;
}

if (allOk) {
  console.log("\n✓ Todas as variáveis estão configuradas.\n");
} else {
  console.log("\n✗ Variáveis ausentes! Configure-as no painel da Vercel e faça Redeploy.\n");
  process.exit(1);
}
