// Obrázky zemí na mapě: co který název souboru znamená.
// Tabulky a jak byly ověřené: znalosti/03_obrazky.md.

// id_rasa v exportu i číslo na začátku obrázku domů (prehled_ras_stavby.asp).
export const RASY = ['Lidé', 'Barbaři', 'Skřeti', 'Skuruti', 'Nekromanti', 'Mágové', 'Elfové',
  'Temní Elfové', 'Trpaslíci', 'Hobiti', 'Enti'];

const jmeno = (img) => String(img ?? '').split('/').pop().replace(/\.gif$/i, '');

// img_power: <s|v><0-7>, s = bez války, v = válka se sousedem.
const PASMA_SILY = [[0, 0], [1, 99], [100, 199], [200, 399], [400, 599], [600, 799], [800, 999], [1000, null]];

export function pasmoSily(img) {
  const m = jmeno(img).match(/^([sv])(\d)$/);
  if (!m) return null;
  const pasmo = Number(m[2]);
  const [od, do_] = PASMA_SILY[pasmo] ?? [null, null];
  return { pasmo, valka: m[1] === 'v', od, do: do_ };
}

// img_pevnost: <id_rasy>v<1-6> = pásmo domů po 50, <id_rasy>p<2-5> = pevnost (domy schová),
// v0 bez čísla rasy = neutrálka bez domů.
const PASMA_DOMU = [[0, 0], [0, 49], [50, 99], [100, 149], [150, 199], [200, 249], [250, null]];
export const PEVNOSTI = {
  2: { nazev: 'Dřevěné hradby', utok: 1.0, obrana: 1.1 },
  3: { nazev: 'Malá pevnost', utok: 1.1, obrana: 1.2 },
  4: { nazev: 'Střední pevnost', utok: 1.25, obrana: 1.5 },
  5: { nazev: 'Velká pevnost', utok: 1.5, obrana: 2.0 },
};

export function domy(img) {
  const m = jmeno(img).match(/^(\d*)([vp])(\d)$/);
  if (!m) return null;
  const rasa = m[1] === '' ? null : Number(m[1]);
  const cislo = Number(m[3]);
  if (m[2] === 'p') return { rasa, pevnost: PEVNOSTI[cislo] ?? { nazev: `pevnost ${cislo}` }, od: null, do: null };
  const [od, do_] = PASMA_DOMU[cislo] ?? [null, null];
  return { rasa, pevnost: null, pasmo: cislo, od, do: do_ };
}

// Střed pásma domů pro součty; 250+ se počítá jako 275, pevnost jako null (nevíme).
export function domyStred(d) {
  if (!d || d.pevnost || d.od == null) return null;
  if (d.do == null) return d.od + 25;
  return Math.round((d.od + d.do) / 2);
}

// img_vez: m1 = nic, m2 svatyně, m3–m7 věže a chrám.
export const VEZE = {
  1: null,
  2: 'Obřadní svatyně',
  3: 'Malá magická věž',
  4: 'Střední magická věž',
  5: 'Velká magická věž',
  6: 'Obranná magická věž',
  7: 'Chrám',
};

export function vez(img) {
  const m = jmeno(img).match(/^\d*m(\d)$/);
  if (!m) return null;
  const n = Number(m[1]);
  return n in VEZE ? VEZE[n] : `věž ${n}`;
}

// Krypta na stránce mapy: images/crypts/c<typ>[v].gif, v = vykradená.
export function krypta(img) {
  const m = jmeno(img).match(/^c(\d+)(v?)$/);
  return m ? { typ: Number(m[1]), vykradena: m[2] === 'v' } : null;
}
