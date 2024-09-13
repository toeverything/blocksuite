import type { ExtensionType } from '@blocksuite/block-std';
import type { DeepPartial } from '@blocksuite/global/utils';
import type { Signal } from '@preact/signals-core';
import type { z } from 'zod';

import { createIdentifier } from '@blocksuite/global/di';

import { NodePropsSchema } from '../utils/index.js';

export const EditorSettingSchema = NodePropsSchema;

export type EditorSetting = z.infer<typeof EditorSettingSchema>;

export const EditorSettingProvider = createIdentifier<
  Signal<DeepPartial<EditorSetting>>
>('AffineEditorSettingProvider');

export function EditorSettingExtension(
  signal: Signal<DeepPartial<EditorSetting>>
): ExtensionType {
  return {
    setup: di => {
      di.addImpl(EditorSettingProvider, () => signal);
    },
  };
}
