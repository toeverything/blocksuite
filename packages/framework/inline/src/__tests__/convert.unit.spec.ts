import { expect, test } from 'vitest';

import {
  deltaInsertsToChunks,
  transformDelta,
} from '../utils/delta-convert.js';

test('transformDelta', () => {
  expect(
    transformDelta({
      attributes: {
        bold: true,
      },
      insert: 'aaa',
    })
  ).toEqual([
    {
      attributes: {
        bold: true,
      },
      insert: 'aaa',
    },
  ]);

  expect(
    transformDelta({
      attributes: {
        bold: true,
      },
      insert: '\n\naaa\n\nbbb\n\n',
    })
  ).toEqual([
    '\n',
    '\n',
    {
      attributes: {
        bold: true,
      },
      insert: 'aaa',
    },
    '\n',
    '\n',
    {
      attributes: {
        bold: true,
      },
      insert: 'bbb',
    },
    '\n',
    '\n',
  ]);
});

test('deltaInsertsToChunks', () => {
  expect(
    deltaInsertsToChunks([
      {
        attributes: {
          bold: true,
        },
        insert: 'aaa',
      },
    ])
  ).toEqual([
    [
      {
        attributes: {
          bold: true,
        },
        insert: 'aaa',
      },
    ],
  ]);

  expect(
    deltaInsertsToChunks([
      {
        attributes: {
          bold: true,
        },
        insert: '\n\naaa\nbbb\n\n',
      },
    ])
  ).toEqual([
    [],
    [],
    [
      {
        attributes: {
          bold: true,
        },
        insert: 'aaa',
      },
    ],
    [
      {
        attributes: {
          bold: true,
        },
        insert: 'bbb',
      },
    ],
    [],
    [],
  ]);

  expect(
    deltaInsertsToChunks([
      {
        attributes: {
          bold: true,
        },
        insert: '\n\naaa\n',
      },
      {
        attributes: {
          italic: true,
        },
        insert: '\nbbb\n\n',
      },
    ])
  ).toEqual([
    [],
    [],
    [
      {
        attributes: {
          bold: true,
        },
        insert: 'aaa',
      },
    ],
    [],
    [
      {
        attributes: {
          italic: true,
        },
        insert: 'bbb',
      },
    ],
    [],
    [],
  ]);
});
