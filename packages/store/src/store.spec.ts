// checkout https://vitest.dev/guide/debugging.html for debugging tests

import { assert, describe, it } from 'vitest';
import { Slot, Store } from '../';
import { BlockMap } from '../../editor/src/block-loader';

function serialize(store: Store) {
  return store.doc.toJSON();
}

function waitSlot<T>(slot: Slot<T>, asserter?: (val: T) => void) {
  return new Promise<T>(resolve => {
    slot.once(val => {
      if (asserter) asserter(val);
      resolve(val);
    });
  });
}

describe.concurrent('basic', () => {
  it('can init store', () => {
    const store = new Store();

    assert.deepEqual(serialize(store), {
      blocks: {},
    });
  });
});

describe.concurrent('addBlock', () => {
  it('can add single model', () => {
    const store = new Store().register(BlockMap);

    store.addBlock({ flavour: 'page' });

    assert.deepEqual(serialize(store), {
      blocks: {
        '0': {
          'sys:children': [],
          'sys:flavour': 'page',
          'sys:id': '0',
        },
      },
    });
  });

  it('can add model with props', () => {
    const store = new Store().register(BlockMap);

    store.addBlock({ flavour: 'page', title: 'hello' });

    assert.deepEqual(serialize(store), {
      blocks: {
        '0': {
          'sys:children': [],
          'sys:flavour': 'page',
          'sys:id': '0',
          'prop:title': 'hello',
        },
      },
    });
  });

  it('can add multi models', () => {
    const store = new Store().register(BlockMap);
    store.addBlock({ flavour: 'page' });
    store.addBlock({ flavour: 'page' });

    assert.deepEqual(serialize(store), {
      blocks: {
        '0': {
          'sys:children': [],
          'sys:flavour': 'page',
          'sys:id': '0',
        },
        '1': {
          'sys:children': [],
          'sys:flavour': 'page',
          'sys:id': '1',
        },
      },
    });
  });

  it('can observe slot events', async () => {
    const store = new Store().register(BlockMap);

    queueMicrotask(() => store.addBlock({ flavour: 'page' }));
    await waitSlot(store.slots.blockAdded, block => {
      assert.ok(block instanceof BlockMap.page);
    });
  });

  it('can add block to root', async () => {
    const store = new Store().register(BlockMap);

    queueMicrotask(() => store.addBlock({ flavour: 'page' }));
    await waitSlot(store.slots.blockAdded, block => {
      assert.ok(block instanceof BlockMap.page);
      store.setRoot(block);
    });

    queueMicrotask(() => store.addBlock({ flavour: 'text' }));
    await waitSlot(store.slots.childrenUpdated, block => {
      assert.ok(block instanceof BlockMap.page);

      const serializedChildren = serialize(store).blocks['0']['sys:children'];
      assert.deepEqual(serializedChildren, ['1']);
      assert.equal(block.children[0].id, '1');
    });
  });
});

async function initWithRoot(store: Store) {
  queueMicrotask(() => store.addBlock({ flavour: 'page' }));
  const page = await waitSlot(store.slots.blockAdded);
  assert.ok(page instanceof BlockMap.page);
  store.setRoot(page);
  return page;
}

describe.concurrent('deleteBlock', () => {
  it('can delete single model', () => {
    const store = new Store().register(BlockMap);

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
    const store = new Store().register(BlockMap);
    const root = await initWithRoot(store);

    queueMicrotask(() => store.addBlock({ flavour: 'text' }));
    const child = await waitSlot(store.slots.blockAdded);

    // before delete
    assert.deepEqual(serialize(store).blocks, {
      '0': {
        'sys:children': ['1'],
        'sys:flavour': 'page',
        'sys:id': '0',
      },
      '1': {
        'sys:children': [],
        'sys:flavour': 'text',
        'sys:id': '1',
      },
    });

    store.deleteBlock(child);

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
