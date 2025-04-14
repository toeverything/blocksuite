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

export function isVirtualKeyboardProviderWithAction(
  provider: VirtualKeyboardProvider
): provider is VirtualKeyboardProviderWithAction {
  return 'show' in provider && 'hide' in provider;
}
