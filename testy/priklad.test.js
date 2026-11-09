// Ukázkový bot bez sítě: podvržená hra a D1 nad SQLite.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ctiMapu, ctiSousedy, ctiNejUdalosti } from '../knihovna/index.js';
import { denniBeh, prikazMapa } from '../priklad-bot/bot.js';
import { overPodpis } from '../priklad-bot/worker.js';
import { d1 } from './d1.js';

const ukazka = (f) => readFileSync(new URL(`../ukazky/${f}`, import.meta.url), 'utf8');
const mapa9 = ctiMapu(JSON.parse(ukazka('2A_den9_mapa.json')));
const sousede = ctiSousedy(JSON.parse(ukazka('2A_den9_smlouvy.json')));
const nej = ctiNejUdalosti(ukazka('2A_den9_hlaseni.html'));
const cfg = { liga: '2A', pohled: 'a:352715' };

function hra(mapa, { dohrana = false, bezNej = false } = {}) {
  const volani = [];
  return {
    volani,
    prihlas: async () => { volani.push('prihlas'); return { liga: '2A', den: mapa.den, dohrana }; },
    mapa: async () => { volani.push('mapa'); return structuredClone(mapa); },
    sousede: async () => { volani.push('sousede'); return sousede; },
    nejUdalosti: async () => { volani.push('nej'); if (bezNej) throw new Error('hlášení nejde'); return nej; },
  };
}

test('dva dny po sobě: první snímek, pak rozdíl a /mapa', async () => {
  const db = d1(new URL('../priklad-bot/schema.sql', import.meta.url));
  const zpravy = [];
  const posli = async (t) => { zpravy.push(t); };

  const h9 = hra(mapa9);
  assert.deepEqual(await denniBeh({ db, hra: h9, posli, cfg, datum: '2026-11-09' }), { vek: 1, den: 9 });
  assert.deepEqual(h9.volani, ['prihlas', 'mapa', 'sousede', 'nej']);
  assert.match(zpravy[0], /2A, 9\. den\*\* \(pohled Lamky 2A\)/);
  assert.match(zpravy[0], /první snímek/);
  assert.match(zpravy[0], /Fronta s Poslové 2018: 37 hraničních zemí/);
  assert.match(zpravy[0], /útok 722 \(Posel 112 \(4\)\)/);

  // 10. den: Celuar vezme Poslům jednu hraniční zem.
  const mapa10 = structuredClone(mapa9);
  mapa10.den = 10;
  const celuar = mapa10.zeme.find((z) => z.nick === 'Celuar');
  const cil = mapa10.zeme.find((z) => z.nazevAliance === 'Poslové 2018' && sousede.get(z.id).some((s) => mapa10.zeme.find((x) => x.id === s.id).aliance === '352715'));
  Object.assign(cil, { hrac: celuar.hrac, nick: 'Celuar', aliance: celuar.aliance, nazevAliance: celuar.nazevAliance });
  await denniBeh({ db, hra: hra(mapa10, { bezNej: true }), posli, cfg, datum: '2026-11-10' });
  assert.match(zpravy[1], new RegExp(`🏴 Celuar \\(Lamky 2A\\) vzal .* \\(Poslové 2018\\) zem ${cil.nazev}`));
  assert.match(zpravy[1], /Fronta s Poslové 2018: 37 hraničních zemí, 70 → 68 styků/);
  assert.match(zpravy[1], /Fronta s Api: 13 hraničních zemí, 29 styků/, 'beze změny bez šipky');
  assert.doesNotMatch(zpravy[1], /Nej-události/, 'bez hlášení se shrnutí pošle i tak');
  assert.ok(zpravy.every((t) => t.length <= 2000));

  assert.equal(await prikazMapa({ db, cfg, den: 9 }), zpravy[0]);
  assert.equal(await prikazMapa({ db, cfg }), zpravy[1]);
  assert.equal(await prikazMapa({ db, cfg, den: 3 }), 'Den 3 nemám uložený.');
});

test('nový věk: den klesne, začne se počítat od 2. věku', async () => {
  const db = d1(new URL('../priklad-bot/schema.sql', import.meta.url));
  const posli = async () => {};
  await denniBeh({ db, hra: hra(mapa9, { dohrana: true }), posli, cfg, datum: '2026-11-09' });
  const mapa0 = { ...structuredClone(mapa9), den: 0 };
  assert.deepEqual(await denniBeh({ db, hra: hra(mapa0), posli, cfg, datum: '2026-11-10' }), { vek: 2, den: 0 });
  assert.equal(await prikazMapa({ db, cfg: { ...cfg, liga: '3J' } }), 'Zatím nemám uložený žádný den.');
});

test('podpis Discordu: bez platného podpisu nic', async () => {
  const klice = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
  const verejny = hex(await crypto.subtle.exportKey('raw', klice.publicKey));
  const telo = '{"type":1}', cas = '1700000000';
  const podpis = hex(await crypto.subtle.sign('Ed25519', klice.privateKey, new TextEncoder().encode(cas + telo)));
  assert.equal(await overPodpis(verejny, podpis, cas, telo), true);
  assert.equal(await overPodpis(verejny, podpis, cas, telo + ' '), false);
  assert.equal(await overPodpis(verejny, null, cas, telo), false);
});
