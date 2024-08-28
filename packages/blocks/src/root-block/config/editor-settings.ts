import {
  BrushSchema,
  ConnectorSchema,
  EdgelessTextSchema,
  NoteSchema,
  ShapeSchema,
} from '@blocksuite/affine-shared/utils';
import { z } from 'zod';

export const EditorSettingSchema = z.object({
  connector: ConnectorSchema,
  brush: BrushSchema,
  shape: ShapeSchema,
  'affine:edgeless-text': EdgelessTextSchema,
  'affine:note': NoteSchema,
});

export type EditorSetting = z.infer<typeof EditorSettingSchema>;
