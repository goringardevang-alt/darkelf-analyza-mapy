# Dark Elf: analýza mapy

Znalosti, knihovna a návod, jak číst a rozebírat mapu online hry [darkelf.cz](https://www.darkelf.cz)
a postavit nad tím bota, který každý den shrne, co se na mapě stalo.

Všechno je ověřené na skutečných datech (liga 2A, listopad 2026) a pokryté testy.

## Co tu je

| Cesta | Co |
|---|---|
| [`znalosti/`](znalosti/) | co se dá z mapy vyčíst: zdroje, pole exportu, obrázky, odvozené údaje, fronta, limity |
| [`knihovna/`](knihovna/) | čistý JavaScript bez závislostí: čtení exportů a stránek, rozdíl dvou dnů, fronta, text shrnutí |
| [`priklad-bot/`](priklad-bot/) | funkční základ bota pro Cloudflare Workers + D1 + Discord |
| [`navod_bot.md`](navod_bot.md) | krok za krokem od nuly k běžícímu botovi |
| [`ukazky/`](ukazky/) | skutečná data z 2A, 9. den, pro testy a zkoumání |
| [`testy/`](testy/) | `node --test testy/` |

## Rychlý start

Node.js 22.5+:

```
node --test testy/
node priklad-bot/zkus.mjs 2A
```

Druhý příkaz stáhne dnešní mapu ligy 2A jako pozorovatel a vypíše strany. Pak
`node priklad-bot/zkus.mjs 2A <klíč strany>` vypíše shrnutí z jejího pohledu. Dál pokračuj [návodem](navod_bot.md).

## Knihovna v kostce

```js
import { pozorovatel, rozdil, fronta, textSouhrnu } from './knihovna/index.js';

const hra = pozorovatel('2A');
await hra.prihlas();
const mapa = await hra.mapa();          // země s vlastníkem, silou, pásmem domů, pevností, věží…
const sousede = await hra.sousede();    // sousedé každé země a války
const f = fronta(mapa, sousede, 'a:352715', 'a:352716');
// { hraniceA: 37, hraniceB: 28, styky: 70, veValce: 44, vybezky: [...] }
```

## Pravidla

- **Jen čti.** Bot nemá ve hře nic dělat. Pár požadavků denně, rozestup aspoň 5 s (knihovna to hlídá sama).
- **Tokeny a klíče nikdy do repa.** Na Cloudflare přes `wrangler secret put`.

## Přispívání

Repo je otevřené, stav na něm, rozšiřuj ho. Když přidáš novou ověřenou znalost o hře nebo hotovou funkci,
nabídni ji prosím zpátky do [původního repa](https://github.com/goringardevang-alt/darkelf-analyza-mapy)
přes pull request. Podrobnosti v [CONTRIBUTING.md](CONTRIBUTING.md). Pokud pracuješ s AI asistentem,
pokyny pro něj jsou v [AGENTS.md](AGENTS.md) a připomene ti to sám, nic ale bez tvého souhlasu neodešle.

Licence [MIT](LICENSE).
