// Charge identique pour les deux API : mêmes requêtes, mêmes paramètres, dans le même ordre.
//   k6 run -e BASE=http://localhost:5080 -e SCENARIO=nearby bench/k6-bench.js
import http from 'k6/http';
import { check } from 'k6';

const inputs = JSON.parse(open('./inputs.json'));
const BASE = __ENV.BASE;
const SCENARIO = __ENV.SCENARIO;
const VUS = Number(__ENV.VUS || 16);
const DURATION = __ENV.DURATION || '20s';

export const options = {
  scenarios: { load: { executor: 'constant-vus', vus: VUS, duration: DURATION } },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  thresholds: { checks: ['rate>0.999'] },
};

export function setup() {
  if (SCENARIO === 'nearby') return {};
  const res = http.post(`${BASE}/api/v1/auth/login`, JSON.stringify({ email: 'bench@test.local', password: 'Test1234!' }),
    { headers: { 'Content-Type': 'application/json' } });
  return { token: res.json('data.access_token') };
}

export default function (data) {
  const i = (__VU * 7919 + __ITER * 31) % inputs.points.length;
  const p = inputs.points[i];
  const headers = data.token ? { Authorization: `Bearer ${data.token}` } : {};
  let res;
  let minBody = 2;

  if (SCENARIO === 'nearby') {
    res = http.get(`${BASE}/api/v1/pharmacies/nearby?latitude=${p.lat}&longitude=${p.lon}&radiusKm=15`, { headers });
  } else if (SCENARIO === 'search_nearest') {
    const term = encodeURIComponent(inputs.terms[i % inputs.terms.length]);
    res = http.get(`${BASE}/api/v1/patient/search?query=${term}&sortBy=POSTGIS_NEAREST&userLat=${p.lat}&userLon=${p.lon}`, { headers });
    minBody = 100;
  } else if (SCENARIO === 'catalogue_search') {
    const prefix = encodeURIComponent(inputs.prefixes[i % inputs.prefixes.length]);
    res = http.get(`${BASE}/api/v1/medications/search?query=${prefix}`, { headers });
    minBody = 100;
  } else {
    throw new Error(`SCENARIO inconnu : ${SCENARIO}`);
  }

  check(res, { 'HTTP 200': (r) => r.status === 200, 'corps non vide': (r) => r.body.length >= minBody });
}
