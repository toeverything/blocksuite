import type { Awareness } from 'y-protocols/awareness';

export interface AwarenessProvider {
  connect(awareness: Awareness): void;
  disconnect(): void;
}

export class AwarenessEngine {
  constructor(
    private readonly awareness: Awareness,
    public readonly providers: AwarenessProvider[]
  ) {}

  connect() {
    this.providers.forEach(provider => provider.connect(this.awareness));
  }

  disconnect() {
    this.providers.forEach(provider => provider.disconnect());
  }
}
