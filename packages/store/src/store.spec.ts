// checkout https://vitest.dev/guide/debugging.html for debugging tests

import { assert, describe, expect, it } from 'vitest';
import { BaseBlockModel, Signal, Store } from '../';

// Use manual per-module import/export to support vitest environment on Node.js
import { PageBlockModel } from '../../blocks/src/page-block/page-model';
import { ParagraphBlockModel } from '../../blocks/src/paragraph-block/paragraph-model';
import { ListBlockModel } from '../../blocks/src/list-block/list-model';
import { GroupBlockModel } from '../../blocks/src/group-block/group-model';

const options = {
  room: '',
  useDebugProvider: false,
};

// Create BlockSchema manually
export const BlockSchema = {
  paragraph: ParagraphBlockModel,
  page: PageBlockModel,
  list: ListBlockModel,
  group: GroupBlockModel,
} as const;

function serialize(store: Store) {
  return store.doc.toJSON();
}

function waitOnce<T>(signal: Signal<T>) {
  return new Promise<T>(resolve => signal.once(val => resolve(val)));
}

describe.concurrent('basic', () => {
  it('can init store', () => {
    const store = new Store(options);

    assert.deepEqual(serialize(store), {
      blocks: {},
    });
  });
});

describe.concurrent('addBlock', () => {
  it('can add single model', () => {
    const store = new Store(options).register(BlockSchema);

    store.addBlock({ flavour: 'page' });

    assert.deepEqual(serialize(store).blocks, {
      '0': {
        'sys:children': [],
        'sys:flavour': 'page',
        'sys:id': '0',
      },
    });
  });

  it('can add model with props', () => {
    const store = new Store(options).register(BlockSchema);

    store.addBlock({ flavour: 'page', title: 'hello' });

    assert.deepEqual(serialize(store).blocks, {
      '0': {
        'sys:children': [],
        'sys:flavour': 'page',
        'sys:id': '0',
        'prop:title': 'hello',
      },
    });
  });

  it('can add multi models', () => {
    const store = new Store(options).register(BlockSchema);
    store.addBlock({ flavour: 'page' });
    store.addBlock({ flavour: 'paragraph' });

    assert.deepEqual(serialize(store).blocks, {
      '0': {
        'sys:children': ['1'],
        'sys:flavour': 'page',
        'sys:id': '0',
      },
      '1': {
        'sys:children': [],
        'sys:flavour': 'paragraph',
        'sys:id': '1',
        'prop:text': '',
        'prop:type': 'text',
      },
    });
  });

  it('can observe signal events', async () => {
    const store = new Store(options).register(BlockSchema);

    queueMicrotask(() => store.addBlock({ flavour: 'page' }));
    const block = await waitOnce(store.signals.rootAdded);
    assert.ok(block instanceof BlockSchema.page);
  });

  it('can add block to root', async () => {
    const store = new Store(options).register(BlockSchema);

    queueMicrotask(() => store.addBlock({ flavour: 'page' }));
    const root = await waitOnce(store.signals.rootAdded);
    assert.ok(root instanceof BlockSchema.page);

    store.addBlock({ flavour: 'paragraph' });
    assert.ok(root.children[0] instanceof BlockSchema.paragraph);
    assert.equal(root.childMap.get('1'), 0);

    const serializedChildren = serialize(store).blocks['0']['sys:children'];
    assert.deepEqual(serializedChildren, ['1']);
    assert.equal(root.children[0].id, '1');
  });
});

async function initWithRoot(store: Store) {
  queueMicrotask(() => store.addBlock({ flavour: 'page' }));
  const root = await waitOnce(store.signals.rootAdded);
  return root;
}

describe.concurrent('deleteBlock', () => {
  it('can delete single model', () => {
    const store = new Store(options).register(BlockSchema);

    store.addBlock({ flavour: 'page' });
    assert.deepEqual(serialize(store).blocks, {
      '0': {
        'sys:children': [],
        'sys:flavour': 'page',
        'sys:id': '0',
      },
    });

    store.deleteBlockById('0');
    assert.deepEqual(serialize(store).blocks, {});
  });

  it('can delete model with parent', async () => {
    const store = new Store(options).register(BlockSchema);
    const root = await initWithRoot(store);

    store.addBlock({ flavour: 'paragraph' });

    // before delete
    assert.deepEqual(serialize(store).blocks, {
      '0': {
        'sys:children': ['1'],
        'sys:flavour': 'page',
        'sys:id': '0',
      },
      '1': {
        'sys:children': [],
        'sys:flavour': 'paragraph',
        'sys:id': '1',
        'prop:text': '',
        'prop:type': 'text',
      },
    });

    store.deleteBlock(root.children[0]);

    // after delete
    assert.deepEqual(serialize(store).blocks, {
      '0': {
        'sys:children': [],
        'sys:flavour': 'page',
        'sys:id': '0',
      },
    });
    assert.equal(root.children.length, 0);
  });
});

describe.concurrent('getBlock', () => {
  it('can get block by id', async () => {
    const store = new Store(options).register(BlockSchema);
    const root = await initWithRoot(store);

    store.addBlock({ flavour: 'paragraph' });
    store.addBlock({ flavour: 'paragraph' });

    const text = store.getBlockById('2') as BaseBlockModel;
    assert.ok(text instanceof BlockSchema.paragraph);
    assert.equal(root.children.indexOf(text), 1);

    const invalid = store.getBlockById('😅');
    assert.equal(invalid, null);
  });

  it('can get parent', async () => {
    const store = new Store(options).register(BlockSchema);
    const root = await initWithRoot(store);

    store.addBlock({ flavour: 'paragraph' });
    store.addBlock({ flavour: 'paragraph' });

    const result = store.getParent(root.children[1]) as BaseBlockModel;
    assert.equal(result, root);

    const invalid = store.getParentById(root.id, root);
    assert.equal(invalid, null);
  });

  it('can get previous sibling', async () => {
    const store = new Store(options).register(BlockSchema);
    const root = await initWithRoot(store);

    store.addBlock({ flavour: 'paragraph' });
    store.addBlock({ flavour: 'paragraph' });

    const result = store.getPreviousSibling(root.children[1]) as BaseBlockModel;
    assert.equal(result, root.children[0]);

    const invalid = store.getPreviousSibling(root.children[0]);
    assert.equal(invalid, null);
  });
});

describe('store.toJSXElement works', async () => {
  it('store match snapshot', () => {
    const store = new Store(options).register(BlockSchema);

    store.addBlock({ flavour: 'page', title: 'hello' });

    expect(store.toJSXElement()).toMatchInlineSnapshot(`
      <page
        prop:title="hello"
      />
    `);
  });

  it('empty store match snapshot', () => {
    const store = new Store(options).register(BlockSchema);
    expect(store.toJSXElement()).toMatchInlineSnapshot('null');
  });

  it('store with multiple blocks children match snapshot', () => {
    const store = new Store(options).register(BlockSchema);

    store.addBlock({ flavour: 'page' });
    store.addBlock({ flavour: 'paragraph' });
    store.addBlock({ flavour: 'paragraph' });

    expect(store.toJSXElement()).toMatchInlineSnapshot(`
      <page>
        <paragraph
          prop:type="text"
        />
        <paragraph
          prop:type="text"
        />
      </page>
    `);
  });
});
