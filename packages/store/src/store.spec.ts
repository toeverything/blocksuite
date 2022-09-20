import { assert, describe, it } from 'vitest';
import { Store } from '../';

function serialize(store: Store) {
  return store.doc.toJSON();
}

describe.concurrent('basic', () => {
  it('init store', () => {
    const store = new Store();

    assert.deepEqual(serialize(store), {
      blocks: {},
    });
  });
});

describe.concurrent('addBlock', () => {
  it('can add single model', () => {
    const store = new Store();
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
    const store = new Store();
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
    const store = new Store();
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
});
