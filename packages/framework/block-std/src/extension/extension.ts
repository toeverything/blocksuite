import type { Container } from '@blocksuite/global/di';

/**
 * Generic extension.
 * Extensions are used to set up the dependency injection container.
 * In most cases, you won't need to use this class directly.
 * We provide helper classes like `CommandExtension` and `BlockViewExtension` to make it easier to create extensions.
 */
export abstract class Extension {
  static setup(_di: Container): void {
    // do nothing
  }
}

export interface ExtensionType {
  setup(di: Container): void;
}
