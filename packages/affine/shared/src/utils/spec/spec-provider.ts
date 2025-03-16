import { BlockSuiteError } from '@blocksuite/global/exceptions';
import type { ExtensionType } from '@blocksuite/store';

import { SpecBuilder } from './spec-builder.js';

type SpecId =
  | 'store'
  | 'page'
  | 'edgeless'
  | 'preview:page'
  | 'preview:edgeless';

export class SpecProvider {
  static instance: SpecProvider;

  private readonly specMap = new Map<SpecId, ExtensionType[]>();

  private constructor() {}

  static get _() {
    if (!SpecProvider.instance) {
      SpecProvider.instance = new SpecProvider();
    }
    return SpecProvider.instance;
  }

  addSpec(id: SpecId, spec: ExtensionType[]) {
    if (!this.specMap.has(id)) {
      this.specMap.set(id, spec);
    }
  }

  clearSpec(id: SpecId) {
    this.specMap.delete(id);
  }

  extendSpec(id: SpecId, newSpec: ExtensionType[]) {
    const existingSpec = this.specMap.get(id);
    if (!existingSpec) {
      console.error(`Spec not found for ${id}`);
      return;
    }
    this.specMap.set(id, [...existingSpec, ...newSpec]);
  }

  getSpec(id: SpecId) {
    const spec = this.specMap.get(id);
    if (!spec) {
      throw new BlockSuiteError(
        BlockSuiteError.ErrorCode.ValueNotExists,
        `Spec not found for ${id}`
      );
    }
    return new SpecBuilder(spec);
  }

  hasSpec(id: SpecId) {
    return this.specMap.has(id);
  }

  omitSpec(id: SpecId, targetSpec: ExtensionType) {
    const existingSpec = this.specMap.get(id);
    if (!existingSpec) {
      console.error(`Spec not found for ${id}`);
      return;
    }

    this.specMap.set(
      id,
      existingSpec.filter(spec => spec !== targetSpec)
    );
  }

  replaceSpec(id: SpecId, targetSpec: ExtensionType, newSpec: ExtensionType) {
    const existingSpec = this.specMap.get(id);
    if (!existingSpec) {
      console.error(`Spec not found for ${id}`);
      return;
    }

    this.specMap.set(
      id,
      existingSpec.map(spec => (spec === targetSpec ? newSpec : spec))
    );
  }
}
