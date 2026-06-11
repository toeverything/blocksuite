import type { ExtensionType } from '@labre/store';

import {
  TelemetryExtension,
  type TelemetryService,
} from './telemetry-service.js';

/**
 * Default telemetry adapter that drops every event. Register it when the
 * editor runs standalone (playground, tests, self-hosted without analytics)
 * so the telemetry seam is always wired; a host application replaces it with
 * its own adapter via `TelemetryExtension(service)` (e.g. PostHog, GA4).
 */
export const NoopTelemetryService: TelemetryService = {
  track: () => {},
};

export const NoopTelemetryExtension: ExtensionType = TelemetryExtension(
  NoopTelemetryService
);
