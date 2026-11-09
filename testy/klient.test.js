// Klient pozorovatele s podvrženým fetch: pořadí, cookie, rozestup, kódování, kontrola ligy.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pozorovatel } from '../knihovna/index.js';

const soubor = (f) => readFileSync(new URL(`../ukazky/${f}`, import.meta.url));
const cp1250 = (s) => {
  // Ukázky jsou v UTF-8, hra posílá windows-1250. Pro test stačí znaky, které v ukázkách jsou.
  const mapa = { 'á': 0xe1, 'č': 0xe8, 'ď': 0xef, 'é': 0xe9, 'ě': 0xec, 'í': 0xed, 'ň': 0xf2, 'ó': 0xf3, 'ř': 0xf8, 'š': 0x9a,
    'ť': 0x9d, 'ú': 0xfa, 'ů': 0xf9, 'ý': 0xfd, 'ž': 0x9e, 'Á': 0xc1, 'Č': 0xc8, 'É': 0xc9, 'Ě': 0xcc, 'Í': 0xcd, 'Ř': 0xd8,
    'Š': 0x8a, 'Ú': 0xda, 'Ů': 0xd9, 'Ý': 0xdd, 'Ž': 0x8e, 'î': 0xee };
  return Uint8Array.from([...s].map((c) => mapa[c] ?? (c.charCodeAt(0) < 128 ? c.charCodeAt(0) : 0x3f)));
};

function falesnaHra(liga = '2A') {
  const pozadavky = [];
  const odpovedi = {
    'login.asp': () => ({ html: soubor('2A_den9_pozorovatel.html').toString('utf8').replace('>2A<', `>${liga}<`), cookie: 'ASPSESSION=abc; path=/' }),
    'map_export_json.asp': () => ({ json: soubor('2A_den9_mapa.json').toString('utf8') }),
    'smlouvy_export_json.asp': () => ({ json: soubor('2A_den9_smlouvy.json').toString('utf8') }),
    'map_new.asp': () => ({ html: soubor('2A_den9_map_new.html').toString('utf8') }),
    'hlaseni.asp': () => ({ html: soubor('2A_den9_hlaseni.html').toString('utf8') }),
    'hero.asp': () => ({ html: soubor('2A_den9_hero.html').toString('utf8') }),
  };
  const fetch = async (url, init) => {
    pozadavky.push({ url, cookie: init.headers.Cookie ?? null, ua: init.headers['User-Agent'] });
    const o = odpovedi[new URL(url).pathname.slice(1)]();
    const telo = o.json ? new TextEncoder().encode(o.json) : cp1250(o.html);
    return {
      ok: true, status: 200,
      headers: { getSetCookie: () => (o.cookie ? [o.cookie] : []), get: () => o.cookie ?? null },
      arrayBuffer: async () => telo.buffer,
      json: async () => JSON.parse(o.json),
    };
  };
  return { fetch, pozadavky };
}

test('pozorovatel: přihlášení, cookie a všechny zdroje', async () => {
  const hra = falesnaHra();
  const pauzy = [];
  const p = pozorovatel('2A', { fetch: hra.fetch, pauza: async (ms) => { pauzy.push(ms); } });
  assert.deepEqual(await p.prihlas(), { liga: '2A', den: 9, dohrana: false });
  assert.equal((await p.mapa()).zeme.length, 431);
  assert.equal((await p.sousede()).size, 431);
  assert.equal((await p.strankaMapy()).hrdinove.length, 12);
  assert.equal((await p.nejUdalosti()).utok.sila, 722);
  const h = await p.hrdina(260711);
  assert.equal(h.zem, 'Citadela Eliador', 'diakritika z windows-1250');
  assert.equal(hra.pozadavky[0].cookie, null);
  assert.ok(hra.pozadavky.slice(1).every((r) => r.cookie === 'ASPSESSION=abc'), 'cookie z přihlášení jde dál');
  assert.equal(hra.pozadavky.at(-1).url, 'https://www.darkelf.cz/hero.asp?h=260711');
  assert.equal(pauzy.length, 5, 'mezi šesti požadavky pět pauz');
  assert.ok(pauzy.every((ms) => ms > 5000));
});

test('pozorovatel v jiné lize, než se čekalo, je chyba', async () => {
  const p = pozorovatel('2A', { fetch: falesnaHra('3J').fetch, pauza: async () => {} });
  await assert.rejects(p.prihlas(), /v lize 3J/);
});
