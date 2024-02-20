import { assertExists } from '@blocksuite/global/utils';
import { diffUpdate, encodeStateVectorFromUpdate, mergeUpdates } from 'yjs';

import type { DocSource } from '../source.js';

type ChannelMessage =
  | {
      type: 'init';
    }
  | {
      type: 'update';
      docId: string;
      data: Uint8Array;
    };

export class BroadcastChannelDocSource implements DocSource {
  name = 'broadcast-channel';

  channel = new BroadcastChannel(this.channelName);
  docMap = new Map<string, Uint8Array>();

  constructor(readonly channelName: string = 'blocksuite:doc') {
    this.channel.addEventListener('message', this._onMessage);

    this.channel.postMessage({
      type: 'init',
    });
  }

  pull(docId: string, state: Uint8Array) {
    const update = this.docMap.get(docId);
    if (!update) return null;

    const diff = state.length ? diffUpdate(update, state) : update;
    return { data: diff, state: encodeStateVectorFromUpdate(update) };
  }

  push(docId: string, data: Uint8Array) {
    const update = this.docMap.get(docId);
    if (update) {
      this.docMap.set(docId, mergeUpdates([update, data]));
    } else {
      this.docMap.set(docId, data);
    }

    assertExists(this.docMap.get(docId));
    this.channel.postMessage({
      type: 'update',
      docId,
      data: this.docMap.get(docId)!,
    } satisfies ChannelMessage);
  }

  subscribe(cb: (docId: string, data: Uint8Array) => void) {
    const abortController = new AbortController();
    this.channel.addEventListener(
      'message',
      (event: MessageEvent<ChannelMessage>) => {
        if (event.data.type !== 'update') return;
        const { docId, data } = event.data;
        cb(docId, data);
      },
      { signal: abortController.signal }
    );
    return () => {
      abortController.abort();
    };
  }

  private _onMessage = (event: MessageEvent<ChannelMessage>) => {
    if (event.data.type === 'init') {
      for (const [docId, data] of this.docMap) {
        this.channel.postMessage({
          type: 'update',
          docId,
          data,
        } satisfies ChannelMessage);
      }
      return;
    }

    const { docId, data } = event.data;
    const update = this.docMap.get(docId);
    if (update) {
      this.docMap.set(docId, mergeUpdates([update, data]));
    } else {
      this.docMap.set(docId, data);
    }
  };
}
