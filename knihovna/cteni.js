// Čtení stránek a exportů hry darkelf.cz. Jen čisté funkce nad textem, žádná síť,
// takže běží stejně v Cloudflare Workeru, v Node i v testech.
// HTML stránky hry jsou ve windows-1250: dekóduj je dřív, než je sem pošleš
// (new TextDecoder('windows-1250').decode(buffer)). JSON exporty jsou v UTF-8.
import { pasmoSily, domy, vez, krypta } from './obrazky.js';

const ENTITY = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function bezEntit(s) {
  return String(s)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITY[n.toLowerCase()] ?? m);
}

export function text(html) {
  return bezEntit(String(html).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

const cislo = (s) => (s == null || s === '' ? null : Number(s));
const idText = (v) => (v == null || v === 0 || v === '0' ? null : String(v));

// Stránka pozorovatele login.asp?l=<liga>: liga, herní den a jestli je liga dohraná
// (úsek „- jsi přihlášen" se třídou v, ve hře červeně).
export function ctiPozorovatele(html) {
  const liga = html.match(/jsi přihlášen, liga(?:&nbsp;|\s)*<span[^>]*>([^<]+)<\/span>/i);
  const den = html.match(/herní den(?:&nbsp;|\s)*<span[^>]*>(\d+)<\/span>/i);
  if (!liga || !den) throw new Error('Stránka pozorovatele nemá ligu nebo den, hra ji asi změnila.');
  const dohrana = /<span[^>]*class=['"]?v['"]?[^>]*>\s*-\s*jsi přihlášen/i.test(html);
  return { liga: liga[1].trim(), den: Number(den[1]), dohrana };
}

// map_export_json.asp: všechny země. Vrací hlavičku a země s rozluštěnými obrázky.
export function ctiMapu(data) {
  const h = data?.hlavicka;
  if (!h || !Array.isArray(data.zeme)) throw new Error('Export mapy nemá hlavičku nebo země.');
  const zeme = data.zeme.map((z) => ({
    id: z.id,
    nazev: z.zeme,
    oblast: z.id_oblast,
    hrac: idText(z.id_hrac),
    nick: z.hrac ?? null,
    aliance: idText(z.id_aliance),
    nazevAliance: z.aliance ?? null,
    velitel: idText(z.id_velitele),
    rasa: z.id_rasa ?? null,
    vlajka: z.vlajka ?? null,
    sila: z.land_power ?? 0,
    pasmoSily: pasmoSily(z.img_power),
    valka: z.valka === 1,
    domy: domy(z.img_pevnost),
    vez: vez(z.img_vez),
    bonusObrana: z.bonus_obrana ?? 0,
    bonusPenize: z.bonus_penize ?? 0,
    bonusMana: z.bonus_mana ?? 0,
    minUtok: z.min_utok ?? null,
    obyvatel: z.spehnora ?? null,
  }));
  return {
    liga: h.liga, den: Number(h.den), cas: h.cache_date ?? null,
    pocasi: { penize: h.pocasi_penize, mana: h.pocasi_mana, domy: h.pocasi_domy },
    zeme,
  };
}

// smlouvy_export_json.asp: sousedé každé země a válka s každým z nich (public.wN = 1).
// Vrací Map id země -> [{id, valka}]. Sousedství je symetrické.
export function ctiSousedy(data) {
  if (!Array.isArray(data?.smlouvy)) throw new Error('Export smluv nemá pole smlouvy.');
  const sousede = new Map();
  for (const r of data.smlouvy) {
    const seznam = [];
    for (let i = 1; i <= 10; i++) {
      const s = r[`s${i}`];
      if (s) seznam.push({ id: s, valka: r.public?.[`w${i}`] === 1 });
    }
    sousede.set(r.id, seznam);
  }
  return sousede;
}

// map_new.asp: hrdinové a krypty. Div h<id země> nese buď hrdinu (class='hero'), nebo kryptu.
export function ctiStrankuMapy(html) {
  const hrdinove = [];
  const krypty = [];
  for (const m of html.matchAll(/<div id='h(\d+)'([^>]*)>([\s\S]*?)<\/div>/g)) {
    const zem = Number(m[1]);
    const obsah = m[3];
    const odkazHrdiny = obsah.match(/hero\.asp\?h=(\d+)/);
    const titulek = bezEntit(obsah.match(/title='([^']*)'/)?.[1] ?? '');
    if (odkazHrdiny) {
      const t = titulek.match(/^(.*) \((\d+)\)$/);
      hrdinove.push({ zem, id: Number(odkazHrdiny[1]), jmeno: t ? t[1] : titulek, zkusenost: t ? Number(t[2]) : null,
        obrazek: obsah.match(/images\/h\/([^'"]+)/)?.[1] ?? null });
      continue;
    }
    const k = krypta(obsah.match(/images\/crypts\/([^'"]+)/)?.[1]);
    if (k) {
      krypty.push({ zem, id: Number(obsah.match(/cr\.asp\?c=(\d+)/)?.[1]) || null, ...k,
        nebezpecnost: titulek.match(/nebezpečnost: ([^)]+)/)?.[1] ?? null });
    }
  }
  return { hrdinove, krypty };
}

// hlaseni.asp jako pozorovatel: blok „Nej-události v tomto dni". Prvky nesou id spl/sva (kouzlo),
// apl/ava (útok), hpl/hva (domy), bva/bpl (stavby); hráč je v odkazu vyhledavani.asp?hrac=<id>.
export function ctiNejUdalosti(html) {
  const blok = html.match(/Nej-události v tomto dni[\s\S]*?class='tdMsg'[^>]*>([\s\S]*?)<\/td>/);
  if (!blok) return null;
  const radky = blok[1].split(/<br\s*\/?>/i);
  const najdi = (id) => radky.find((r) => r.includes(`id='${id}'`)) ?? null;
  const hodnota = (r, id) => (r ? text(r.match(new RegExp(`<span id='${id}'>([\\s\\S]*?)</span>`))?.[1] ?? '') : null);
  const hrac = (r, id) => {
    if (!r) return null;
    const m = r.match(new RegExp(`vyhledavani\\.asp\\?hrac=(\\d+)'[^>]*><span id='${id}'>([^<]*)<`));
    return m ? { id: m[1], nick: bezEntit(m[2]).trim() } : null;
  };
  const puvod = (r) => {
    if (!r) return {};
    const za = r.slice(r.lastIndexOf(') (') + 3);
    const rasa = text(za.split(',')[0].replace(/\)\s*$/, ''));
    const al = r.match(/aliance\.asp\?id_a=(\d+)'[^>]*>([^<]*)</);
    return { rasa: rasa || null, aliance: al ? { id: al[1], nazev: bezEntit(al[2]).trim() } : null };
  };
  const kouzlo = najdi('spl'), utok = najdi('apl'), domy = najdi('hpl'), stavby = najdi('bpl');
  const cisloZ = (r, id) => (r ? cislo(hodnota(r, id)) : null);
  return {
    cas: text(html.match(/Nej-události v tomto dni[\s\S]*?(\d+\.\s*\d+\.\s*\d{4}\s+\d+:\d+:\d+)/)?.[1] ?? '') || null,
    kouzlo: kouzlo && { hrac: hrac(kouzlo, 'spl'), sila: cisloZ(kouzlo, 'sva'), ...puvod(kouzlo) },
    utok: utok && { hrac: hrac(utok, 'apl'), sila: cisloZ(utok, 'ava'), ...puvod(utok) },
    domy: domy && { hrac: hrac(domy, 'hpl'), pocet: cisloZ(domy, 'hva'), ...puvod(domy) },
    stavby: stavby && {
      zem: hodnota(stavby, 'bva'),
      pocet: cislo(text(stavby.match(/<\/span><\/span>\s*\(<span[^>]*>(\d+)<\/span>\)/)?.[1] ?? '')),
      hrac: hrac(stavby, 'bpl'), ...puvod(stavby),
    },
  };
}

// hero.asp?h=<id>: veřejný detail hrdiny. Řádky tabulek jsou „<tr><td>Popisek<td>Hodnota".
export function ctiHrdinu(html) {
  const radky = {};
  for (const r of html.split(/<tr[^>]*>/i).slice(1)) {
    const bunky = r.split(/<td[^>]*>/i).slice(1);
    if (bunky.length < 2) continue;
    radky[text(bunky[0])] = { text: text(bunky[1]), html: bunky[1] };
  }
  const t = (k) => radky[k]?.text ?? null;
  const ut = radky['Útok a obrana']?.html.match(/(\d+)[\s\S]*?m\.gif[\s\S]*?(\d+)[\s\S]*?sa\.gif/);
  const levely = {};
  for (const [k, v] of Object.entries(radky)) {
    const m = k.match(/^(Level .+|Síla kouzla|Mag\. obrana|Stavitel|Destrukce)$/);
    if (m) levely[k] = cislo(v.text.replace(/[+%\s]/g, ''));
  }
  return {
    jmeno: text(html.match(/<td>([^<]+?)&nbsp;/)?.[1] ?? '') || null,
    povolani: text(html.match(/heroes_classlist\.asp[^>]*>([^<]+)</)?.[1] ?? '') || null,
    majitel: t('Ve službách'),
    majitelId: radky['Ve službách']?.html.match(/hrac=(\d+)/)?.[1] ?? null,
    zem: t('Země'),
    zemId: cislo(radky['Země']?.html.match(/zeme=(\d+)/)?.[1]),
    stav: t('Stav'),
    zkusenost: cislo(t('Zkušenost celková')),
    zivoty: cislo(t('Životů hrdiny')),
    utok: ut ? Number(ut[1]) : null,
    obrana: ut ? Number(ut[2]) : null,
    levely,
  };
}
