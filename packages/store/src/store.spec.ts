import { assert, describe, it } from 'vitest';
import { Slot, Store } from '../';
import { BlockMap } from '../../editor/src/block-loader';

function serialize(store: Store) {
  return store.doc.toJSON();
}

function waitSlot<T>(slot: Slot<T>, asserter: (val: T) => void) {
  return new Promise<void>(resolve => {
    slot.once(val => {
      asserter(val);
      resolve();
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

    await waitSlot(store.slots.addBlock, block => {
      assert.ok(block instanceof BlockMap.page);
    });
  });
});
