// Text denního shrnutí pro Discord (Markdown). Jen ukázka, jak z rozboru složit zprávu:
// klidně si ji přepiš podle sebe, výpočty jsou v rozbor.js.
import { souhrn, rozdil, fronty, strana } from './rozbor.js';

const cislo = (n) => Math.round(n).toLocaleString('cs-CZ');
const zmena = (n) => (n > 0 ? ` (+${cislo(n)})` : n < 0 ? ` (−${cislo(-n)})` : '');

// pohled = klíč strany ze strana(), třeba 'a:352715'. vcera smí být null (první den).
// nej = výstup ctiNejUdalosti(), smí být null. sousedeVcera = sousedé ve včerejším snímku (stejní jako dnes).
export function textSouhrnu({ dnes, vcera = null, sousede, pohled, nej = null, maxRadku = 8 }) {
  const radky = [];
  const nazevPohledu = souhrn(dnes).find((s) => s.klic === pohled)?.nazev ?? pohled;
  radky.push(`**🗺 ${dnes.liga}, ${dnes.den}. den** (pohled ${nazevPohledu})`);

  // Strany: země, síla, domy, změna proti včerejšku. Jen strany se 2+ zeměmi, neutrálky zvlášť.
  const sd = souhrn(dnes);
  const sv = vcera ? new Map(souhrn(vcera).map((s) => [s.klic, s])) : new Map();
  radky.push('```');
  for (const s of sd.filter((s) => s.klic !== 'n' && s.zemi >= 2).slice(0, maxRadku)) {
    const v = sv.get(s.klic);
    radky.push(`${s.nazev.padEnd(18).slice(0, 18)} ${String(s.zemi).padStart(3)} zemí${v ? zmena(s.zemi - v.zemi) : ''}`
      + `  síla ${cislo(s.sila)}${v ? zmena(s.sila - v.sila) : ''}  domy ~${cislo(s.domy)}`);
  }
  radky.push('```');

  // Fronta pohledu proti ostatním, se změnou hraničních zemí.
  const fd = fronty(dnes, sousede, pohled).slice(0, maxRadku);
  const fv = vcera ? new Map(fronty(vcera, sousede, pohled).map((f) => [f.b, f])) : new Map();
  const jmenoStrany = (m, klic) => {
    const z = m.zeme.find((x) => strana(x).klic === klic);
    return z ? strana(z).nazev : klic;
  };
  const sipka = (pred, ted) => (pred != null && pred !== ted ? `${pred} → ${ted}` : `${ted}`);
  for (const f of fd) {
    const v = fv.get(f.b);
    const posun = v ? (f.hraniceA < v.hraniceA ? ' (zkrácená)' : f.hraniceA > v.hraniceA ? ' (natažená)' : '') : '';
    radky.push(`⚔ Fronta s ${jmenoStrany(dnes, f.b)}: ${sipka(v?.hraniceA, f.hraniceA)} hraničních zemí${posun}, `
      + `${sipka(v?.styky, f.styky)} styků, ${f.veValce} ve válce`);
  }

  // Změny vlastníků, noví, zmizelí, přechody.
  if (vcera) {
    const r = rozdil(vcera, dnes);
    const dobyti = r.zmeny.filter((z) => z.typ === 'dobytí');
    for (const z of dobyti.slice(0, maxRadku)) {
      radky.push(`🏴 ${z.na.nick} (${z.na.strana.nazev}) vzal ${z.z.nick} (${z.z.strana.nazev}) zem ${z.nazev}, `
        + `včera tam byla síla ${cislo(z.vcera.sila)}, koeficient obrany ${z.vcera.koeficient.toFixed(2)}`);
    }
    if (dobyti.length > maxRadku) radky.push(`🏴 … a dalších ${dobyti.length - maxRadku} dobytí`);
    const neutralky = r.zmeny.filter((z) => z.typ === 'z neutrálky');
    if (neutralky.length) {
      const kdo = new Map();
      for (const z of neutralky) kdo.set(z.na.strana.nazev, (kdo.get(z.na.strana.nazev) ?? 0) + 1);
      radky.push(`🌱 Z neutrálek: ${[...kdo].map(([n, p]) => `${n} +${p}`).join(', ')}`);
    }
    for (const h of r.zmizeli) radky.push(`👋 ${h.nick} zmizel z mapy (měl ${h.zemi} zemí)`);
    for (const h of r.novi) radky.push(`➕ Nový hráč ${h.nick}${h.nazevAliance ? ` (${h.nazevAliance})` : ' (bez aliance)'}`);
    for (const h of r.prechody) radky.push(`🔀 ${h.nick}: ${h.z ?? 'bez aliance'} → ${h.na ?? 'bez aliance'}`);
  } else {
    radky.push('_Rozdíl proti včerejšku bude od zítřka, dnes je první snímek._');
  }

  if (nej) {
    const c = [];
    if (nej.utok) c.push(`útok ${cislo(nej.utok.sila)} (${nej.utok.hrac?.nick})`);
    if (nej.kouzlo) c.push(`kouzlo ${nej.kouzlo.sila} (${nej.kouzlo.hrac?.nick})`);
    if (nej.domy) c.push(`nejvíc domů ${nej.domy.pocet} (${nej.domy.hrac?.nick})`);
    if (nej.stavby) c.push(`nejvíc staveb ${nej.stavby.pocet} (${nej.stavby.zem})`);
    if (c.length) radky.push(`⭐ Nej-události: ${c.join(', ')}`);
  }
  return radky.join('\n');
}
