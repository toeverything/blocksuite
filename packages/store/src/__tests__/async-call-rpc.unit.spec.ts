import { EventEmitter } from 'node:events';

import type { EventBasedChannel } from 'async-call-rpc';
import { describe, expect, test, vi } from 'vitest';
import { Awareness } from 'y-protocols/awareness.js';
import { Doc } from 'yjs';

import { createAsyncCallRPCProviderCreator } from '../providers/async-call-rpc.js';
import type { PassiveDocProvider } from '../providers/type.js';

function delay(x: number) {
  return new Promise(r => setTimeout(r, x));
}

export class TestEventBasedChannel implements EventBasedChannel {
  channel = new EventEmitter();
  constructor(public otherSide: TestEventBasedChannel) {}
  on(callback) {
    this.channel.addListener('message', callback);
    return () => this.channel.removeListener('message', callback);
  }
  async send(data) {
    await delay(25);
    this.otherSide.channel.emit('message', data);
  }
}

describe('async-call-rpc provider', () => {
  test('basic', async () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const channel1 = new TestEventBasedChannel(undefined!);
    const channel2 = new TestEventBasedChannel(channel1);
    channel1.otherSide = channel2;
    const creator1 = createAsyncCallRPCProviderCreator('test1', channel1, {
      cleanup: vi.fn(),
    });
    const creator2 = createAsyncCallRPCProviderCreator('test2', channel2, {
      cleanup: vi.fn(),
    });

    // guid must be the same
    const guid = 'test';

    const doc1 = new Doc({
      guid,
    });

    const doc2 = new Doc({
      guid,
    });

    const awareness1 = new Awareness(doc1);
    const awareness2 = new Awareness(doc2);

    const provider1 = creator1(doc1.guid, doc1, {
      awareness: awareness1,
    }) as PassiveDocProvider;

    const provider2 = creator2(doc2.guid, doc2, {
      awareness: awareness2,
    }) as PassiveDocProvider;

    provider1.connect();
    provider2.connect();

    {
      const map = doc1.getMap('map');
      map.set('1', 2);
    }

    await delay(50);

    {
      const map = doc2.getMap('map');
      expect(map.get('1')).toBe(2);
      map.set('2', 3);
    }

    await delay(50);

    {
      const map = doc1.getMap('map');
      expect(map.get('2')).toBe(3);
    }

    {
      awareness1.setLocalState({
        hello: 'world',
      });
    }

    await delay(50);

    {
      expect(awareness2.getStates().get(doc1.clientID).hello).toBe('world');
    }
  });
});
