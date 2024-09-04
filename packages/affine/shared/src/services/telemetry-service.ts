import { createIdentifier } from '@blocksuite/global/di';

export type ElementCreationSource =
  | 'shortcut'
  | 'toolbar:general'
  | 'toolbar:dnd'
  | 'canvas:drop'
  | 'canvas:draw'
  | 'canvas:dbclick'
  | 'canvas:paste'
  | 'context-menu'
  | 'ai'
  | 'internal'
  | 'conversation'
  | 'manually save';

export interface TelemetryEvent {
  page?: string;
  segment?: string;
  module?: string;
  control?: string;
  type?: string;
  category?: string;
  other?: unknown;
}

export interface DocCreatedEvent extends TelemetryEvent {
  page?: 'doc editor' | 'whiteboard editor';
  segment?: 'whiteboard' | 'note' | 'doc';
  module?:
    | 'slash commands'
    | 'format toolbar'
    | 'edgeless toolbar'
    | 'inline @';
  category?: 'page' | 'whiteboard';
}

export interface ElementCreationEvent extends TelemetryEvent {
  segment?: 'toolbar' | 'whiteboard' | 'right sidebar';
  page: 'whiteboard editor';
  module?: 'toolbar' | 'canvas' | 'ai chat panel';
  control?: ElementCreationSource;
}

export interface TelemetryEventMap {
  DocCreated: DocCreatedEvent;
  LinkedDocCreated: TelemetryEvent;
  SplitNote: TelemetryEvent;
  CanvasElementAdded: ElementCreationEvent;
}

export interface TelemetryService {
  track<T extends keyof TelemetryEventMap>(
    eventName: T,
    props: TelemetryEventMap[T]
  ): void;
}

export const TelemetryProvider = createIdentifier<TelemetryService>(
  'AffineTelemetryService'
);
