import type { BaseAdapter, Job } from '@blocksuite/store';

import { createIdentifier } from '@blocksuite/global/di';

export type AdapterFactory = {
  // TODO(@chen): Make it return the specific adapter type
  get: (job: Job) => BaseAdapter;
};

export const AdapterFactoryIdentifier =
  createIdentifier<AdapterFactory>('AdapterFactory');
