import { expect, test } from 'vitest';
import * as Y from 'yjs';

import { InlineEditor } from '../inline-editor.js';

test('getDeltaByRangeIndex', () => {
  const yDoc = new Y.Doc();
  const yText = yDoc.getText('text');
  yText.applyDelta([
    {
      attributes: {
        bold: true,
      },
      insert: 'aaa',
    },
    {
      attributes: {
        italic: true,
      },
      insert: 'bbb',
    },
  ]);
  const inlineEditor = new InlineEditor(yText);

  expect(inlineEditor.getDeltaByRangeIndex(0)).toEqual({
    attributes: {
      bold: true,
    },
    insert: 'aaa',
  });

  expect(inlineEditor.getDeltaByRangeIndex(1)).toEqual({
    attributes: {
      bold: true,
    },
    insert: 'aaa',
  });

  expect(inlineEditor.getDeltaByRangeIndex(3)).toEqual({
    attributes: {
      bold: true,
    },
    insert: 'aaa',
  });

  expect(inlineEditor.getDeltaByRangeIndex(4)).toEqual({
    attributes: {
      italic: true,
    },
    insert: 'bbb',
  });
});

test('getDeltasByInlineRange', () => {
  const yDoc = new Y.Doc();
  const yText = yDoc.getText('text');
  yText.applyDelta([
    {
      attributes: {
        bold: true,
      },
      insert: 'aaa',
    },
    {
      attributes: {
        italic: true,
      },
      insert: 'bbb',
    },
    {
      attributes: {
        underline: true,
      },
      insert: 'ccc',
    },
  ]);
  const inlineEditor = new InlineEditor(yText);

  expect(
    inlineEditor.getDeltasByInlineRange({
      index: 0,
      length: 0,
    })
  ).toEqual([
    [
      {
        attributes: {
          bold: true,
        },
        insert: 'aaa',
      },
      {
        index: 0,
        length: 3,
      },
    ],
  ]);

  expect(
    inlineEditor.getDeltasByInlineRange({
      index: 0,
      length: 1,
    })
  ).toEqual([
    [
      {
        attributes: {
          bold: true,
        },
        insert: 'aaa',
      },
      {
        index: 0,
        length: 3,
      },
    ],
  ]);

  expect(
    inlineEditor.getDeltasByInlineRange({
      index: 0,
      length: 3,
    })
  ).toEqual([
    [
      {
        attributes: {
          bold: true,
        },
        insert: 'aaa',
      },
      {
        index: 0,
        length: 3,
      },
    ],
  ]);

  expect(
    inlineEditor.getDeltasByInlineRange({
      index: 0,
      length: 4,
    })
  ).toEqual([
    [
      {
        attributes: {
          bold: true,
        },
        insert: 'aaa',
      },
      {
        index: 0,
        length: 3,
      },
    ],
    [
      {
        attributes: {
          italic: true,
        },
        insert: 'bbb',
      },
      {
        index: 3,
        length: 3,
      },
    ],
  ]);

  expect(
    inlineEditor.getDeltasByInlineRange({
      index: 3,
      length: 1,
    })
  ).toEqual([
    [
      {
        attributes: {
          bold: true,
        },
        insert: 'aaa',
      },
      {
        index: 0,
        length: 3,
      },
    ],
    [
      {
        attributes: {
          italic: true,
        },
        insert: 'bbb',
      },
      {
        index: 3,
        length: 3,
      },
    ],
  ]);

  expect(
    inlineEditor.getDeltasByInlineRange({
      index: 3,
      length: 3,
    })
  ).toEqual([
    [
      {
        attributes: {
          bold: true,
        },
        insert: 'aaa',
      },
      {
        index: 0,
        length: 3,
      },
    ],
    [
      {
        attributes: {
          italic: true,
        },
        insert: 'bbb',
      },
      {
        index: 3,
        length: 3,
      },
    ],
  ]);

  expect(
    inlineEditor.getDeltasByInlineRange({
      index: 3,
      length: 4,
    })
  ).toEqual([
    [
      {
        attributes: {
          bold: true,
        },
        insert: 'aaa',
      },
      {
        index: 0,
        length: 3,
      },
    ],
    [
      {
        attributes: {
          italic: true,
        },
        insert: 'bbb',
      },
      {
        index: 3,
        length: 3,
      },
    ],
    [
      {
        attributes: {
          underline: true,
        },
        insert: 'ccc',
      },
      {
        index: 6,
        length: 3,
      },
    ],
  ]);

  expect(
    inlineEditor.getDeltasByInlineRange({
      index: 4,
      length: 0,
    })
  ).toEqual([
    [
      {
        attributes: {
          italic: true,
        },
        insert: 'bbb',
      },
      {
        index: 3,
        length: 3,
      },
    ],
  ]);

  expect(
    inlineEditor.getDeltasByInlineRange({
      index: 4,
      length: 1,
    })
  ).toEqual([
    [
      {
        attributes: {
          italic: true,
        },
        insert: 'bbb',
      },
      {
        index: 3,
        length: 3,
      },
    ],
  ]);

  expect(
    inlineEditor.getDeltasByInlineRange({
      index: 4,
      length: 2,
    })
  ).toEqual([
    [
      {
        attributes: {
          italic: true,
        },
        insert: 'bbb',
      },
      {
        index: 3,
        length: 3,
      },
    ],
  ]);

  expect(
    inlineEditor.getDeltasByInlineRange({
      index: 4,
      length: 4,
    })
  ).toEqual([
    [
      {
        attributes: {
          italic: true,
        },
        insert: 'bbb',
      },
      {
        index: 3,
        length: 3,
      },
    ],
    [
      {
        attributes: {
          underline: true,
        },
        insert: 'ccc',
      },
      {
        index: 6,
        length: 3,
      },
    ],
  ]);
});

test('cursor with format', () => {
  const yDoc = new Y.Doc();
  const yText = yDoc.getText('text');
  const inlineEditor = new InlineEditor(yText);

  inlineEditor.insertText(
    {
      index: 0,
      length: 0,
    },
    'aaa',
    {
      bold: true,
    }
  );

  inlineEditor.setMarks({
    italic: true,
  });

  inlineEditor.insertText(
    {
      index: 3,
      length: 0,
    },
    'bbb'
  );

  expect(inlineEditor.yText.toDelta()).toEqual([
    {
      attributes: {
        bold: true,
      },
      insert: 'aaa',
    },
    {
      attributes: {
        italic: true,
      },
      insert: 'bbb',
    },
  ]);
});

test('incorrect format value `false`', () => {
  const yDoc = new Y.Doc();
  const yText = yDoc.getText('text');
  const inlineEditor = new InlineEditor(yText);

  inlineEditor.insertText(
    {
      index: 0,
      length: 0,
    },
    'aaa',
    {
      // @ts-expect-error insert incorrect value
      bold: false,
      italic: true,
    }
  );

  inlineEditor.insertText(
    {
      index: 3,
      length: 0,
    },
    'bbb',
    {
      underline: true,
    }
  );

  expect(inlineEditor.yText.toDelta()).toEqual([
    {
      attributes: {
        italic: true,
      },
      insert: 'aaa',
    },
    {
      attributes: {
        underline: true,
      },
      insert: 'bbb',
    },
  ]);
});

test('yText should not contain \r', () => {
  const yDoc = new Y.Doc();
  const yText = yDoc.getText('text');
  yText.insert(0, 'aaa\r');

  expect(yText.toString()).toEqual('aaa\r');
  expect(() => {
    new InlineEditor(yText);
  }).toThrow(
    'yText must not contain "\\r" because it will break the range synchronization'
  );
});
