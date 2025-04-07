import { createIdentifier } from '@blocksuite/global/di';
import type { ReadonlySignal } from '@preact/signals-core';

export interface VirtualKeyboardProvider {
  readonly visible$: ReadonlySignal<boolean>;
  readonly height$: ReadonlySignal<number>;
}

export interface VirtualKeyboardProviderWithAction
  extends VirtualKeyboardProvider {
  show: () => void;
  hide: () => void;
}

export const VirtualKeyboardProvider = createIdentifier<
  VirtualKeyboardProvider | VirtualKeyboardProviderWithAction
>('VirtualKeyboardProvider');
