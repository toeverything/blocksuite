import { expect, test } from 'vitest';
import * as Y from 'yjs';

import { VEditor } from '../virgo.js';

test('getDeltaByRangeIndex', () => {
  const yDoc = new Y.Doc();
  const yText = yDoc.getText('text');
  yText.applyDelta([
    {
      insert: 'aaa',
      attributes: {
        bold: true,
      },
    },
    {
      insert: 'bbb',
      attributes: {
        italic: true,
      },
    },
  ]);
  const virgo = new VEditor(yText);

  expect(virgo.getDeltaByRangeIndex(0)).toEqual({
    insert: 'aaa',
    attributes: {
      bold: true,
    },
  });

  expect(virgo.getDeltaByRangeIndex(1)).toEqual({
    insert: 'aaa',
    attributes: {
      bold: true,
    },
  });

  expect(virgo.getDeltaByRangeIndex(3)).toEqual({
    insert: 'aaa',
    attributes: {
      bold: true,
    },
  });

  expect(virgo.getDeltaByRangeIndex(4)).toEqual({
    insert: 'bbb',
    attributes: {
      italic: true,
    },
  });
});

test('getDeltasByVRange', () => {
  const yDoc = new Y.Doc();
  const yText = yDoc.getText('text');
  yText.applyDelta([
    {
      insert: 'aaa',
      attributes: {
        bold: true,
      },
    },
    {
      insert: 'bbb',
      attributes: {
        italic: true,
      },
    },
    {
      insert: 'ccc',
      attributes: {
        underline: true,
      },
    },
  ]);
  const virgo = new VEditor(yText);

  expect(
    virgo.getDeltasByVRange({
      index: 0,
      length: 0,
    })
  ).toEqual([]);

  expect(
    virgo.getDeltasByVRange({
      index: 0,
      length: 1,
    })
  ).toEqual([
    [
      {
        insert: 'aaa',
        attributes: {
          bold: true,
        },
      },
      {
        index: 0,
        length: 3,
      },
    ],
  ]);

  expect(
    virgo.getDeltasByVRange({
      index: 0,
      length: 3,
    })
  ).toEqual([
    [
      {
        insert: 'aaa',
        attributes: {
          bold: true,
        },
      },
      {
        index: 0,
        length: 3,
      },
    ],
  ]);

  expect(
    virgo.getDeltasByVRange({
      index: 0,
      length: 4,
    })
  ).toEqual([
    [
      {
        insert: 'aaa',
        attributes: {
          bold: true,
        },
      },
      {
        index: 0,
        length: 3,
      },
    ],
    [
      {
        insert: 'bbb',
        attributes: {
          italic: true,
        },
      },
      {
        index: 3,
        length: 3,
      },
    ],
  ]);

  expect(
    virgo.getDeltasByVRange({
      index: 3,
      length: 0,
    })
  ).toEqual([]);

  expect(
    virgo.getDeltasByVRange({
      index: 3,
      length: 1,
    })
  ).toEqual([
    [
      {
        insert: 'bbb',
        attributes: {
          italic: true,
        },
      },
      {
        index: 3,
        length: 3,
      },
    ],
  ]);

  expect(
    virgo.getDeltasByVRange({
      index: 3,
      length: 3,
    })
  ).toEqual([
    [
      {
        insert: 'bbb',
        attributes: {
          italic: true,
        },
      },
      {
        index: 3,
        length: 3,
      },
    ],
  ]);

  expect(
    virgo.getDeltasByVRange({
      index: 3,
      length: 4,
    })
  ).toEqual([
    [
      {
        insert: 'bbb',
        attributes: {
          italic: true,
        },
      },
      {
        index: 3,
        length: 3,
      },
    ],
    [
      {
        insert: 'ccc',
        attributes: {
          underline: true,
        },
      },
      {
        index: 6,
        length: 3,
      },
    ],
  ]);
});
