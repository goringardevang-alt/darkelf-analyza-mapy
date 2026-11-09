// Cloudflare Worker: jednou denně snímek mapy a shrnutí do kanálu, příkaz /mapa.
// Nastavení: wrangler.toml (podle wrangler.toml.example) a tajný DISCORD_TOKEN přes `wrangler secret put`.
import { pozorovatel } from '../knihovna/index.js';
import { denniBeh, prikazMapa } from './bot.js';

const API = 'https://discord.com/api/v10';
const hexNaBajty = (hex) => new Uint8Array(hex.match(/../g).map((b) => parseInt(b, 16)));

// Discord podepisuje každý požadavek klíčem aplikace (Ed25519). Bez platného podpisu se nic nedělá,
// a Discord to při uložení adresy zkouší: endpoint, který podpis neověřuje, nepřijme.
export async function overPodpis(publicKey, podpis, cas, telo) {
  if (!podpis || !cas) return false;
  try {
    const klic = await crypto.subtle.importKey('raw', hexNaBajty(publicKey), { name: 'Ed25519' }, false, ['verify']);
    return await crypto.subtle.verify('Ed25519', klic, hexNaBajty(podpis), new TextEncoder().encode(cas + telo));
  } catch {
    return false;
  }
}

async function posli(env, text) {
  const r = await fetch(`${API}/channels/${env.KANAL}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${env.DISCORD_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: text, allowed_mentions: { parse: [] } }),
  });
  if (!r.ok) throw new Error(`Discord: ${r.status} ${await r.text()}`);
}

const cfg = (env) => ({ liga: env.LIGA, pohled: env.POHLED });
const dnes = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Prague' });

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('analyza mapy', { status: 200 });
    const telo = await request.text();
    const ok = await overPodpis(env.PUBLIC_KEY, request.headers.get('X-Signature-Ed25519'),
      request.headers.get('X-Signature-Timestamp'), telo);
    if (!ok) return new Response('Neplatný podpis', { status: 401 });
    const i = JSON.parse(telo);
    if (i.type === 1) return Response.json({ type: 1 }); // PING od Discordu
    if (i.type === 2 && i.data.name === 'mapa') {
      const den = i.data.options?.find((o) => o.name === 'den')?.value ?? null;
      const text = await prikazMapa({ db: env.DB, cfg: cfg(env), den });
      return Response.json({ type: 4, data: { content: text, flags: 64, allowed_mentions: { parse: [] } } });
    }
    return Response.json({ type: 4, data: { content: 'Tenhle příkaz neznám.', flags: 64 } });
  },

  async scheduled(event, env, exec) {
    exec.waitUntil((async () => {
      try {
        const vysledek = await denniBeh({
          db: env.DB, hra: pozorovatel(env.LIGA), posli: (t) => posli(env, t), cfg: cfg(env), datum: dnes(),
        });
        console.log('denní běh', JSON.stringify(vysledek));
      } catch (e) {
        console.error(e);
        await posli(env, `⚠ Denní snímek mapy selhal: ${e.message}`).catch(() => {});
      }
    })());
  },
};
