// Consolide un dossier de résultats : médiane, min et max sur toutes les passes (tous rounds confondus).
//   node summarize.mjs [results | results/avant-correction]
import { readdirSync, readFileSync } from 'node:fs';

const dir = new URL(`./${(process.argv[2] ?? 'results').replace(/\/?$/, '/')}`, import.meta.url);
const rows = {};
for (const f of readdirSync(dir).filter((f) => f.endsWith('.json') && /^(dotnet|java)/.test(f))) {
  const [app, scenario] = f.split('-');
  const label = f.replace(/^(dotnet|java)-/, '').replace(/-round\d-run\d\.json$/, '');
  const j = JSON.parse(readFileSync(new URL(f, dir)));
  const d = j.metrics.http_req_duration;
  (rows[`${label}|${app}`] ??= []).push({ p50: d.med, p95: d['p(95)'], p99: d['p(99)'], rps: j.metrics.http_reqs.rate, fail: j.metrics.checks.fails });
}
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const fmt = (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)} s` : `${v.toFixed(v < 10 ? 1 : 0)} ms`);
console.log('| Scénario | API | passes | p50 | p95 (médiane) | p95 (min-max) | p99 | req/s |');
console.log('|---|---|---|---|---|---|---|---|');
for (const [k, v] of Object.entries(rows).sort()) {
  const [label, app] = k.split('|');
  const p95 = v.map((x) => x.p95);
  console.log(`| ${label} | ${app} | ${v.length} | ${fmt(med(v.map((x) => x.p50)))} | **${fmt(med(p95))}** | ${fmt(Math.min(...p95))} - ${fmt(Math.max(...p95))} | ${fmt(med(v.map((x) => x.p99)))} | ${med(v.map((x) => x.rps)).toFixed(0)} |`);
}
console.log(`échecs : ${Object.values(rows).flat().reduce((s, x) => s + x.fail, 0)}`);
