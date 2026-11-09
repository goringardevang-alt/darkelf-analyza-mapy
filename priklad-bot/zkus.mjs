// Vyzkoušení bez Discordu a bez Cloudflare: stáhne dnešní stav ligy jako pozorovatel
// (4 požadavky s rozestupem 5,5 s) a vypíše shrnutí do konzole. Databáze je jen v paměti.
//
//   node priklad-bot/zkus.mjs 2A            vypíše strany, ze kterých vybereš pohled
//   node priklad-bot/zkus.mjs 2A a:352715   shrnutí z pohledu aliance 352715
import { pozorovatel, souhrn } from '../knihovna/index.js';
import { denniBeh } from './bot.js';
import { d1 } from '../testy/d1.js';

const [liga, pohled] = process.argv.slice(2);
if (!liga) throw new Error('Použití: node priklad-bot/zkus.mjs <liga> [pohled]');

const hra = pozorovatel(liga);
if (!pohled) {
  await hra.prihlas();
  const mapa = await hra.mapa();
  console.log(`${liga}, ${mapa.den}. den. Strany (klíč, název, země):`);
  for (const s of souhrn(mapa).slice(0, 15)) console.log(`  ${s.klic.padEnd(12)} ${s.nazev.padEnd(24)} ${s.zemi}`);
} else {
  const db = d1(new URL('./schema.sql', import.meta.url));
  await denniBeh({ db, hra, posli: async (t) => console.log(t), cfg: { liga, pohled }, datum: new Date().toISOString().slice(0, 10) });
}
