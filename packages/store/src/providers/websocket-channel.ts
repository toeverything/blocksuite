import type { EventBasedChannel } from 'async-call-rpc';

import { createAsyncCallRPCProviderCreator } from './async-call-rpc.js';
import type { DocProviderCreator } from './type.js';

export const createWebsocketChannelProvider: DocProviderCreator = (...args) => {
  class WebsocketMessageChannel implements EventBasedChannel {
    static url = 'ws://localhost:8080';

    private _ws!: WebSocket;
    private _room: string;

    constructor(room: string) {
      this._room = room;
      this.initWs();
    }

    private initWs() {
      this._ws = new WebSocket(WebsocketMessageChannel.url);
      this._ws.addEventListener(
        'open',
        () => {
          this._ws.send(
            JSON.stringify({
              type: 'join',
              room: this._room,
            })
          );
        },
        { once: true }
      );
    }

    on(listener: (data: unknown) => void): void | (() => void) {
      const f = (e: MessageEvent): void => listener(e.data);
      this._ws.addEventListener('message', f);
    }

    send(data: unknown): void {
      this._ws.send(data as ArrayBufferLike);
    }

    close() {
      this._ws.close();
    }
  }

  const id = args[0];
  const channel = new WebsocketMessageChannel(id);

  return createAsyncCallRPCProviderCreator('websocket-channel', channel, {
    cleanup() {
      channel.close();
    },
  })(...args);
};
