import type { Awareness } from 'y-protocols/awareness';

import type { AwarenessSource } from './source.js';

export class AwarenessEngine {
  constructor(
    readonly awareness: Awareness,
    readonly sources: AwarenessSource[]
  ) {}

  connect() {
    this.sources.forEach(source => source.connect(this.awareness));
  }

  disconnect() {
    this.sources.forEach(source => source.disconnect());
  }
}
