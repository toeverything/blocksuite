// checkout https://vitest.dev/guide/debugging.html for debugging tests

import { describe, expect, it } from 'vitest';
import { blockRecordToJSXNode } from './jsx';

describe('basic', () => {
  it('doc record match snapshot', () => {
    expect(
      blockRecordToJSXNode({
        '0': {
          'sys:id': '0',
          'sys:children': ['1'],
          'sys:flavour': 'page',
        },
        '1': {
          'sys:id': '1',
          'sys:children': [],
          'sys:flavour': 'paragraph',
          'prop:text': '',
          'prop:type': 'text',
        },
      })
    ).toMatchInlineSnapshot(`
      <page>
        <paragraph
          prop:text=""
          prop:type="text"
        />
      </page>
    `);
  });
});
