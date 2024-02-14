import type { Awareness } from 'y-protocols/awareness';

export interface AwarenessSource {
  connect(awareness: Awareness): void;
  disconnect(): void;
}
