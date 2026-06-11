import { createIdentifier } from '@labre/global/di';
import type { ExtensionType } from '@labre/store';

/**
 * Copies the image as PNG in Electron.
 */
export interface NativeClipboardService {
  copyAsPNG(arrayBuffer: ArrayBuffer): Promise<boolean>;
}

export const NativeClipboardProvider = createIdentifier<NativeClipboardService>(
  'NativeClipboardService'
);

export function NativeClipboardExtension(
  nativeClipboardProvider: NativeClipboardService
): ExtensionType {
  return {
    setup: di => {
      di.addImpl(NativeClipboardProvider, nativeClipboardProvider);
    },
  };
}
