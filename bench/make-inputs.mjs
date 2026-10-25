// Génère inputs.json : points GPS et termes de recherche, déterministes (même suite pour les deux API).
import { writeFileSync } from 'node:fs';

let seed = 20261025;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

const points = Array.from({ length: 200 }, () => ({
  lat: +(3.6 + rnd() * 2.3).toFixed(5),
  lon: +(9.1 + rnd() * 2.8).toFixed(5),
}));

// Noms exacts présents dans seed-bench.sql (20 noms x 15 dosages) : ~240 offres disponibles par terme.
const names = ['Paracétamol', 'Amoxicilline', 'Ibuprofène', 'Artéméther', 'Metformine', 'Amlodipine', 'Cétirizine', 'Ciprofloxacine'];
const terms = names.flatMap((n, i) => [`${n} ${100 * (i + 1)}mg`, `${n} ${100 * (i + 5)}mg`]);

// Début de nom pour le catalogue (15 médicaments par terme)
const prefixes = ['paracét', 'amoxi', 'ibupr', 'artém', 'metfo', 'amlod', 'cétir', 'ciprof'];

writeFileSync(new URL('./inputs.json', import.meta.url), JSON.stringify({ points, terms, prefixes }));
console.log(`${points.length} points, ${terms.length} termes, ${prefixes.length} préfixes`);
