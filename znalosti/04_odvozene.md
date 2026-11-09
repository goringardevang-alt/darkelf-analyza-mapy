# 4. Co se dá odvodit

Většina zajímavých věcí na mapě přímo není. Vznikne až porovnáním dvou dnů nebo spojením několika polí.
Funkce jsou v [`knihovna/rozbor.js`](../knihovna/rozbor.js).

## Strany

Každá zem hraje za **alianci**, za **hráče bez aliance**, nebo je **neutrálka** (`strana()`).
Hráče bez aliance ber **každého zvlášť**, jinak by se v součtech slili do jedné falešné aliance,
která neexistuje.

## Změny vlastníků (`rozdil(vcera, dnes)`)

| Změna | Jak poznat | Pozor na |
|---|---|---|
| dobytí | zem měla včera hráče, dnes jiného | v jednom přepočtu může zem přejít přes víc rukou, vidíš jen konec |
| zabrání neutrálky | včera bez vlastníka, dnes hráč | |
| ztráta na neutrálku | včera hráč, dnes nikdo | skoro vždycky **odchod hráče** (odlog), ne útok |
| nový hráč | dnes má země, včera ne | |
| zmizelý hráč | včera měl země, dnes žádnou | odlog, nebo přišel o všechno |
| přechod mezi aliancemi | jiná `id_aliance` než včera | |

Neúspěšný útok mapa neukáže, nanejvýš jako pokles síly útočníka a obránce.

## Jak silný útok prošel

Útok dobyl zem, když byl silnější než její obrana. Obrana země:

```
obrana = floor( obrana_jednotek × (pevnost + cvičiště + štít + bonus_země) ) + obyvatelé + vozy + smlouvy
```

- `obrana_jednotek` je část včerejší `land_power` (ta je útok + obrana). Rozpočítat jde jen odhadem podle
  ras a jednotek, které hráč staví.
- `pevnost` je obranný koeficient z [obrázků](03_obrazky.md), `bonus_země` = `bonus_obrana / 100`.
  `koeficientObrany(zem)` vrací `pevnost + bonus_země`.
- `obyvatelé` jsou nejvýš počet domů, tedy horní mez pásma.
- Nevidíš cvičiště (+0,05), štít, hrdiny, obranné vozy ani vojenské smlouvy spojenců.
- Obránce mohl přes den verbovat (útok musel být větší), nebo vojsko odvést (stačil menší).

Bereme to jako **orientační** číslo a porovnáváme s nejsilnějším útokem dne z hlášení.

## Síla a domy stran (`souhrn()`)

- **Síla vojska** = součet `land_power`. Denní rozdíl ukáže verbování, ztráty v boji a přesuny.
  Je v ní útok i obrana dohromady.
- **Domy** = součet středů pásem (±25 na zem, v součtu se chyby z velké části vyruší).
  Země s pevností počítej zvlášť, domy u nich neznáš.

## Hrdinové (`rozdilHrdinu()`)

Na `map_new.asp` je u hrdiny div `h<id země>` s odkazem `hero.asp?h=<id hrdiny>` a titulkem
`Jméno (celková zkušenost)`. Porovnáním dnů vidíš přesuny, nové hrdiny, zmizelé (smrt, odchod hráče)
a růst zkušenosti, tedy kdo s hrdinou bojuje nebo vybírá krypty.

Komu hrdina patří, mapa neřekne. Ukáže to `hero.asp`: ve službách koho, ve které zemi, stav
(třeba „Brání zemi"), zkušenost, životy, útok a obranu a levely. Stahuj ho jen u nových hrdinů,
majitel se mění zřídka.

## Nej-události dne

Pozorovatel v `hlaseni.asp` vidí jen blok **„Nej-události v tomto dni"**: nejsilnější kouzlo (kdo, síla),
nejsilnější útok (kdo, síla), vládce země s nejvíc domy (kolik), zem s nejvíc stavbami (kolik).
Starší dny se načíst nedají, **ukládej si je každý den**, jinak zmizí.

## Další odvozené

| Co | Jak |
|---|---|
| odchod hráče (odlog) | hráč zmizel a jeho země jsou dnes neutrálky |
| aliance poslů | aspoň jeden člen s vlajkou 971–975 |
| velitel aliance | `id_velitele` |
| kdo má rezervu na verbování | síla vojska je malá proti domům (strop armády) |
| magické zázemí | věž `m3`+ a podobná síla napříč zeměmi hráče; jen odhad |
