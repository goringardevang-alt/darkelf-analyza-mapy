# Jak postavit analyzujícího bota

Návod vede od nuly k botovi, který každý den po přepočtu stáhne mapu ligy, uloží si ji, porovná
se včerejškem a pošle shrnutí do kanálu na Discordu. Hotový funkční základ je v [`priklad-bot/`](priklad-bot/),
výpočty v [`knihovna/`](knihovna/), znalosti o mapě v [`znalosti/`](znalosti/).

Celé to běží zdarma: Cloudflare Workers a databáze D1 na free plánu, Discord nic nestojí.

## Jak to funguje

```
 ┌─ Cloudflare Worker ──────────────────────────────────────────┐
 │  cron 1× denně po přepočtu                                    │
 │    pozorovatel → mapa + smlouvy + hlášení (4 požadavky)       │
 │    → snímek do D1 → rozdíl se včerejškem → zpráva do kanálu   │
 │                                                               │
 │  /discord ← příkazy z Discordu (/mapa [den])                  │
 │    ověří podpis → přečte D1 → odpoví                          │
 └───────────────────────────────────────────────────────────────┘
```

- **Žádný server ani počítač, který musí běžet.** Cloudflare Worker se spustí sám v čas cronu
  a při každém příkazu.
- **Discord se na bota obrací přes HTTP** (Interactions Endpoint), bot nemusí držet spojení.
  Zprávy do kanálu posílá přes REST API s tokenem bota.
- **Data si bot drží sám.** Hra starší dny nevrací, takže co si neuložíš, je pryč.

## 0. Vyzkoušej si to bez ničeho

Potřebuješ jen Node.js 22.5 nebo novější.

```
node --test testy/
node priklad-bot/zkus.mjs 2A
node priklad-bot/zkus.mjs 2A a:352715
```

První příkaz pustí testy nad uloženou mapou. Druhý stáhne dnešní mapu ligy 2A a vypíše strany s jejich klíči.
Třetí vypíše shrnutí z pohledu zvolené strany (`a:<id aliance>` nebo `h:<id hráče>`).
Databáze je jen v paměti, rozdíl proti včerejšku tu proto neuvidíš.

## 1. Discord

1. Na <https://discord.com/developers/applications> **New Application**, pojmenuj ji.
2. V **General Information** si opiš **Application ID** a **Public Key**.
3. V **Bot** klikni na **Reset Token** a token si ulož do správce hesel. **Nikam ho nevkládej:
   do kódu, do chatu ani do souboru v repu.** Kdo ho má, ovládá bota.
