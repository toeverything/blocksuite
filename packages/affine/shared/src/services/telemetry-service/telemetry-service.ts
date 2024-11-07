import { createIdentifier } from '@blocksuite/global/di';

import type { OutDatabaseAllEvents } from './database.js';
import type {
  DocCreatedEvent,
  ElementCreationEvent,
  TelemetryEvent,
} from './types.js';

export type TelemetryEventMap = OutDatabaseAllEvents & {
  DocCreated: DocCreatedEvent;
  LinkedDocCreated: TelemetryEvent;
  SplitNote: TelemetryEvent;
  CanvasElementAdded: ElementCreationEvent;
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
