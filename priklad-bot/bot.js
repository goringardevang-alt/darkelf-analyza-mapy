// Logika ukázkového bota: denní snímek mapy do databáze a shrnutí do Discordu, příkaz /mapa.
// Bez sítě a bez Cloudflare: hra, databáze a odeslání zprávy přicházejí zvenku, takže jde testovat.
import { textSouhrnu } from '../knihovna/index.js';

const MAX_ZPRAVA = 1990; // Discord bere nejvýš 2000 znaků

const zkrat = (t) => (t.length <= MAX_ZPRAVA ? t : `${t.slice(0, MAX_ZPRAVA - 2)}\n…`);
const nactiSousedy = (text) => new Map(JSON.parse(text));

// db = D1 (nebo cokoli se stejným prepare/bind/first/run), hra = pozorovatel() z knihovny,
// posli(text) = zpráva do kanálu, cfg = { liga, pohled }, datum = 'YYYY-MM-DD'.
export async function denniBeh({ db, hra, posli, cfg, datum }) {
  const info = await hra.prihlas();
  const mapa = await hra.mapa();

  // Nový věk poznáme podle toho, že herní den klesl proti poslednímu snímku.
  const posledni = await db.prepare('SELECT vek, den FROM snimky WHERE liga = ? ORDER BY vek DESC, den DESC LIMIT 1')
    .bind(cfg.liga).first();
  const vek = !posledni ? 1 : mapa.den < posledni.den ? posledni.vek + 1 : posledni.vek;

  const sousede = await hra.sousede(); // války se mění, proto každý den
  const nej = await hra.nejUdalosti().catch(() => null); // nej-události jsou bonus, bez nich shrnutí jde

  await db.prepare('INSERT OR REPLACE INTO snimky (liga, vek, den, datum, mapa, sousede, nej) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(cfg.liga, vek, mapa.den, datum, JSON.stringify(mapa), JSON.stringify([...sousede]), nej ? JSON.stringify(nej) : null).run();

  const vcera = await db.prepare('SELECT mapa FROM snimky WHERE liga = ? AND vek = ? AND den = ?')
    .bind(cfg.liga, vek, mapa.den - 1).first();
  let text = textSouhrnu({ dnes: mapa, vcera: vcera ? JSON.parse(vcera.mapa) : null, sousede, pohled: cfg.pohled, nej });
  if (info.dohrana) text += '\n🏁 Liga je dohraná.';
  await posli(zkrat(text));
  return { vek, den: mapa.den };
}

// Odpověď na /mapa [den]: shrnutí uloženého dne aktuálního věku, jen pro tazatele.
export async function prikazMapa({ db, cfg, den = null }) {
  const vek = await db.prepare('SELECT MAX(vek) AS v FROM snimky WHERE liga = ?').bind(cfg.liga).first();
  if (!vek?.v) return 'Zatím nemám uložený žádný den.';
  const radek = den == null
    ? await db.prepare('SELECT den, mapa, sousede, nej FROM snimky WHERE liga = ? AND vek = ? ORDER BY den DESC LIMIT 1').bind(cfg.liga, vek.v).first()
    : await db.prepare('SELECT den, mapa, sousede, nej FROM snimky WHERE liga = ? AND vek = ? AND den = ?').bind(cfg.liga, vek.v, den).first();
  if (!radek) return `Den ${den} nemám uložený.`;
  const vcera = await db.prepare('SELECT mapa FROM snimky WHERE liga = ? AND vek = ? AND den = ?').bind(cfg.liga, vek.v, radek.den - 1).first();
  return zkrat(textSouhrnu({
    dnes: JSON.parse(radek.mapa), vcera: vcera ? JSON.parse(vcera.mapa) : null,
    sousede: nactiSousedy(radek.sousede), pohled: cfg.pohled, nej: radek.nej ? JSON.parse(radek.nej) : null,
  }));
}
