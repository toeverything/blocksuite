export type AwarenessMessage = {
  channel: 'awareness';
  payload: { type: 'connect' } | { type: 'update'; update: number[] };
};

export type DocMessage = {
  channel: 'doc';
  payload:
    | {
        docId: string;
        type: 'update';
        updates: number[];
      }
    | {
        type: 'init';
      };
};

export type WebSocketMessage = AwarenessMessage | DocMessage;
