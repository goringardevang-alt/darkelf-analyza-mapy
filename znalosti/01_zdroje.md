# 1. Odkud brát data

## Pozorovatel

Každá liga má pozorovatelský vstup: `https://www.darkelf.cz/login.asp?l=<liga>` (třeba `l=2A`).
Nepotřebuje heslo, dostaneš cookie relace a s ní čteš stránky jako hráč „Pozorovatel <liga>",
který v žádné alianci není. Vidíš tedy přesně to, co vidí cizí hráč.

Na stránce pozorovatele je liga a herní den. Dohraná liga má úsek „- jsi přihlášen" obarvený třídou `v`
(ve hře červeně), to je nejspolehlivější znamení konce věku. Záloha: herní den spadne na nízké číslo.

## Kdy je stav platný

- V **klasické lize** se útoky vyhodnocují v **půlnočním přepočtu**. Cizí vojsko a stavby vidíš
  ve stavu **z posledního přepočtu**, změny přes den se ukážou až po dalším.
- V **akční lize** se útoky vyhodnocují do 15 minut a mapa cizích hráčů je 15 minut stará.
- Pro klasickou ligu proto stačí **jeden snímek denně** kdykoli mezi přepočty. Zachytí všechny změny
  vlastníků za ten přepočet. Nezachytí pořadí útoků uvnitř přepočtu: zem, kterou v jednom přepočtu
  dobyl A a hned po něm B, vypadá jako dobytá rovnou od B.

## Stránky a exporty

| Adresa | Formát | Co nese |
|---|---|---|
| `login.asp?l=<liga>` | HTML | přihlášení pozorovatele, liga, den, konec věku |
| `map_export_json.asp` | JSON (UTF-8) | všechny země: vlastník, aliance, síla vojska, obrázky domů a věží, bonusy, válka. **Hlavní zdroj.** |
| `smlouvy_export_json.asp` | JSON (UTF-8) | sousedé každé země (`s1`–`s10`) a válka s každým z nich (`public.w1`–`w10`) |
| `map_new.asp` | HTML | navíc hrdinové a krypty |
| `hero.asp?h=<id>` | HTML | veřejný detail hrdiny |
| `hlaseni.asp` | HTML | u pozorovatele jen nej-události dne a počasí |
| `statistiky/sin_slavy.asp` | HTML, POST `cb_league=<liga>` | Síň slávy: dohrané věky, vítězové |
| `prehled_ras_stavby.asp` | HTML | legenda obrázků na mapě |

HTML stránky hry jsou v kódování **windows-1250**. Dekóduj je přes
`new TextDecoder('windows-1250').decode(await odpoved.arrayBuffer())`, ne přes `.text()`.

## Slušnost vůči serveru

- **Export mapy server pouští nejvýš jednou za 5 sekund** a sám ho cachuje 2 minuty (`cache_next_refresh`
  v hlavičce). Mezi požadavky čekej aspoň 5 s, knihovna to dělá sama.
- Analyzujícímu botovi stačí **pár požadavků denně** (přihlášení, mapa, smlouvy, stránka mapy, hlášení).
  Netahej data každou minutu, nic nového tam nebude.
- Pošli rozumný `User-Agent`, ze kterého je poznat, co jsi zač.
- **Jen čti.** Bot nemá ve hře nic dělat za hráče.

### Když čteš jako přihlášený hráč (třeba v userscriptu)

Hra si v relaci drží „naposledy otevřenou zemi" a formuláře (smlouva, verbování, nákup) ji používají.
**Nikdy na pozadí nestahuj stránku cizí země** (`e.asp?id=`, `b.asp?id=`, `c.asp?id=`, `a.asp?id=`):
hráčova další akce by se mohla provést na jiné zemi. Bezpečné jsou exporty a stránky, které na zemi
vázané nejsou (`map_export_json.asp`, `smlouvy_export_json.asp`, `hlaseni.asp`, `hero.asp`).
Pozorovatele se to netýká, ten nic nehraje.
