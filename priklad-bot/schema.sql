-- Databáze ukázkového bota (Cloudflare D1 = SQLite).
-- Snímek = výstup ctiMapu() a ctiSousedy() jako JSON, dohromady asi 230 kB na den a ligu.
-- Free D1 má 5 GB, to na jednu ligu stačí na desítky let.
CREATE TABLE IF NOT EXISTS snimky (
  liga TEXT, vek INTEGER, den INTEGER, datum TEXT,
  mapa TEXT,                 -- JSON z ctiMapu()
  sousede TEXT,              -- JSON [[id, [{id, valka}]], ...] z ctiSousedy(); války se mění, proto denně
  nej TEXT,                  -- JSON z ctiNejUdalosti(), hra starší dny nevrací
  PRIMARY KEY (liga, vek, den)
);
