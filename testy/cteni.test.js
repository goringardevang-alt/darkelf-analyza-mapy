// Čtení skutečných stránek a exportů: liga 2A, 9. den (9. 11. 2026), pozorovatel.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ctiPozorovatele, ctiMapu, ctiSousedy, ctiStrankuMapy, ctiNejUdalosti, ctiHrdinu } from '../knihovna/index.js';
import { pasmoSily, domy, domyStred, vez, krypta, RASY } from '../knihovna/index.js';

const ukazka = (f) => readFileSync(new URL(`../ukazky/${f}`, import.meta.url), 'utf8');
const json = (f) => JSON.parse(ukazka(f));

test('obrázky: síla, domy, pevnost, věž, krypta', () => {
  assert.deepEqual(pasmoSily('v3.gif'), { pasmo: 3, valka: true, od: 200, do: 399 });
  assert.deepEqual(pasmoSily('s0.gif'), { pasmo: 0, valka: false, od: 0, do: 0 });
  assert.equal(pasmoSily('s7.gif').do, null);
  assert.deepEqual(domy('3v5.gif'), { rasa: 3, pevnost: null, pasmo: 5, od: 200, do: 249 });
  assert.equal(domy('0v3.gif').rasa, 0, 'Lidé mají v obrázku nulu');
  assert.deepEqual([domy('1v1.gif').od, domy('1v1.gif').do], [0, 49], 'hra píše < 50');
  assert.equal(domy('v0.gif').rasa, null, 'neutrálka bez domů nemá číslo rasy');
  assert.equal(domy('10p4.gif').pevnost.nazev, 'Střední pevnost');
  assert.equal(domy('10p4.gif').pevnost.obrana, 1.5);
  assert.equal(domyStred(domy('1v2.gif')), 75);
  assert.equal(domyStred(domy('1v6.gif')), 275);
  assert.equal(domyStred(domy('1p3.gif')), null);
  assert.equal(vez('m1.gif'), null);
  assert.equal(vez('3m3.gif'), 'Malá magická věž');
  assert.deepEqual(krypta('c2v.gif'), { typ: 2, vykradena: true });
  assert.deepEqual(krypta('c11.gif'), { typ: 11, vykradena: false });
  assert.equal(RASY[7], 'Temní Elfové');
});

test('stránka pozorovatele', () => {
  assert.deepEqual(ctiPozorovatele(ukazka('2A_den9_pozorovatel.html')), { liga: '2A', den: 9, dohrana: false });
});

test('export mapy', () => {
  const m = ctiMapu(json('2A_den9_mapa.json'));
  assert.equal(m.liga, '2A');
  assert.equal(m.den, 9);
  assert.equal(m.zeme.length, 431);
  assert.equal(m.zeme.filter((z) => z.hrac).length, 412);
  const zatoka = m.zeme.find((z) => z.nazev === 'Zátoka elfů');
  assert.equal(zatoka.nick, 'Celuar');
  assert.deepEqual([zatoka.domy.od, zatoka.domy.do], [200, 249], 'hlášení ten den: nejvíc domů Celuar 200');
  const byci = m.zeme.find((z) => z.nazev === 'Býčí věž');
  assert.equal(byci.velitel, '654697', 'id_velitele = velitel aliance');
  assert.equal(byci.bonusObrana, 15);
  assert.equal(byci.vez, null);
  assert.equal(m.zeme.find((z) => z.nazev === 'Baldur').domy.pevnost.nazev, 'Velká pevnost');
  // V živém exportu pole valka sedí s písmenem v ikoně síly u všech zemí.
  assert.ok(m.zeme.every((z) => z.valka === z.pasmoSily.valka));
  // Hráčova zem bez vojska má sílu 0, ikona síly pak pásmo 0.
  assert.ok(m.zeme.filter((z) => z.hrac && z.sila === 0).every((z) => z.pasmoSily.pasmo === 0));
  // min_utok mají jen neutrálky (kromě Země Dark Elfa).
  assert.ok(m.zeme.filter((z) => z.minUtok != null).every((z) => !z.hrac));
});

test('sousedé ze smluvního exportu jsou symetričtí', () => {
  const s = ctiSousedy(json('2A_den9_smlouvy.json'));
  assert.equal(s.size, 431);
  for (const [id, seznam] of s) {
    for (const x of seznam) {
      const zpet = s.get(x.id).find((y) => y.id === id);
      assert.ok(zpet, `${x.id} nemá souseda ${id}`);
    }
  }
});

test('hrdinové a krypty ze stránky mapy', () => {
  const { hrdinove, krypty } = ctiStrankuMapy(ukazka('2A_den9_map_new.html'));
  assert.equal(hrdinove.length, 12);
  assert.equal(krypty.length, 8);
  assert.deepEqual(hrdinove.find((h) => h.id === 260711), { zem: 480, id: 260711, jmeno: 'Thalindor', zkusenost: 41712, obrazek: '58.gif' });
  assert.equal(hrdinove.find((h) => h.id === 1052).jmeno, 'Dark Elf (2A)', 'závorka ve jménu nesmí splést zkušenost');
  assert.deepEqual(krypty.find((k) => k.zem === 242), { zem: 242, id: 850120, typ: 2, vykradena: true, nebezpecnost: 'malá' });
});

test('nej-události z hlášení pozorovatele', () => {
  const n = ctiNejUdalosti(ukazka('2A_den9_hlaseni.html'));
  assert.equal(n.cas, '9. 11. 2026 0:02:27');
  assert.deepEqual(n.kouzlo, { hrac: { id: '654500', nick: 'Api' }, sila: 11, rasa: 'Temní Elfové', aliance: null });
  assert.deepEqual(n.utok, { hrac: { id: '336190', nick: 'Posel 112 (4)' }, sila: 722, rasa: 'Temní Elfové',
    aliance: { id: '352716', nazev: 'Poslové 2018' } });
  assert.deepEqual(n.domy, { hrac: { id: '236099', nick: 'Celuar' }, pocet: 200, rasa: 'Skuruti',
    aliance: { id: '352715', nazev: 'Lamky 2A' } });
  assert.equal(n.stavby.zem, 'Baldur');
  assert.equal(n.stavby.pocet, 13);
  assert.equal(n.stavby.hrac.nick, 'Celuar');
  assert.equal(ctiNejUdalosti('<html>nic</html>'), null);
});

test('detail hrdiny', () => {
  const h = ctiHrdinu(ukazka('2A_den9_hero.html'));
  assert.equal(h.jmeno, 'Thalindor');
  assert.equal(h.povolani, 'Bojovník stavitel');
  assert.equal(h.majitel, 'Celuar');
  assert.equal(h.majitelId, '236099');
  assert.equal(h.zem, 'Citadela Eliador');
  assert.equal(h.zemId, 480);
  assert.equal(h.stav, 'Brání zemi');
  assert.equal(h.zkusenost, 41712);
  assert.equal(h.zivoty, 10);
  assert.equal(h.utok, 11);
  assert.equal(h.obrana, 60);
  assert.equal(h.levely['Level útok'], 21);
  assert.equal(h.levely['Level obrana'], 33);
});
