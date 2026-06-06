#!/usr/bin/env bun
/** Smoke test Ollama fallback via brain health probe */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(import.meta.dir, '../.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] ??= m[2].trim();
  }
}

const base = process.env.DEMO_URL ?? 'http://localhost:3000';

async function probe(ollama: boolean) {
  const url = `${base}/api/brain/health?probe=true&ollama=${ollama}`;
  console.log(`Testing ${ollama ? 'Ollama' : 'Groq'}: ${url}`);
  const res = await fetch(url);
  const data = (await res.json()) as { ok?: boolean; answer?: string; error?: string };
  if (!res.ok || !data.ok) {
    console.error('❌ Failed:', data.error ?? res.statusText);
    process.exit(1);
  }
  console.log('✅ Response:', data.answer?.slice(0, 120));
}

await probe(false);
console.log('---');
try {
  await probe(true);
} catch (e) {
  console.warn('⚠️  Ollama probe skipped (Ollama may be offline):', e);
}
console.log('\nDone.');
