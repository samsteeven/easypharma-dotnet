// Vérifie que les deux API renvoient les mêmes résultats avant de comparer leurs temps de réponse.
//   node parity.mjs http://localhost:5080 http://localhost:8080
import { readFileSync } from 'node:fs';

const [dotnet, java] = process.argv.slice(2);
const inputs = JSON.parse(readFileSync(new URL('./inputs.json', import.meta.url)));

async function token(base) {
  const r = await fetch(`${base}/api/v1/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bench@test.local', password: 'Test1234!' }),
  });
  return (await r.json()).data.access_token;
}

const tokens = { [dotnet]: await token(dotnet), [java]: await token(java) };
const get = async (base, path) => {
  const r = await fetch(base + path, { headers: { Authorization: `Bearer ${tokens[base]}` } });
  if (!r.ok) throw new Error(`${base}${path} -> ${r.status}`);
  return r.json();
};

let checked = 0;
let mismatches = 0;
const compare = async (label, path, ids) => {
  const [a, b] = await Promise.all([get(dotnet, path), get(java, path)]);
  const [ia, ib] = [ids(a), ids(b)];
  checked++;
  if (JSON.stringify(ia) !== JSON.stringify(ib)) {
    mismatches++;
    console.log(`DIFF ${label} : .NET ${ia.length} résultats, Java ${ib.length}`);
  }
  return ia.length;
};

let total = 0;
for (const p of inputs.points.slice(0, 40)) {
  total += await compare('nearby', `/api/v1/pharmacies/nearby?latitude=${p.lat}&longitude=${p.lon}&radiusKm=15`, (x) => x.map((r) => r.id));
}
console.log(`nearby : 40 requêtes, ${total} pharmacies renvoyées au total`);

let offers = 0;
for (let i = 0; i < 16; i++) {
  const p = inputs.points[i];
  const t = encodeURIComponent(inputs.terms[i % inputs.terms.length]);
  offers += await compare('search_nearest', `/api/v1/patient/search?query=${t}&sortBy=POSTGIS_NEAREST&userLat=${p.lat}&userLon=${p.lon}`,
    (x) => x.map((r) => `${r.medicationId}@${r.pharmacy.id}`));
}
console.log(`search_nearest : 16 requêtes, ${offers} offres renvoyées au total (même ordre)`);

let meds = 0;
for (const pre of inputs.prefixes) {
  meds += await compare('catalogue_search', `/api/v1/medications/search?query=${encodeURIComponent(pre)}`,
    (x) => x.map((m) => m.id).sort());
}
console.log(`catalogue_search : 8 requêtes, ${meds} médicaments`);
console.log(mismatches === 0 ? `PARITÉ OK (${checked} comparaisons)` : `${mismatches} DIFFÉRENCES sur ${checked}`);
process.exit(mismatches === 0 ? 0 : 1);