4. Pozvi bota na server tímhle odkazem (doplň Application ID):
   ```
   https://discord.com/oauth2/authorize?client_id=<APP_ID>&scope=bot+applications.commands&permissions=68608&integration_type=0
   ```
   `68608` = vidět kanál, psát zprávy, číst historii. Bez `scope=bot` se přidá jen aplikace
   a bot pak do kanálu psát nemůže (chyba „Missing Access").
5. V Discordu zapni **Nastavení → Pokročilé → Režim vývojáře**. Pak jde pravým klikem zkopírovat
   **ID kanálu** a **ID serveru**.

## 2. Cloudflare

```
npx wrangler login
npx wrangler d1 create analyza-mapy
npx wrangler d1 execute analyza-mapy --remote --file priklad-bot/schema.sql
```

Zkopíruj `priklad-bot/wrangler.toml.example` na `priklad-bot/wrangler.toml` a doplň:
ID databáze z `d1 create`, ligu, pohled, Application ID, Public Key a ID kanálu.
`wrangler.toml` je v `.gitignore`.

```
cd priklad-bot
npx wrangler secret put DISCORD_TOKEN
npx wrangler deploy
```

Wrangler vypíše adresu Workeru, třeba `https://analyza-mapy.<tvůj-subdomén>.workers.dev`.
Nový certifikát na `workers.dev` může pár minut trvat.

## 3. Propojení

1. V Developer Portalu v **General Information** vlož adresu Workeru do **Interactions Endpoint URL**
   a ulož. Discord pošle zkušební PING s podpisem, Worker musí odpovědět, jinak adresu nepřijme.
2. Zaregistruj příkaz `/mapa` na svém serveru (token jen v proměnné prostředí, ne v souboru):
   ```
   DISCORD_TOKEN=... APP_ID=... GUILD_ID=... node priklad-bot/registruj.mjs
   ```
   Ve Windows PowerShellu: `$env:DISCORD_TOKEN='...'; $env:APP_ID='...'; $env:GUILD_ID='...'; node priklad-bot/registruj.mjs`.
3. První shrnutí přijde po nejbližším cronu, rozdíl proti včerejšku den po něm.

## 4. Pasti, na které se narazilo

- **Discord neověří znovu stejnou adresu.** Když endpoint napoprvé selže a uložíš stejnou URL znovu,
  nic se nestane. Pomůže uložit jinou cestu, třeba `…workers.dev/discord`.
- **Řádek začínající datem** („4. 7.") bere Discord jako číslovaný seznam a přečísluje ho. Data dej do `kódu`.
- **Zpráva má nejvýš 2000 znaků.** `bot.js` ji zkrátí, lepší je psát méně.
- **Odpověď na příkaz musí přijít do 3 sekund.** Na delší výpočet odpověz typem 5 (odložená odpověď)
  a výsledek pošli později přes `PATCH /webhooks/<app>/<token>/messages/@original`.
- **Cron je v UTC.** `30 23 * * *` je 0:30 v zimě a 1:30 v létě českého času.
- **Kódování.** HTML hry je windows-1250, `response.text()` z něj udělá paznaky. Používej `arrayBuffer()`
  a `TextDecoder('windows-1250')`, knihovna to dělá sama.

## 5. Limity free plánu

| Co | Limit | Pro bota |
|---|---|---|
| požadavky na Worker | 100 000 denně | příkazy z Discordu, nic |
| čas procesoru | 10 ms na jedno spuštění | **těsné**: snímek je ~300 kB JSON na čtení a zápis. Změř v Cloudflare (Observability) |
| podpožadavky | 50 na spuštění | 4 na ligu |
| D1 úložiště | 5 GB | ~230 kB na den a ligu |
| D1 zápisy | 100 000 denně | 1 na den a ligu |

Když čas procesoru nestačí: každou ligu zpracuj v samostatném spuštění, ukládej menší snímek (jen pole,
která používáš), nebo pusť stejný kód v Node na vlastním počítači (Raspberry Pi) s plánovačem úloh.
Logika v `bot.js` na Cloudflare nezávisí.

## 6. Kam to rozšířit

- **Hrdinové a krypty:** `strankaMapy()` a `rozdilHrdinu()`, u nového hrdiny `hrdina(id)` pro majitele.
- **Vývoj fronty v čase:** `/fronta` s tabulkou hraničních zemí po dnech.
- **Hráč a aliance v čase:** země, síla a domy po dnech, co dobyl a co ztratil.
- **Nastavení kanálu příkazem:** liga a pohled pro každý kanál zvlášť v databázi místo `wrangler.toml`.
- **Soukromé zprávy:** `POST /users/@me/channels` s `recipient_id` vrátí kanál pro DM.
- **AI komentář:** nech jazykový model napsat pár vět nad **spočítanými fakty** (ne nad surovou mapou),
  ať nemá prostor si vymýšlet. Fakta z knihovny jsou přesná, komentář je jen výklad.
- **Konec věku a vítěz:** stránka pozorovatele (`dohrana`) a Síň slávy (`statistiky/sin_slavy.asp`).

Co z toho uděláš a ověříš, nabídni prosím zpátky do původního repa, viz [CONTRIBUTING](CONTRIBUTING.md).
