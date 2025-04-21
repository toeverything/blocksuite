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

export interface LinkedDocCreatedEvent extends TelemetryEvent {
  parentFlavour?: string;
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
  page?: 'doc editor' | 'whiteboard editor';
  module?: 'toolbar' | 'canvas' | 'ai chat panel';
  control?: ElementCreationSource;
}

export interface ElementLockEvent extends TelemetryEvent {
  page: 'whiteboard editor';
  segment: 'element toolbar';
  module: 'element toolbar';
  control: 'lock' | 'unlock' | 'group-lock';
}

export interface BlockCreationEvent extends TelemetryEvent {
  blockType: string;
}

export interface MindMapCollapseEvent extends TelemetryEvent {
  page: 'whiteboard editor';
  segment: 'mind map';
  type: 'expand' | 'collapse';
}

export interface AttachmentUploadedEvent extends TelemetryEvent {
  page: 'doc editor' | 'whiteboard editor';
  segment: 'attachment';
  module: 'attachment';
  control: 'uploader';
  type: string; // file type
  category: 'success' | 'failure';
}

export interface EdgelessToolPickedEvent extends TelemetryEvent {
  page: 'whiteboard editor';
  segment: 'global toolbar';
  module: 'global toolbar';
  control: 'drawing';
  type: 'brush' | 'highlighter';
}

export interface ElementUpdatedEvent extends TelemetryEvent {
  page: 'whiteboard editor';
  segment: 'toolbar';
  module: 'toolbar';
  category: string;
  control: string;
  type?: string;
}

export interface LinkEvent extends TelemetryEvent {
  result?: 'success' | 'failure';
}
