import type { EditorHost } from '@blocksuite/block-std';

export class AIDocLogic {
  constructor(private getHost: () => EditorHost) {}

  get host() {
    return this.getHost();
  }
}
