import { z } from 'zod';

export const columnPreviewSchema = z.object({
  type: z.enum(['text', 'rich-text', 'select', 'number']),
  name: z.string(),
});

export const columnPreviews: z.infer<typeof columnPreviewSchema>[] = [
  {
    type: 'number',
    name: 'Number',
  },
  {
    type: 'select',
    name: 'Select',
  },
  {
    type: 'text',
    name: 'Single Line Text',
  },
  {
    type: 'rich-text',
    name: 'Rich Text',
  },
];
