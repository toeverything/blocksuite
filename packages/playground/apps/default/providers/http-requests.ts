import type { PassiveDocProvider, Workspace } from '@blocksuite/store';
import type { EventBasedChannel } from 'async-call-rpc';
import { isPlainObject } from 'merge';

import { notify } from '../utils/notify.js';
import { createAsyncCallRPCProviderCreator } from './async-call-rpc.js';
import type { DocProviderCreator } from './type.js';

export function generateRoomId(): Promise<string> {
  return fetch('https://YOURSERVER.COM/room.php', {
    method: 'post',
  })
    .then(res => res.json())
    .then(({ id }) => id);
}

export function createCollaborationRequest(room?: string) {
  room = room ?? new URLSearchParams(location.search).get('room') ?? '';

  if (!room) {
    console.warn('Invalid collaboration room');
    return;
  }

  const url = `https://YOURSERVER.COM/room.php?r=${room}`;

  return url;
}

export async function initCollaborationRequest(
  workspace: Workspace,
  room: string
) {
  const url = createCollaborationRequest(room);

  if (!url) {
    return false;
  }

  const response = await fetch(url);

  if (response.ok) {
    const provider = workspace.registerProvider(
      createHttpRequestCreator(url),
      room
    ) as PassiveDocProvider;
    provider.connect();

    notify('Collaboration request has connected', 'success');
    return true;
  } else {
    notify('Collaboration request connection failed', 'warning');
  }

  return false;
}

export class HttpRequestMessageChannel implements EventBasedChannel {
  static url = 'https://YOURSERVER.COM/room.php';

  private _url!: string;
  //private _blockedData: unknown[] = [];

  constructor(url: string) {
    this._url = url;
  }

  private _send(data: unknown) {
    data = this.normalize(data);
    fetch(this._url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }

  on(listener: (data: unknown) => void): void | (() => void) {
    setInterval(() => {
      fetch(this._url)
        .then(response => response.json())
        .then(data => listener(this.deserialize(data)));
    }, 1000); // Fetch data every second
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
    this._send(data);
  }

  close() {
    // HTTP requests do not need to be closed
  }
}

export const createHttpRequestCreator = (url: string): DocProviderCreator => {
  const channel = new HttpRequestMessageChannel(url);

  return (...args) => {
    return createAsyncCallRPCProviderCreator('http-request-channel', channel, {
      cleanup() {
        channel.close();
      },
    })(...args);
  };
};
