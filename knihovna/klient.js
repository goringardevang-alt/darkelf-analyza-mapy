// Stahování dat jako pozorovatel ligy. Jediná část knihovny, která sahá na síť.
// fetch a pauza jdou podvrhnout (testy, jiné prostředí). Pravidla slušnosti: znalosti/01_zdroje.md.
import { ctiPozorovatele, ctiMapu, ctiSousedy, ctiStrankuMapy, ctiNejUdalosti, ctiHrdinu } from './cteni.js';

const HRA = 'https://www.darkelf.cz';
const cp1250 = (b) => new TextDecoder('windows-1250').decode(b);

// rozestup: server pouští export mapy jednou za 5 s, mezi požadavky se proto čeká.
export function pozorovatel(liga, {
  fetch: f = globalThis.fetch,
  pauza = (ms) => new Promise((r) => setTimeout(r, ms)),
  rozestup = 5500,
  userAgent = 'Mozilla/5.0 (analyza mapy darkelf)',
} = {}) {
  let cookie = null;
  let posledni = 0;

  async function stahni(cesta, init = {}) {
    const ceka = posledni + rozestup - Date.now();
    if (posledni && ceka > 0) await pauza(ceka);
    posledni = Date.now();
    const r = await f(`${HRA}/${cesta}`, { ...init, headers: { 'User-Agent': userAgent, ...(cookie ? { Cookie: cookie } : {}), ...init.headers } });
    if (!r.ok && r.status !== 302) throw new Error(`${cesta}: HTTP ${r.status}`);
    return r;
  }

  return {
    // Přihlášení pozorovatele: vrátí ligu, herní den a jestli je liga dohraná. Musí být první.
    async prihlas() {
      const r = await stahni(`login.asp?l=${encodeURIComponent(liga)}`, { redirect: 'manual' });
      const cookies = r.headers.getSetCookie?.() ?? [r.headers.get('set-cookie') ?? ''];
      cookie = cookies.map((c) => c.split(';')[0]).filter(Boolean).join('; ');
      const info = ctiPozorovatele(cp1250(await r.arrayBuffer()));
      if (info.liga !== liga) throw new Error(`Pozorovatel je v lize ${info.liga}, čekal jsem ${liga}.`);
      return info;
    },
    async mapa() { return ctiMapu(await (await stahni('map_export_json.asp')).json()); },
    async sousede() { return ctiSousedy(await (await stahni('smlouvy_export_json.asp')).json()); },
    async strankaMapy() { return ctiStrankuMapy(cp1250(await (await stahni('map_new.asp')).arrayBuffer())); },
    async nejUdalosti() { return ctiNejUdalosti(cp1250(await (await stahni('hlaseni.asp')).arrayBuffer())); },
    async hrdina(id) { return ctiHrdinu(cp1250(await (await stahni(`hero.asp?h=${Number(id)}`)).arrayBuffer())); },
  };
}
