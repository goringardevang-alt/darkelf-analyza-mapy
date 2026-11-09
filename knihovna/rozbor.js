// Rozbor mapy: kdo je kdo, součty, rozdíl dvou dnů a fronta.
// Vstupem je výstup ctiMapu() a ctiSousedy() z cteni.js. Význam měr: znalosti/04_odvozene.md a 05_fronta.md.
import { domyStred } from './obrazky.js';

// Strana, za kterou zem hraje: aliance, hráč bez aliance (každý sám za sebe), nebo neutrálka.
// Hráče bez aliance je nutné brát jednotlivě, jinak by se slili do jedné falešné aliance.
export function strana(z) {
  if (!z?.hrac) return { klic: 'n', nazev: '(neutrálka)', typ: 'neutralka' };
  if (z.aliance) return { klic: `a:${z.aliance}`, nazev: z.nazevAliance ?? `aliance ${z.aliance}`, typ: 'aliance' };
  return { klic: `h:${z.hrac}`, nazev: z.nick ?? `hráč ${z.hrac}`, typ: 'hrac' };
}

// Posel (bot hry): vlajka 971–975. Celá aliance s poslem je aliance poslů.
export const jePosel = (z) => z?.vlajka >= 971 && z?.vlajka <= 975;

// Násobitel obrany země z toho, co je vidět: pevnost (obranný koeficient) + vlastní bonus země.
// Nevidíme cvičiště (+0,05), štít, hrdiny, vozy ani vojenské smlouvy.
export function koeficientObrany(z) {
  const pevnost = z?.domy?.pevnost?.obrana ?? 1;
  return pevnost + (z?.bonusObrana ?? 0) / 100;
}

// Součty po stranách: země, síla vojska, domy (střed pásma), země s pevností (domy neznámé), hráči.
export function souhrn(mapa) {
  const s = new Map();
  for (const z of mapa.zeme) {
    const st = strana(z);
    const x = s.get(st.klic) ?? { ...st, zemi: 0, sila: 0, domy: 0, bezDomu: 0, hraci: new Set() };
    x.zemi += 1;
    x.sila += z.sila;
    const d = domyStred(z.domy);
    if (d == null) x.bezDomu += z.hrac ? 1 : 0; else x.domy += d;
    if (z.hrac) x.hraci.add(z.hrac);
    s.set(st.klic, x);
  }
  return [...s.values()].sort((a, b) => b.zemi - a.zemi);
}

// Rozdíl dvou snímků (včera, dnes): změny vlastníků, noví a zmizelí hráči, přechody mezi aliancemi.
// U změny vlastníka vrací i včerejší stav země, aby šlo odhadnout, jak silný útok prošel.
export function rozdil(vcera, dnes) {
  const vZeme = new Map(vcera.zeme.map((z) => [z.id, z]));
  const zmeny = [];
  for (const z of dnes.zeme) {
    const v = vZeme.get(z.id);
    if (!v || v.hrac === z.hrac) continue;
    const typ = !v.hrac ? 'z neutrálky' : !z.hrac ? 'na neutrálku' : 'dobytí';
    zmeny.push({
      typ, zem: z.id, nazev: z.nazev,
      z: v.hrac ? { hrac: v.hrac, nick: v.nick, strana: strana(v) } : null,
      na: z.hrac ? { hrac: z.hrac, nick: z.nick, strana: strana(z) } : null,
      vcera: { sila: v.sila, bonusObrana: v.bonusObrana, domy: v.domy, koeficient: koeficientObrany(v), minUtok: v.minUtok },
    });
  }
  const hraci = (m) => {
    const h = new Map();
    for (const z of m.zeme) {
      if (!z.hrac) continue;
      const x = h.get(z.hrac) ?? { hrac: z.hrac, nick: z.nick, aliance: z.aliance, nazevAliance: z.nazevAliance, zemi: 0 };
      x.zemi += 1;
      h.set(z.hrac, x);
    }
    return h;
  };
  const hv = hraci(vcera), hd = hraci(dnes);
  const novi = [...hd.values()].filter((x) => !hv.has(x.hrac));
  const zmizeli = [...hv.values()].filter((x) => !hd.has(x.hrac));
  const prechody = [...hd.values()].filter((x) => hv.has(x.hrac) && hv.get(x.hrac).aliance !== x.aliance)
    .map((x) => ({ ...x, z: hv.get(x.hrac).nazevAliance, na: x.nazevAliance }));
  return { zmeny, novi, zmizeli, prechody };
}

// Fronta mezi stranami A a B (klíče ze strana()). Gorin: dobře postupující fronta = co nejméně
// vlastních zemí v kontaktu s druhou aliancí.
export function fronta(mapa, sousede, a, b) {
  const kdo = new Map(mapa.zeme.map((z) => [z.id, strana(z).klic]));
  const hraniceA = new Set(), hraniceB = new Set();
  const vybezky = new Map();
  let styky = 0, veValce = 0;
  for (const [id, seznam] of sousede) {
    if (kdo.get(id) !== a) continue;
    for (const s of seznam) {
      if (kdo.get(s.id) !== b) continue;
      hraniceA.add(id);
      hraniceB.add(s.id);
      styky += 1;
      if (s.valka) veValce += 1;
      vybezky.set(id, (vybezky.get(id) ?? 0) + 1);
    }
  }
  const zemiA = [...kdo.values()].filter((k) => k === a).length;
  return {
    a, b, hraniceA: hraniceA.size, hraniceB: hraniceB.size, styky, veValce,
    podilHranice: zemiA ? hraniceA.size / zemiA : 0,
    // Výběžky: země A s nejvíc sousedy B, nejslabší místa linie.
    vybezky: [...vybezky].map(([zem, pocet]) => ({ zem, pocet })).sort((x, y) => y.pocet - x.pocet),
  };
}

// Všechny fronty strany A: proti každé straně, se kterou sousedí (bez neutrálek, pokud nechceš).
export function fronty(mapa, sousede, a, { iNeutralky = false } = {}) {
  const kdo = new Map(mapa.zeme.map((z) => [z.id, strana(z).klic]));
  const druzi = new Set();
  for (const [id, seznam] of sousede) {
    if (kdo.get(id) !== a) continue;
    for (const s of seznam) {
      const k = kdo.get(s.id);
      if (k && k !== a && (iNeutralky || k !== 'n')) druzi.add(k);
    }
  }
  return [...druzi].map((b) => fronta(mapa, sousede, a, b)).sort((x, y) => y.hraniceA - x.hraniceA);
}

// Hrdinové: kdo se přesunul, kdo je nový a kdo zmizel (přesun, smrt, odchod hráče).
export function rozdilHrdinu(vcera, dnes) {
  const v = new Map(vcera.map((h) => [h.id, h]));
  const d = new Map(dnes.map((h) => [h.id, h]));
  return {
    novi: dnes.filter((h) => !v.has(h.id)),
    zmizeli: vcera.filter((h) => !d.has(h.id)),
    presuny: dnes.filter((h) => v.has(h.id) && v.get(h.id).zem !== h.zem).map((h) => ({ ...h, odkud: v.get(h.id).zem })),
    zkusenost: dnes.filter((h) => v.has(h.id) && h.zkusenost > v.get(h.id).zkusenost)
      .map((h) => ({ ...h, pribylo: h.zkusenost - v.get(h.id).zkusenost })),
  };
}
