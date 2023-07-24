import type { PassiveDocProvider, Workspace } from '@blocksuite/store';
import type { EventBasedChannel } from 'async-call-rpc';
import { isPlainObject } from 'merge';

import { notify } from '../utils/notify.js';
import { createAsyncCallRPCProviderCreator } from './async-call-rpc.js';
import type { DocProviderCreator } from './type.js';

export function generateRoomId(): Promise<string> {
  return fetch('https://collaboration-room.douding.workers.dev/room/', {
    method: 'post',
  })
    .then(res => res.json())
    .then(({ id }) => id);
}

export function createCollaborationSocket(room?: string) {
  room = room ?? new URLSearchParams(location.search).get('room') ?? '';

  if (!room) {
    console.warn('Invalid collaboration room');
    return;
  }

  const ws = new WebSocket(
    `wss://collaboration-room.douding.workers.dev/room/${room}`
  );

  return ws;
}

export async function initCollaborationSocket(
  workspace: Workspace,
  room: string
) {
  const ws = createCollaborationSocket(room);

  if (!ws) {
    return false;
  }

  const connected = await new Promise<boolean>(res => {
    const resetWs = () => {
      ws.removeEventListener('open', resetWs);
      ws.removeEventListener('error', resetWs);
      res(ws.readyState === WebSocket.OPEN);
    };

    ws.addEventListener('open', resetWs);
    ws.addEventListener('error', resetWs);
  });

  if (connected) {
    const provider = workspace.registerProvider(
      createWebsocketCreator(ws),
      room
    ) as PassiveDocProvider;
    provider.connect();

    const removeProvider = () => {
      provider.disconnect();
      const idx = workspace.providers.findIndex(p => p === provider);

      workspace.providers.splice(idx, 1);

      ws.addEventListener('error', removeProvider);
      ws.addEventListener('close', removeProvider);
    };

    ws.addEventListener('close', removeProvider);
    ws.addEventListener('error', removeProvider);

    notify('Collaboration socket has connected', 'success');
    return true;
  } else {
    notify('Collaboration socket connection failed', 'warning');
  }

  return false;
}

export class WebsocketMessageChannel implements EventBasedChannel {
  static url = 'ws://localhost:8787';

  private _ws!: WebSocket;
  private _blockedData: unknown[] = [];

  constructor(ws: WebSocket) {
    this._ws = ws;
    this._setupListeners();
  }

  private _setupListeners() {
    if (this._ws.readyState !== WebSocket.OPEN) {
      this._ws.addEventListener(
        'open',
        () => {
          this._blockedData.forEach(data => {
            this._send(data);
            this._blockedData = [];
          });
        },
        { once: true }
      );
    }
  }

  private _send(data: unknown) {
    data = this.normalize(data);
    this._ws.send(JSON.stringify(this.normalize(data)));
  }

  on(listener: (data: unknown) => void): void | (() => void) {
    const f = (e: MessageEvent): void => {
      const parsedData = this.deserialize(e.data);
      listener(parsedData);
    };
    this._ws.addEventListener('message', f);
  }

  deserialize(data: string) {
    const parsedData = JSON.parse(data as string);

    if (parsedData.result) {
      parsedData.result = new Uint8Array(parsedData.result);
    }

    switch (parsedData.method) {
      case 'sendDocUpdate':
        parsedData.params[1] = new Uint8Array(parsedData.params[1]);
        break;
      case 'sendAwareness':
        parsedData.params[0] = new Uint8Array(parsedData.params[0]);
        break;
    }
    return parsedData;
  }

  normalize(data: unknown): unknown {
    if (data instanceof Uint8Array) {
      return Array.from(data);
    }

    if (Array.isArray(data)) {
      return data.map((item: unknown) => this.normalize(item));
    }

    if (isPlainObject(data)) {
      const entires = Object.entries(data);
      const object: Record<string, unknown> = {};

      for (const [key, value] of entires) {
        object[key] = this.normalize(value);
      }
      return object;
    }

    return data;
  }

  send(data: unknown): void {
    if (this._ws.readyState === WebSocket.OPEN) {
      this._send(data);
    } else {
      this._blockedData.push(data);
    }
  }

  close() {
    this._ws.close();
  }
}

export const createWebsocketCreator = (ws: WebSocket): DocProviderCreator => {
  const channel = new WebsocketMessageChannel(ws);

  return (...args) => {
    return createAsyncCallRPCProviderCreator('websocket-channel', channel, {
      cleanup() {
        channel.close();
      },
    })(...args);
  };
};
