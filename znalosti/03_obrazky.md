# 3. Obrázky zemí

Každá zem má na mapě obrázek domů (nebo pevnosti), ikonu síly vojska a případně věž. Export je posílá
jako názvy souborů. Legenda je na `prehled_ras_stavby.asp` a v nápovědě k mapě. V knihovně je luští
[`knihovna/obrazky.js`](../knihovna/obrazky.js).

## Domy a pevnost (`img_pevnost`)

Název `<id_rasy><písmeno><číslo>.gif`, třeba `3v5.gif` = Skuruti, pásmo domů 5.

| Obrázek | Domů v zemi |
|---|---|
| `v0` (bez čísla rasy) | neutrálka bez domů |
| `<rasa>v1` | méně než 50 |
| `<rasa>v2` | 50–99 |
| `<rasa>v3` | 100–149 |
| `<rasa>v4` | 150–199 |
| `<rasa>v5` | 200–249 |
| `<rasa>v6` | 250 a víc |
| `<rasa>p2` | dřevěné hradby, **domy nejsou vidět** |
| `<rasa>p3` | malá pevnost, domy nejsou vidět |
| `<rasa>p4` | střední pevnost, domy nejsou vidět |
| `<rasa>p5` | velká pevnost, domy nejsou vidět |

Ověření: 9. den 2A hlášení uvádí nejvíc domů 200 a ta zem má `3v5`, tedy 200–249.
Domy omezují velikost vojska (vojáci musí mít kde bydlet), takže pásmo domů je i strop armády v zemi.
Pod pevností zbývá jen poslední pásmo z doby před stavbou, pokud si ho někdo uložil.

### Koeficient pevnosti

| Pevnost | Útok ze země | Obrana země |
|---|---|---|
| bez pevnosti | 1,0 | 1,0 |
| dřevěné hradby | 1,0 | 1,1 |
| malá pevnost | 1,1 | 1,2 |
| střední pevnost | 1,25 | 1,5 |
| velká pevnost | 1,5 | 2,0 |

## Síla vojska (`img_power`)

Název `<s|v><0-7>.gif`. Písmeno: `s` = bez války, `v` = země má se sousední zemí válku.

| Číslo | Síla vojska v zemi (útok + obrana) |
|---|---|
| 0 | žádné vojsko |
| 1 | 1–99 |
| 2 | 100–199 |
| 3 | 200–399 |
| 4 | 400–599 |
| 5 | 600–799 |
| 6 | 800–999 |
| 7 | 1000 a víc |

Přesné číslo je v `land_power`, ikona je jen pásmo.

## Věž (`img_vez`)

Název `<id_rasy>m<číslo>.gif`, `m1` bez čísla rasy = žádná věž.

| Číslo | Stavba |
|---|---|
| 1 | nic |
| 2 | obřadní svatyně |
| 3 | malá magická věž |
| 4 | střední magická věž |
| 5 | velká magická věž |
| 6 | obranná magická věž |
| 7 | chrám |

## Krypty (jen na `map_new.asp`)

`images/crypts/c<typ>.gif`, titulek uvádí nebezpečnost (malá, velká, extrémní).
Přípona **`v`** (`c2v.gif`) = **vykradená** krypta.

## Rasy (`id_rasa` a číslo v obrázku)

| id | Rasa | id | Rasa |
|---|---|---|---|
| 0 | Lidé | 6 | Elfové |
| 1 | Barbaři | 7 | Temní Elfové |
| 2 | Skřeti | 8 | Trpaslíci |
| 3 | Skuruti | 9 | Hobiti |
| 4 | Nekromanti | 10 | Enti |
| 5 | Mágové | | |

## Vlajky

`vlajka` 971–975 mají **poslové** (boti hry). Aliance, ve které je posel, je aliance poslů.
Jméno nestačí, poslové mívají i jiná jména.
