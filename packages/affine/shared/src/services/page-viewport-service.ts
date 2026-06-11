import { createIdentifier } from '@labre/global/di';
import type { ExtensionType } from '@labre/store';
import { Subject } from 'rxjs';

import type { Viewport } from '../types';

export const PageViewportService = createIdentifier<Subject<Viewport>>(
  'PageViewportService'
);

export const PageViewportServiceExtension: ExtensionType = {
  setup: di => {
    di.addImpl(PageViewportService, () => new Subject<Viewport>());
  },
};
