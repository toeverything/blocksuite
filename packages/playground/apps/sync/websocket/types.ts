export type AwarenessMessage = {
  channel: 'awareness';
  payload: { type: 'connect' } | { type: 'update'; update: number[] };
};

export type DocMessage = {
  channel: 'doc';
  payload:
    | {
        type: 'init';
      }
    | {
        type: 'update';
        docId: string;
        updates: number[];
      };
};

export type WebSocketMessage = AwarenessMessage | DocMessage;
