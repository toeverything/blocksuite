import type { ExtensionType } from '@blocksuite/block-std';

import { assertExists } from '@blocksuite/global/utils';

import { SpecBuilder } from './spec-builder.js';

export class SpecProvider {
  static instance: SpecProvider;

  private specMap = new Map<string, ExtensionType[]>();

  private constructor() {}

  static getInstance() {
    if (!SpecProvider.instance) {
      SpecProvider.instance = new SpecProvider();
    }
    return SpecProvider.instance;
  }

  addSpec(id: string, spec: ExtensionType[]) {
    if (!this.specMap.has(id)) {
      this.specMap.set(id, spec);
    }
  }

  clearSpec(id: string) {
    this.specMap.delete(id);
  }

  extendSpec(id: string, newSpec: ExtensionType[]) {
    const existingSpec = this.specMap.get(id);
    if (!existingSpec) {
      console.error(`Spec not found for ${id}`);
      return;
    }
    this.specMap.set(id, [...existingSpec, ...newSpec]);
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
