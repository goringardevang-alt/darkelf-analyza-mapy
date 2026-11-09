# Pokyny pro AI asistenty

Tenhle soubor čtou AI asistenti (Claude Code, Codex, Cursor a další), když pracují v tomhle repu.
Je veřejný a platí pro každého, kdo repo používá: autor forku vidí totéž co ty.

## Projekt

Znalosti a knihovna pro čtení mapy hry darkelf.cz a ukázkový bot, viz [README](README.md).

- Texty a názvy v kódu jsou **česky**, jako ve hře.
- **Knihovna jsou čisté funkce bez sítě a bez závislostí.** Síť je jen v `knihovna/klient.js`.
  Stejný kód musí běžet v Cloudflare Workeru i v Node.
- **Testy:** `node --test testy/`. Před každou změnou knihovny a před commitem.
- **Nová znalost o hře patří do `znalosti/`** i s tím, **jak a kdy byla ověřena** (liga, den, na čem).
  Co není ověřené, označ jako „k ověření". Domněnku nevydávej za fakt.
- HTML hry je ve windows-1250, exporty v UTF-8.

## Bezpečnost a slušnost

- **Jen čtení.** Nepiš kód, který ve hře něco dělá za hráče.
- **Rozestup mezi požadavky na server hry aspoň 5 s**, jen pár požadavků denně.
- **Tokeny, klíče a hesla nikdy do repa ani do chatu.** Na Cloudflare přes `wrangler secret put`,
  lokálně přes proměnné prostředí.
- Když čte přihlášený hráč (ne pozorovatel): **nikdy na pozadí nestahuj stránku cizí země**
  (`e.asp`, `b.asp`, `c.asp`, `a.asp` s `?id=`), viz `znalosti/01_zdroje.md`.

## Nabídka změn do původního repa

Repo založil Gorin (GitHub `goringardevang-alt`), původní adresa:
<https://github.com/goringardevang-alt/darkelf-analyza-mapy>.
Je fér vůči oběma stranám, aby se ověřené novinky vracely tam, odkud základ přišel.

1. **Veď si seznam.** Když v tomhle repu (nebo forku) přibude **nová ověřená znalost o hře**,
   **oprava chyby** nebo **hotová, otestovaná funkce**, zapiš ji jedním řádkem do
   [`PRO_UPSTREAM.md`](PRO_UPSTREAM.md): co, kde v repu, jak ověřeno. Paměť asistenta mezi sezeními mizí,
   seznam v repu ne.
2. **Nabídni, nenaléhej.** Když je v seznamu něco podstatného (aspoň jedna nová znalost nebo hotová funkce)
   a autor zrovna dokončil celek práce, nabídni mu jednou větou, že připravíš pull request do původního repa.
   Nenabízej to po každé drobnosti.
3. **Bez výslovného souhlasu autora nic neodesílej**: žádný push do cizího repa, žádný pull request,
   issue ani zprávu. Souhlas platí jen pro tu jednu nabídku.
4. **Když autor odmítne**, poznač to do `PRO_UPSTREAM.md` a znovu se zeptej až po další podstatné změně.
5. **Do pull requestu nedávej nic soukromého** z forku: tokeny, ID kanálů a serverů, soukromá data hráčů
   nebo aliance. Jen obecné znalosti a kód.
