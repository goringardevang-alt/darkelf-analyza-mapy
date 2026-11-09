// Náhrada Cloudflare D1 nad vestavěným SQLite v Node (stejné SQL, stejné rozhraní). Node 22.5+.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

export function d1(schema) {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(schema, 'utf8'));
  const prepare = (sql) => {
    let p = [];
    const st = {
      bind: (...a) => { p = a; return st; },
      all: async () => ({ results: db.prepare(sql).all(...p).map((r) => ({ ...r })) }),
      first: async () => { const r = db.prepare(sql).get(...p); return r ? { ...r } : null; },
      run: async () => { const r = db.prepare(sql).run(...p); return { meta: { last_row_id: Number(r.lastInsertRowid), changes: r.changes } }; },
    };
    return st;
  };
  return { prepare, exec: (s) => db.exec(s) };
}
