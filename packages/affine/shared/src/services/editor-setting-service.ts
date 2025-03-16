import { createIdentifier } from '@blocksuite/global/di';
import type { DeepPartial } from '@blocksuite/global/utils';
import type { ExtensionType } from '@blocksuite/store';
import type { Signal } from '@preact/signals-core';
import { z } from 'zod';

import { NodePropsSchema } from '../utils/index.js';

export const GeneralSettingSchema = z
  .object({
    edgelessScrollZoom: z.boolean().default(false),
    edgelessDisableScheduleUpdate: z.boolean().default(false),
  })
  .merge(NodePropsSchema);

export type EditorSetting = z.infer<typeof GeneralSettingSchema>;

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
