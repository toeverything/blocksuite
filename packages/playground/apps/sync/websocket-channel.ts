import { notify } from '../default/utils/notify';
import type { Channel, Protocol } from './channel';

const BASE_URL = new URL(import.meta.env.PLAYGROUND_SERVER);
const BASE_WEBSOCKET_URL = new URL(import.meta.env.PLAYGROUND_WS);

export async function generateRoomId(): Promise<string> {
  return fetch(new URL('/room/', BASE_URL), {
    method: 'post',
  })
    .then(res => res.json())
    .then(({ id }) => id);
}

export async function setupWebsocketChannel(room: string) {
  const ws = createCollaborationSocket(room);
  if (!ws) throw new Error('Failed to create collaboration socket');

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
    const channel = new WebsocketMessageChannel(ws);

    notify('Collaboration socket has connected', 'success').catch(
      console.error
    );
    return channel;
  } else {
    notify('Collaboration socket connection failed', 'warning').catch(
      console.error
    );
    throw new Error('Failed to create collaboration socket');
  }
}

function createCollaborationSocket(room?: string) {
  room = room ?? new URLSearchParams(location.search).get('room') ?? '';

  if (!room) {
    console.warn('Invalid collaboration room');
    return;
  }

  const ws = new WebSocket(new URL(`/room/${room}`, BASE_WEBSOCKET_URL));

  return ws;
}

class WebsocketMessageChannel implements Channel {
  static url = 'ws://localhost:8787';

  private _ws!: WebSocket;
  private _blockedData: Protocol[] = [];

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

  private _send(data: Protocol) {
    this._ws.send(this.normalize(data));
  }

  on(listener: (data: Protocol) => void): void | (() => void) {
    const f = (e: MessageEvent): void => {
      const parsedData = this.deserialize(e.data);
      listener(parsedData);
    };
    this._ws.addEventListener('message', f);
  }

  deserialize(data: string): Protocol {
    const parsedData = JSON.parse(data as string);

    if (parsedData.data) {
      parsedData.data = new Uint8Array(parsedData.data);
    }

    return parsedData;
  }

  normalize(data: Protocol): string {
    return JSON.stringify({
      ...data,
      data: 'data' in data ? Array.from(data.data) : undefined,
    });
  }

  send(data: Protocol): void {
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
