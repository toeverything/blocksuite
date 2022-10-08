// checkout https://vitest.dev/guide/debugging.html for debugging tests

import { describe, expect, it } from 'vitest';
import { Store } from '../store';
import { blockRecordToJSXNode } from './jsx';
import { BlockSchema } from '../../../editor/src/block-loader';

function serialize(store: Store) {
  return store.doc.toJSON();
}

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

  it('store match snapshot', () => {
    const store = new Store().register(BlockSchema);

    store.addBlock({ flavour: 'page', title: 'hello' });

    expect(blockRecordToJSXNode(serialize(store).blocks))
      .toMatchInlineSnapshot(`
      <page
        prop:title="hello"
      />
    `);
  });

  it('store with multiple blocks children match snapshot', () => {
    const store = new Store().register(BlockSchema);

    store.addBlock({ flavour: 'page' });
    store.addBlock({ flavour: 'paragraph' });
    store.addBlock({ flavour: 'paragraph' });

    expect(blockRecordToJSXNode(serialize(store).blocks))
      .toMatchInlineSnapshot(`
        <page>
          <paragraph
            prop:text=""
            prop:type="text"
          />
          <paragraph
            prop:text=""
            prop:type="text"
          />
        </page>
      `);
  });
});
