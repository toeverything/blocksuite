import type { Awareness } from 'y-protocols/awareness';
import {
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
} from 'y-protocols/awareness';

import type { AwarenessSource } from '../source.js';

type AwarenessChanges = Record<'added' | 'updated' | 'removed', number[]>;

type ChannelMessage =
  | { type: 'connect' }
  | { type: 'update'; update: Uint8Array };

export class BroadcastChannelAwarenessSource implements AwarenessSource {
  awareness: Awareness | null = null;

  channel: BroadcastChannel | null = null;

  handleAwarenessUpdate = (changes: AwarenessChanges, origin: unknown) => {
    if (origin === 'remote') {
      return;
    }

    const changedClients = Object.values(changes).reduce((res, cur) =>
      res.concat(cur)
    );

    const update = encodeAwarenessUpdate(this.awareness!, changedClients);
    this.channel?.postMessage({
      type: 'update',
      update: update,
    } satisfies ChannelMessage);
  };

  constructor(readonly channelName: string) {}

  connect(awareness: Awareness): void {
    this.channel = new BroadcastChannel(this.channelName);
    this.channel.postMessage({
      type: 'connect',
    } satisfies ChannelMessage);
    this.awareness = awareness;
    awareness.on('update', this.handleAwarenessUpdate);
    this.channel.addEventListener(
      'message',
      (event: MessageEvent<ChannelMessage>) => {
        this.handleChannelMessage(event);
      }
    );
  }

  disconnect(): void {
    this.awareness?.off('update', this.handleAwarenessUpdate);
    this.channel?.close();
    this.channel = null;
  }

  handleChannelMessage(event: MessageEvent<ChannelMessage>) {
    if (event.data.type === 'update') {
      const update = event.data.update;
      applyAwarenessUpdate(this.awareness!, update, 'remote');
    }
    if (event.data.type === 'connect') {
      this.channel?.postMessage({
        type: 'update',
        update: encodeAwarenessUpdate(this.awareness!, [
          this.awareness!.clientID,
        ]),
      } satisfies ChannelMessage);
    }
  }
}
