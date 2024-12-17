import type { TelemetryEvent } from './types.js';

export type LinkEventType =
  | 'CopiedLink'
  | 'OpenedAliasPopup'
  | 'SavedAlias'
  | 'ResetedAlias'
  | 'OpenedViewSelector'
  | 'SelectedView'
  | 'OpenedCaptionEditor'
  | 'OpenedCardStyleSelector'
  | 'SelectedCardStyle'
  | 'OpenedCardScaleSelector'
  | 'SelectedCardScale';

export type LinkToolbarEvents = Record<LinkEventType, TelemetryEvent>;
