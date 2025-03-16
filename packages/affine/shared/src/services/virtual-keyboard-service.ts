import { createIdentifier } from '@blocksuite/global/di';
import type { ReadonlySignal } from '@preact/signals-core';

export interface VirtualKeyboardProvider {
  show: () => void;
  hide: () => void;
  readonly visible$: ReadonlySignal<boolean>;
  readonly height$: ReadonlySignal<number>;
}

export const VirtualKeyboardProvider =
  createIdentifier<VirtualKeyboardProvider>('VirtualKeyboardProvider');
