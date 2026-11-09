# 5. Fronta

**Dobře postupující fronta = co nejméně vlastních zemí v kontaktu s druhou aliancí.**
Krátká, rovná linie se brání líp než rozervaná, kde soupeř sahá na hodně zemí najednou.
(Zkušenost hráčů ligy, Gorin 9. 11. 2026.)

## Data

Sousedy každé země a válku s každým sousedem má **smluvní export** (`smlouvy_export_json.asp`,
`s1`–`s10` a `public.w1`–`w10`), viz [pole mapy](02_pole_mapy.md). Pozorovatel ho dostane. Sousedství se
během věku nemění, stačí ho uložit jednou.

## Míry pro dvojici stran A a B (`fronta(mapa, sousede, a, b)`)

| Míra | Co znamená |
|---|---|
| **hraniční země A** (`hraniceA`) | země A, které sousedí aspoň s jednou zemí B. **Hlavní číslo, chceme co nejmenší.** |
| hraniční země B (`hraniceB`) | totéž z druhé strany |
| styky (`styky`) | počet dvojic sousedních zemí A–B, délka linie |
| ve válce (`veValce`) | kolik z těch dvojic má válku |
| podíl hranice (`podilHranice`) | hraniční země A / všechny země A, jak velká část území je vystavená |
| výběžky (`vybezky`) | země A seřazené podle počtu sousedů z B. Země s hodně nepřátelskými sousedy je nejslabší místo linie |

`fronty(mapa, sousede, a)` spočítá frontu A proti všem, se kterými sousedí, neutrálky jen na požádání.

## Jak to číst v čase

- **Hraniční země klesají** a soupeř ztrácí země: postup, linie se zkracuje.
- **Hraniční země klesají** a nikdo nic neztratil: vyrovnání linie (zabrání zálivů, výměna).
- **Hraniční země rostou:** průnik soupeře nebo vlastní výběžek do jeho území.
- **Výběžek** s mnoha nepřátelskými sousedy je kandidát na posílení, nebo na opuštění.

## Ukázka (2A, 9. den)

| Proti komu | Hraniční země A | Hraniční země B | Styky | Ve válce |
|---|---|---|---|---|
| Poslové 2018 | 37 | 28 | 70 | 44 |
| hráč Api (bez aliance) | 13 | 17 | 29 | 0 |
| hráč GhothicX | 11 | 11 | 19 | 0 |
| hráč Palin | 10 | 5 | 14 | 0 |
| neutrálky | 35 | 17 | 48 | 12 |

A = aliance Lamky 2A. Ověřeno ručním výpočtem a v [`testy/rozbor.test.js`](../testy/rozbor.test.js).
