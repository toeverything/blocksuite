import type { TelemetryEvent } from './types.js';

/**
 * Per-block lifecycle taxonomy. Every block flavour reports the same five
 * moments — created / edited / deleted / abandoned / usage duration — so that
 * product analytics can compare blocks against each other with one query.
 * See ./README.md for the full taxonomy contract.
 */
export interface BlockLifecycleEvent extends TelemetryEvent {
  /** Block flavour, e.g. 'affine:paragraph', 'affine:database'. */
  flavour: string;
  page?: 'doc editor' | 'whiteboard editor';
}

export interface BlockAbandonedEvent extends BlockLifecycleEvent {
  /** Why the block is considered abandoned. */
  reason: 'emptied' | 'deleted-after-create' | 'undo';
  /** Time between creation and abandon, in milliseconds. */
  ageMs?: number;
}

export interface BlockUsageDurationEvent extends BlockLifecycleEvent {
  /** Cumulated active editing time, in milliseconds. */
  durationMs: number;
}

export type BlockLifecycleEvents = {
  // BlockCreated already exists in TelemetryEventMap (BlockCreationEvent).
  BlockEdited: BlockLifecycleEvent;
  BlockDeleted: BlockLifecycleEvent;
  BlockAbandoned: BlockAbandonedEvent;
  BlockUsageDuration: BlockUsageDurationEvent;
};

/**
 * Events of the business framework diagrams (Wardley map, EDGY facets,
 * Cynefin / estuarine…). One event vocabulary for all frameworks: the
 * `framework` property segments, the `element` property identifies what was
 * manipulated ('background:classic', 'node:market', 'connector:link'…).
 */
export interface FrameworkElementEvent extends TelemetryEvent {
  framework: 'wardley' | 'edgy' | 'cynefin';
  element: string;
}

export type FrameworkDiagramEvents = {
  FrameworkElementAdded: FrameworkElementEvent;
  FrameworkToolPicked: FrameworkElementEvent;
  FrameworkLegendCreated: FrameworkElementEvent;
};
