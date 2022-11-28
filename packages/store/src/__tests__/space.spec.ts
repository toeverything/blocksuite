// checkout https://vitest.dev/guide/debugging.html for debugging tests

import { assert, describe, expect, it } from 'vitest';
import { BaseBlockModel, Signal, Store, Space, createAutoIncrement } from '..';

// Use manual per-module import/export to support vitest environment on Node.js
import { PageBlockModel } from '../../../blocks/src/page-block/page-model';
import { ParagraphBlockModel } from '../../../blocks/src/paragraph-block/paragraph-model';
import { ListBlockModel } from '../../../blocks/src/list-block/list-model';
import { GroupBlockModel } from '../../../blocks/src/group-block/group-model';

const getStoreOptions = () => ({
  room: '',
  idGenerator: createAutoIncrement(),
});

// Create BlockSchema manually
export const BlockSchema = {
  'affine:paragraph': ParagraphBlockModel,
  'affine:page': PageBlockModel,
  'affine:list': ListBlockModel,
  'affine:group': GroupBlockModel,
} as const;

function serialize(space: Space) {
  return space.doc.toJSON();
}

function waitOnce<T>(signal: Signal<T>) {
  return new Promise<T>(resolve => signal.once(val => resolve(val)));
}

const defaultSpaceId = 'space:page0';

describe.concurrent('basic', () => {
  it('can init store', () => {
    const store = new Store(getStoreOptions());

    assert.deepEqual(serialize(store.createSpace(defaultSpaceId)), {
      [defaultSpaceId]: {},
    });
  });
});

describe.concurrent('addBlock', () => {
  it('can add single model', () => {
    const space = new Store(getStoreOptions())
      .createSpace(defaultSpaceId)
      .register(BlockSchema);

    space.addBlock({ flavour: 'affine:page' });

    assert.deepEqual(serialize(space)[defaultSpaceId], {
      '0': {
        'sys:children': [],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
      },
    });
  });

  it('use custom idGenerator', () => {
    const options = {
      ...getStoreOptions(),
      idGenerator: (() => {
        const keys = ['7', '100', '2'];
        let i = 0;
        return () => keys[i++];
      })(),
    };
    const space = new Store(options)
      .createSpace(defaultSpaceId)
      .register(BlockSchema);

    space.addBlock({ flavour: 'affine:page' });
    space.addBlock({ flavour: 'affine:paragraph' });
    space.addBlock({ flavour: 'affine:paragraph' });

    assert.deepEqual(serialize(space)[defaultSpaceId], {
      '7': {
        'sys:children': ['100', '2'],
        'sys:flavour': 'affine:page',
        'sys:id': '7',
      },
      '100': {
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '100',
        'prop:text': '',
        'prop:type': 'text',
      },
      '2': {
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '2',
        'prop:text': '',
        'prop:type': 'text',
      },
    });
  });

  it('can add model with props', () => {
    const space = new Store(getStoreOptions())
      .createSpace(defaultSpaceId)
      .register(BlockSchema);

    space.addBlock({ flavour: 'affine:page', title: 'hello' });

    assert.deepEqual(serialize(space)[defaultSpaceId], {
      '0': {
        'sys:children': [],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
        'prop:title': 'hello',
      },
    });
  });

  it('can add multi models', () => {
    const space = new Store(getStoreOptions())
      .createSpace(defaultSpaceId)
      .register(BlockSchema);
    space.addBlock({ flavour: 'affine:page' });
    space.addBlock({ flavour: 'affine:paragraph' });

    assert.deepEqual(serialize(space)[defaultSpaceId], {
      '0': {
        'sys:children': ['1'],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
      },
      '1': {
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '1',
        'prop:text': '',
        'prop:type': 'text',
      },
    });
  });

  it('can observe signal events', async () => {
    const space = new Store(getStoreOptions())
      .createSpace(defaultSpaceId)
      .register(BlockSchema);

    queueMicrotask(() => space.addBlock({ flavour: 'affine:page' }));
    const block = await waitOnce(space.signals.rootAdded);
    assert.ok(block instanceof BlockSchema['affine:page']);
  });

  it('can add block to root', async () => {
    const space = new Store(getStoreOptions())
      .createSpace(defaultSpaceId)
      .register(BlockSchema);

    queueMicrotask(() => space.addBlock({ flavour: 'affine:page' }));
    const root = await waitOnce(space.signals.rootAdded);
    assert.ok(root instanceof BlockSchema['affine:page']);

    space.addBlock({ flavour: 'affine:paragraph' });
    assert.ok(root.children[0] instanceof BlockSchema['affine:paragraph']);
    assert.equal(root.childMap.get('1'), 0);

    const serializedChildren =
      serialize(space)[defaultSpaceId]['0']['sys:children'];
    assert.deepEqual(serializedChildren, ['1']);
    assert.equal(root.children[0].id, '1');
  });
});

