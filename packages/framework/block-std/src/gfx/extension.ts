import { type Container, createIdentifier } from '@blocksuite/global/di';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';

import { Extension } from '../extension/extension.js';
import { type GfxController, GfxControllerIdentifier } from './controller.js';

export const GfxExtensionIdentifier =
  createIdentifier<GfxExtension>('GfxExtension');

export abstract class GfxExtension extends Extension {
  static key: string;

  constructor(protected readonly gfx: GfxController) {
    super();
  }

  static override setup(di: Container) {
    if (!this.key) {
      throw new BlockSuiteError(
        ErrorCode.ValueNotExists,
        'key is not defined in the GfxExtension'
      );
    }
    di.add(this as unknown as { new (gfx: GfxController): GfxExtension }, [
      GfxControllerIdentifier,
    ]);

    di.addImpl(GfxExtensionIdentifier(this.key), provider =>
      provider.get(this)
    );
  }

  mounted() {}

  unmounted() {}
}
