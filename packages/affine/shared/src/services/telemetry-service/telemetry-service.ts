import { createIdentifier } from '@blocksuite/global/di';

import type { OutDatabaseAllEvents } from './database.js';
import type { LinkToolbarEvents } from './link.js';
import type { NoteEvents } from './note.js';
import type {
  AttachmentUploadedEvent,
  BlockCreationEvent,
  DocCreatedEvent,
  ElementCreationEvent,
  ElementLockEvent,
  LinkedDocCreatedEvent,
  MindMapCollapseEvent,
  TelemetryEvent,
} from './types.js';

export type TelemetryEventMap = OutDatabaseAllEvents &
  LinkToolbarEvents &
  NoteEvents & {
    DocCreated: DocCreatedEvent;
    Link: TelemetryEvent;
    LinkedDocCreated: LinkedDocCreatedEvent;
    SplitNote: TelemetryEvent;
    CanvasElementAdded: ElementCreationEvent;
    EdgelessElementLocked: ElementLockEvent;
    ExpandedAndCollapsed: MindMapCollapseEvent;
    AttachmentUploadedEvent: AttachmentUploadedEvent;
    BlockCreated: BlockCreationEvent;
  };

export interface TelemetryService {
  track<T extends keyof TelemetryEventMap>(
    eventName: T,
    props: TelemetryEventMap[T]
  ): void;
}

export const TelemetryProvider = createIdentifier<TelemetryService>(
  'AffineTelemetryService'
);
