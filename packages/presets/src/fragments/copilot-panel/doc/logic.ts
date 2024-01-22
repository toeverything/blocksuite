import type { EditorHost } from '@blocksuite/lit';

export class AIDocLogic {
  constructor(private getHost: () => EditorHost) {}

  get host() {
    return this.getHost();
  }
}
