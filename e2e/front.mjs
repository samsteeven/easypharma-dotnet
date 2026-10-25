// Parcours navigateur du front Angular branché sur l'API ASP.NET Core (nginx -> api).
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:4210';
const OUT = process.env.OUT ?? '../docs';
const [email, password] = [process.env.EMAIL ?? 'a2@test.local', process.env.PASSWORD ?? 'Test1234!'];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1360, height: 860 } });

const apiCalls = [];
page.on('response', (r) => {
  const u = new URL(r.url());
  if (u.pathname.startsWith('/api/')) apiCalls.push(`${r.status()} ${r.request().method()} ${u.pathname}${u.search}`);
});

await page.goto(`${BASE}/login`);
await page.fill('#email', email);
await page.fill('#password', password);
await page.click('button[type=submit]');
await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 });
console.log('après connexion :', new URL(page.url()).pathname);
await page.screenshot({ path: `${OUT}/1-apres-connexion.png` });

// Catalogue des médicaments (GET /api/v1/medications)
await page.goto(`${BASE}/pharmacy-admin/catalog`);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(800);
console.log('catalogue affiche Doliprane :', (await page.getByText('Doliprane').count()) > 0);
await page.screenshot({ path: `${OUT}/2-catalogue.png` });

// Recherche globale (GET /api/v1/patient/search)
await page.goto(`${BASE}/pharmacy-admin/global-search`);
await page.waitForLoadState('networkidle');
await page.fill('input[type=text]', 'doli');
await page.keyboard.press('Enter');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(800);
const pharmacies = await page.locator('text=/Pharmacie (Akwa|Bastos|Centre)/').allTextContents();
console.log('recherche globale, pharmacies listées :', [...new Set(pharmacies.map((t) => t.trim()))].join(' | '));
await page.screenshot({ path: `${OUT}/3-recherche-globale.png` });

console.log('\nAppels API observés :');
for (const c of [...new Set(apiCalls)]) console.log(' ', c);
await browser.close();
