import { describe, expect, test } from 'vitest';

import type {
  BlockAbandonedEvent,
  FrameworkElementEvent,
  TelemetryEventMap,
  TelemetryService,
} from '../../services/telemetry-service/index.js';
import {
  NoopTelemetryExtension,
  NoopTelemetryService,
} from '../../services/telemetry-service/index.js';

describe('telemetry service', () => {
  test('noop adapter accepts any event and does nothing', () => {
    expect(
      NoopTelemetryService.track('BlockCreated', { blockType: 'affine:code' })
    ).toBeUndefined();
    expect(
      NoopTelemetryService.track('FrameworkElementAdded', {
        framework: 'wardley',
        element: 'node:market',
      })
    ).toBeUndefined();
    expect(NoopTelemetryExtension.setup).toBeDefined();
  });

  test('lifecycle taxonomy is part of the event map', () => {
    // Compile-time contract: a service implementation receives the
    // taxonomy events with their typed payloads.
    const received: { event: keyof TelemetryEventMap; props: unknown }[] = [];
    const service: TelemetryService = {
      track: (event, props) => {
        received.push({ event, props });
      },
    };

    service.track('BlockEdited', { flavour: 'affine:paragraph' });
    service.track('BlockDeleted', { flavour: 'affine:database' });
    const abandoned: BlockAbandonedEvent = {
      flavour: 'affine:code',
      reason: 'emptied',
      ageMs: 1200,
    };
    service.track('BlockAbandoned', abandoned);
    service.track('BlockUsageDuration', {
      flavour: 'affine:table',
      durationMs: 4500,
    });
    const framework: FrameworkElementEvent = {
      framework: 'edgy',
      element: 'facets',
    };
    service.track('FrameworkElementAdded', framework);
    service.track('FrameworkToolPicked', {
      framework: 'wardley',
      element: 'connector:arrow',
    });
    service.track('FrameworkLegendCreated', {
      framework: 'wardley',
      element: 'legend',
    });

    expect(received).toHaveLength(7);
    expect(received.map(r => r.event)).toContain('BlockAbandoned');
  });
});
