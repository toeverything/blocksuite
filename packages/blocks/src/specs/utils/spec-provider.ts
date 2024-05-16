import type { BlockSpec } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

import { SpecBuilder } from './spec-builder.js';

export class SpecProvider {
  static instance: SpecProvider;

  private specMap: Map<string, BlockSpec[]> = new Map();

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

  hasSpec(id: string) {
    return this.specMap.has(id);
  }

  getSpec(id: string) {
    const spec = this.specMap.get(id);
    assertExists(spec, `Spec not found for ${id}`);
    return new SpecBuilder(spec);
  }

  clearSpec(id: string) {
    this.specMap.delete(id);
  }
}
