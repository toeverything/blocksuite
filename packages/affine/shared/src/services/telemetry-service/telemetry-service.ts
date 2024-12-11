import { createIdentifier } from '@blocksuite/global/di';

import type { OutDatabaseAllEvents } from './database.js';
import type { LinkToolbarEvents } from './link.js';
import type {
  DocCreatedEvent,
  ElementCreationEvent,
  ElementLockEvent,
  TelemetryEvent,
} from './types.js';

export type TelemetryEventMap = OutDatabaseAllEvents &
  LinkToolbarEvents & {
    DocCreated: DocCreatedEvent;
    Link: TelemetryEvent;
    LinkedDocCreated: TelemetryEvent;
    SplitNote: TelemetryEvent;
    CanvasElementAdded: ElementCreationEvent;
    EdgelessElementLocked: ElementLockEvent;
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
