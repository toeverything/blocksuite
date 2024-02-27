import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

export type CalloutTitle =
  | 'info'
  | 'warning'
  | 'danger'
  | 'success'
  | 'primary'
  | 'secondary';

// define and export a background map with callout types as keys and string as values
export const backgroundMap = {
  info: '--affine-blue-100',
  warning: '--affine-yellow-100',
  danger: '--affine-red-100',
  success: '--affine-green-100',
  primary: '--affine-primary-100',
  secondary: '--affine-secondary-100',
} as const;

export const CalloutBlockSchema = defineBlockSchema({
  flavour: 'affine:callout',
  props: internal => ({
    title: 'info' as CalloutTitle,
    text: internal.Text(),
    background: backgroundMap['info'],
  }),
  metadata: {
    version: 1,
    role: 'content',
    parent: [
      'affine:note',
      'affine:database',
      'affine:list',
      'affine:paragraph',
    ],
  },
});

export type CalloutBlockModel = SchemaToModel<typeof CalloutBlockSchema>;
