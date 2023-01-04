import { describe, expect, test } from 'vitest';
import { Workspace } from '../workspace/index.js';
import * as Y from 'yjs';

describe('sql', () => {
  test('export', async () => {
    const { default: initSqlJs } = await import('sql.js');
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    db.run(`
        CREATE TABLE IF NOT EXISTS Workspace
        (
            id INTEGER PRIMARY KEY,
            doc BLOB
        );
        
        CREATE TABLE IF NOT EXISTS BLOB
        (
            id TEXT PRIMARY KEY,
            binary BLOB
        );
    `);
    const workspace = new Workspace({});
    const binary = Y.encodeStateAsUpdateV2(workspace.doc);
    db.exec(`INSERT INTO WORKSPACE VALUES (null, $data);`, { $data: binary });
    const result = db.exec(`SELECT * FROM WORKSPACE where id = $idx;`, {
      $idx: 1,
    });
    const [_, data] = result[0].values[0];
    const workspace2 = new Workspace({});
    Y.applyUpdateV2(workspace2.doc, data as Uint8Array);
    const s1 = Y.snapshot(workspace.doc);
    const s2 = Y.snapshot(workspace2.doc);
    const same = Y.equalSnapshots(s1, s2);
    expect(same).toBe(true);
  });
});
