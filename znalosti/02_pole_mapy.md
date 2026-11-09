# 2. Pole exportu mapy

`map_export_json.asp` vrací `{ hlavicka, zeme[] }`. Ověřeno 9. 11. 2026 na lize 2A, 9. den
(431 zemí, 412 obsazených), ukázka je v [`ukazky/2A_den9_mapa.json`](../ukazky/2A_den9_mapa.json).
V knihovně je čte `ctiMapu()` a pole přejmenovává (sloupec „knihovna").

## Hlavička

| Pole | Význam |
|---|---|
| `liga`, `den` | liga a herní den |
| `cache_date`, `cache_next_refresh` | kdy server export vyrobil a kdy vyrobí další |
| `id_hrace`, `hrac`, `id_aliance` | kdo se ptá (u pozorovatele „Pozorovatel 2A") |
| `pocasi_penize`, `pocasi_mana`, `pocasi_domy` | počasí v % základu (příjem zlata, many, cena domů) |
| `predpoved_*` | předpověď na zítřek |

## Země

| Pole | Knihovna | Význam | Jistota |
|---|---|---|---|
| `id` | `id` | id země, stálé po celý věk | jisté |
| `zeme` | `nazev` | název | jisté |
| `id_oblast` | `oblast` | oblast mapy, 1–9 | jisté |
| `id_hrac`, `hrac` | `hrac`, `nick` | vlastník; `null` = neutrálka | jisté |
| `id_aliance`, `aliance` | `aliance`, `nazevAliance` | aliance vlastníka, `0`/`null` = bez aliance | jisté |
| `ali_erb` | | erb aliance | jisté |
| `id_velitele` | `velitel` | **velitel aliance** (stejný u všech zemí aliance), bez aliance `null` | ověřeno |
| `id_rasa` | `rasa` | rasa vlastníka, 0 = Lidé … 10 = Enti, viz [obrázky](03_obrazky.md) | jisté |
| `vlajka` | `vlajka` | vlajka hráče; **971–975 = posel** (bot hry), vysoká čísla = koupená vlastní vlajka | jisté |
| `land_power` | `sila` | **síla vojska v zemi = Σ počet jednotek × (útok + obrana)**. Obyvatelé v ní nejsou: hráčova zem bez vojska má 0 | jisté |
| `img_power` | `pasmoSily` | ikona síly: pásmo 0–7 a písmeno `s`/`v` = válka se sousedem | jisté |
| `valka` | `valka` | válka se sousedem, v živém exportu sedí s písmenem `v` u všech zemí | ověřeno |
| `img_pevnost` | `domy` | **pásmo domů po 50**, nebo pevnost, která domy schová | ověřeno |
| `img_vez` | `vez` | svatyně, magická věž nebo chrám | jisté |
| `bonus_obrana` | `bonusObrana` | **vlastní bonus země na obranu** v %, pevná vlastnost země (ve hře u země „+N % obrana"), stavby ho nemění | jisté |
| `bonus_penize`, `bonus_mana` | `bonusPenize`, `bonusMana` | vlastní bonus země na příjem zlata a many v % | jisté |
| `min_utok` | `minUtok` | potřebný útok na dobytí, **jen neutrálky** | jisté |
| `spehnora` | `obyvatel` | počet obyvatel, jen kde ho hra prozradí (u některých neutrálek) | jisté |
| `zakazane_stavby` | | zatím vždy `null` | neznámé |
| `private` | | rozpad vojska atd., **jen vlastní a alianční země**; pozorovatel ho nemá nikdy | jisté |

Zvláštní zem: **Země Dark Elfa** nemá vlastníka ani `min_utok`, ale velkou sílu a bonusy (200 %).
Neber ji jako obyčejnou neutrálku.

## Smluvní export

`smlouvy_export_json.asp` vrací `{ hlavicka, smlouvy[] }`, jeden řádek na zem:

| Pole | Význam |
|---|---|
| `id` | id země |
| `id_hrace`, `id_aliance` | vlastník |
| `s1`–`s10` | **sousední země** (id), nevyplněné `null`. Sousedství je symetrické, průměrná zem má 5,4 souseda |
| `public.w1`–`w10` | **válka se sousedem** `sN` (1 = válka). Dosluhující válka má 0, z exportu ji nepoznáš |
| `private` | smlouvy, jen pro vlastní země; pozorovatel `null` |

V knihovně `ctiSousedy()` vrací `Map(id země → [{ id, valka }])`.
