// Rozbor nad skutečnou mapou 2A, 9. den. „Včerejšek" se vyrábí úpravou kopie, aby byly změny známé.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ctiMapu, ctiSousedy, ctiStrankuMapy, strana, souhrn, rozdil, fronta, fronty, koeficientObrany, rozdilHrdinu, jePosel } from '../knihovna/index.js';

const json = (f) => JSON.parse(readFileSync(new URL(`../ukazky/${f}`, import.meta.url), 'utf8'));
const mapa = ctiMapu(json('2A_den9_mapa.json'));
const sousede = ctiSousedy(json('2A_den9_smlouvy.json'));
const LAMKY = 'a:352715', POSLOVE = 'a:352716', API = 'h:654500';
const kopie = () => structuredClone(mapa);
const zem = (m, nazev) => m.zeme.find((z) => z.nazev === nazev);

test('strana: aliance, hráč bez aliance zvlášť, neutrálka', () => {
  assert.equal(strana(zem(mapa, 'Býčí věž')).klic, LAMKY);
  assert.equal(strana(mapa.zeme.find((z) => z.nick === 'Api')).klic, API);
  assert.equal(strana(mapa.zeme.find((z) => !z.hrac)).klic, 'n');
  assert.ok(mapa.zeme.filter((z) => z.nazevAliance === 'Poslové 2018').every(jePosel));
});

test('souhrn po stranách', () => {
  const s = souhrn(mapa);
  const lamky = s.find((x) => x.klic === LAMKY);
  assert.equal(lamky.zemi, 316);
  assert.equal(lamky.bezDomu, 4, '4 země s pevností');
  assert.equal(s.reduce((n, x) => n + x.zemi, 0), 431);
  assert.equal(s.find((x) => x.klic === 'n').domy, 0);
});

test('koeficient obrany: pevnost + vlastní bonus země', () => {
  assert.equal(koeficientObrany(zem(mapa, 'Býčí věž')), 1.15);
  assert.equal(koeficientObrany(zem(mapa, 'Baldur')), 2 + zem(mapa, 'Baldur').bonusObrana / 100);
});

test('fronta Lamky proti Poslům (ověřeno ručně 9. 11.)', () => {
  const f = fronta(mapa, sousede, LAMKY, POSLOVE);
  assert.equal(f.hraniceA, 37);
  assert.equal(f.hraniceB, 28);
  assert.equal(f.styky, 70);
  assert.equal(f.veValce, 44);
  assert.equal(f.vybezky.reduce((n, v) => n + v.pocet, 0), 70);
  const g = fronta(mapa, sousede, POSLOVE, LAMKY);
  assert.deepEqual([g.hraniceA, g.hraniceB, g.styky], [28, 37, 70], 'z druhé strany zrcadlově');
});

test('fronty: hráči bez aliance každý zvlášť, neutrálky jen na požádání', () => {
  const vse = fronty(mapa, sousede, LAMKY);
  assert.equal(vse[0].b, POSLOVE);
  assert.equal(vse.find((f) => f.b === API).hraniceA, 13);
  assert.ok(!vse.some((f) => f.b === 'n'));
  assert.equal(fronty(mapa, sousede, LAMKY, { iNeutralky: true }).find((f) => f.b === 'n').hraniceA, 35);
});

test('fronta: z výběžku je po zabrání sousedů zázemí, bez soupeře fronta zmizí', () => {
  const pred = fronta(mapa, sousede, LAMKY, POSLOVE);
  const vybezek = pred.vybezky[0].zem;
  const m = kopie();
  const lamka = m.zeme.find((z) => z.id === vybezek);
  const prebarvi = (z) => Object.assign(z, { hrac: lamka.hrac, nick: lamka.nick, aliance: lamka.aliance, nazevAliance: lamka.nazevAliance });
  for (const s of sousede.get(vybezek)) {
    const z = m.zeme.find((x) => x.id === s.id);
    if (z.aliance === '352716') prebarvi(z);
  }
  assert.ok(!fronta(m, sousede, LAMKY, POSLOVE).vybezky.some((v) => v.zem === vybezek));
  m.zeme.filter((z) => z.aliance === '352716').forEach(prebarvi);
  const konec = fronta(m, sousede, LAMKY, POSLOVE);
  assert.deepEqual([konec.hraniceA, konec.hraniceB, konec.styky], [0, 0, 0]);
});

test('rozdíl dvou dnů: dobytí, z neutrálky, na neutrálku, noví, zmizelí, přechody', () => {
  const vcera = kopie();
  // Včera patřil Baldur Poslovi, dnes Celuarovi = dobytí.
  const posel = mapa.zeme.find((z) => z.nazevAliance === 'Poslové 2018');
  Object.assign(zem(vcera, 'Baldur'), { hrac: posel.hrac, nick: posel.nick, aliance: posel.aliance, nazevAliance: posel.nazevAliance, sila: 300 });
  // Včera byla Býčí věž neutrálka = dnes zabraná z neutrálky.
  Object.assign(zem(vcera, 'Býčí věž'), { hrac: null, nick: null, aliance: null, nazevAliance: null });
  // Dnešní neutrálka Houštiny včera patřila hráči, který dnes zmizel.
  Object.assign(zem(vcera, 'Houštiny'), { hrac: '999', nick: 'Odlogy', aliance: null, nazevAliance: null });
  // Api byl včera v alianci Poslů.
  for (const z of vcera.zeme.filter((z) => z.nick === 'Api')) Object.assign(z, { aliance: '352716', nazevAliance: 'Poslové 2018' });

  const r = rozdil(vcera, mapa);
  const baldur = r.zmeny.find((z) => z.nazev === 'Baldur');
  assert.equal(baldur.typ, 'dobytí');
  assert.equal(baldur.z.strana.klic, POSLOVE);
  assert.equal(baldur.na.nick, 'Celuar');
  assert.equal(baldur.vcera.sila, 300);
  assert.equal(r.zmeny.find((z) => z.nazev === 'Býčí věž').typ, 'z neutrálky');
  assert.equal(r.zmeny.find((z) => z.nazev === 'Houštiny').typ, 'na neutrálku');
  assert.equal(r.zmeny.length, 3);
  assert.deepEqual(r.zmizeli.map((h) => h.nick), ['Odlogy']);
  assert.deepEqual(r.novi, []);
  assert.deepEqual(r.prechody.map((h) => [h.nick, h.z, h.na]), [['Api', 'Poslové 2018', null]]);
  assert.deepEqual(rozdil(mapa, mapa), { zmeny: [], novi: [], zmizeli: [], prechody: [] });
});

test('rozdíl hrdinů', () => {
  const { hrdinove } = ctiStrankuMapy(readFileSync(new URL('../ukazky/2A_den9_map_new.html', import.meta.url), 'utf8'));
  const vcera = structuredClone(hrdinove);
  vcera.find((h) => h.id === 260711).zem = 479;
  vcera.find((h) => h.id === 260711).zkusenost -= 500;
  vcera.push({ zem: 1, id: 1, jmeno: 'Padlý', zkusenost: 1 });
  const r = rozdilHrdinu(vcera.filter((h) => h.id !== 1052), hrdinove);
  assert.deepEqual(r.novi.map((h) => h.id), [1052]);
  assert.deepEqual(r.zmizeli.map((h) => h.jmeno), ['Padlý']);
  assert.deepEqual(r.presuny.map((h) => [h.id, h.odkud, h.zem]), [[260711, 479, 480]]);
  assert.deepEqual(r.zkusenost.map((h) => [h.id, h.pribylo]), [[260711, 500]]);
});
