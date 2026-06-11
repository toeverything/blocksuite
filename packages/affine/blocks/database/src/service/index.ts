import type { PropertyMetaConfig } from '@labre/data-view';
import { createIdentifier } from '@labre/global/di';

export interface DatabaseBlockConfigService {
  propertiesPresets: PropertyMetaConfig[];
}

export const DatabaseBlockConfigService =
  createIdentifier<DatabaseBlockConfigService>(
    'AffineDatabaseBlockConfigService'
  );
