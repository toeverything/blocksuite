import type { BlockSpec } from '@blocksuite/block-std';

import { assertExists } from '@blocksuite/global/utils';

import { SpecBuilder } from './spec-builder.js';

export class SpecProvider {
  private specMap = new Map<string, BlockSpec[]>();

  static instance: SpecProvider;

  private constructor() {}

  static getInstance() {
    if (!SpecProvider.instance) {
      SpecProvider.instance = new SpecProvider();
    }
    return SpecProvider.instance;
  }

  addSpec(id: string, spec: BlockSpec[]) {
    if (!this.specMap.has(id)) {
      this.specMap.set(id, spec);
    }
  }

  clearSpec(id: string) {
    this.specMap.delete(id);
  }

  getSpec(id: string) {
    const spec = this.specMap.get(id);
    assertExists(spec, `Spec not found for ${id}`);
    return new SpecBuilder(spec);
  }

  hasSpec(id: string) {
    return this.specMap.has(id);
  }
}
