export enum State {
  IDLE = 0,
  Connecting,
  Connected,
  Opening,
  Opened,
  Failed,
}

export type DocInfo = {
  total: number;
  width: number;
  height: number;
};

export type ViewportInfo = {
  dpi: number;
  width: number;
  height: number;
};

export enum MessageState {
  Poll,
  Ready,
}

export enum MessageOp {
  Init,
  Inited,
  Open,
  Opened,
  Render,
  Rendered,
}

export enum RenderKind {
  Page,
  Thumbnail,
}

export interface MessageDataMap {
  [MessageOp.Init]: undefined;
  [MessageOp.Inited]: undefined;
  [MessageOp.Open]: ArrayBuffer;
  [MessageOp.Opened]: DocInfo;
  [MessageOp.Render]: {
    index: number;
    kind: RenderKind;
    scale: number;
  };
  [MessageOp.Rendered]: {
    index: number;
    kind: RenderKind;
    imageData: ImageData;
  };
}

export type MessageDataType<T = MessageDataMap> = {
  [P in keyof T]: T[P];
};

export type MessageData<T = MessageOp, P = MessageDataType> = {
  type: T;
} & P;
