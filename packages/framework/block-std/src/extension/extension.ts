import type { Container } from '@blocksuite/global/di';

export abstract class Extension {
  static setup(_di: Container): void {
    // do nothing
  }
}

export interface ExtensionType {
  setup(di: Container): void;
}

export type InlineExtensionType = (di: Container) => void;
