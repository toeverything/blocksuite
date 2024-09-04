import type { z } from 'zod';

import { NodePropsSchema } from '@blocksuite/affine-shared/utils';

export const EditorSettingSchema = NodePropsSchema;

export type EditorSetting = z.infer<typeof EditorSettingSchema>;