async function initWithRoot(space: Space) {
  queueMicrotask(() => space.addBlock({ flavour: 'affine:page' }));
  const root = await waitOnce(space.signals.rootAdded);
  return root;
}

describe.concurrent('deleteBlock', () => {
  it('can delete single model', () => {
    const space = new Store(getStoreOptions())
      .createSpace(defaultSpaceId)
      .register(BlockSchema);

    space.addBlock({ flavour: 'affine:page' });
    assert.deepEqual(serialize(space)[defaultSpaceId], {
      '0': {
        'sys:children': [],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
      },
    });

    space.deleteBlockById('0');
    assert.deepEqual(serialize(space)[defaultSpaceId], {});
  });

  it('can delete model with parent', async () => {
    const space = new Store(getStoreOptions())
      .createSpace(defaultSpaceId)
      .register(BlockSchema);
    const root = await initWithRoot(space);

    space.addBlock({ flavour: 'affine:paragraph' });

    // before delete
    assert.deepEqual(serialize(space)[defaultSpaceId], {
      '0': {
        'sys:children': ['1'],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
      },
      '1': {
        'sys:children': [],
        'sys:flavour': 'affine:paragraph',
        'sys:id': '1',
        'prop:text': '',
        'prop:type': 'text',
      },
    });

    space.deleteBlock(root.children[0]);

    // after delete
    assert.deepEqual(serialize(space)[defaultSpaceId], {
      '0': {
        'sys:children': [],
        'sys:flavour': 'affine:page',
        'sys:id': '0',
      },
    });
    assert.equal(root.children.length, 0);
  });
});

describe.concurrent('getBlock', () => {
  it('can get block by id', async () => {
    const space = new Store(getStoreOptions())
      .createSpace(defaultSpaceId)
      .register(BlockSchema);
    const root = await initWithRoot(space);

    space.addBlock({ flavour: 'affine:paragraph' });
    space.addBlock({ flavour: 'affine:paragraph' });

    const text = space.getBlockById('2') as BaseBlockModel;
    assert.ok(text instanceof BlockSchema['affine:paragraph']);
    assert.equal(root.children.indexOf(text), 1);

    const invalid = space.getBlockById('😅');
    assert.equal(invalid, null);
  });

  it('can get parent', async () => {
    const space = new Store(getStoreOptions())
      .createSpace(defaultSpaceId)
      .register(BlockSchema);
    const root = await initWithRoot(space);

    space.addBlock({ flavour: 'affine:paragraph' });
    space.addBlock({ flavour: 'affine:paragraph' });

    const result = space.getParent(root.children[1]) as BaseBlockModel;
    assert.equal(result, root);

    const invalid = space.getParentById(root.id, root);
    assert.equal(invalid, null);
  });

  it('can get previous sibling', async () => {
    const space = new Store(getStoreOptions())
      .createSpace(defaultSpaceId)
      .register(BlockSchema);
    const root = await initWithRoot(space);

    space.addBlock({ flavour: 'affine:paragraph' });
    space.addBlock({ flavour: 'affine:paragraph' });

    const result = space.getPreviousSibling(root.children[1]) as BaseBlockModel;
    assert.equal(result, root.children[0]);

    const invalid = space.getPreviousSibling(root.children[0]);
    assert.equal(invalid, null);
  });
});

describe('store.toJSXElement works', async () => {
  it('store match snapshot', () => {
    const store = new Store(getStoreOptions());
    const space = store.createSpace(defaultSpaceId).register(BlockSchema);

    space.addBlock({ flavour: 'affine:page', title: 'hello' });

    expect(store.toJSXElement()).toMatchInlineSnapshot(`
      <affine:page
        prop:title="hello"
      />
    `);
  });

  it('empty store match snapshot', () => {
    const store = new Store(getStoreOptions());
    store.createSpace(defaultSpaceId).register(BlockSchema);

    expect(store.toJSXElement()).toMatchInlineSnapshot('null');
  });

  it('store with multiple blocks children match snapshot', () => {
    const store = new Store(getStoreOptions());
    const space = store.createSpace(defaultSpaceId).register(BlockSchema);

    space.addBlock({ flavour: 'affine:page' });
    space.addBlock({ flavour: 'affine:paragraph' });
    space.addBlock({ flavour: 'affine:paragraph' });

    expect(store.toJSXElement()).toMatchInlineSnapshot(/* xml */ `
      <affine:page>
        <affine:paragraph
          prop:type="text"
        />
        <affine:paragraph
          prop:type="text"
        />
      </affine:page>
    `);
  });
});
