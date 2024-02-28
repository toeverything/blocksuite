import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

export type CalloutType =
  | 'info'
  | 'warning'
  | 'danger'
  | 'success'
  | 'primary'
  | 'secondary';

// define and export a background map with callout types as keys and string as values
export const backgroundMap = {
  info: '--affine-background-tertiary-color',
  warning: '--affine-background-warning-color',
  danger: '--affine-background-error-color',
  success: '--affine-background-success-color',
  primary: '--affine-background-primary-color',
  secondary: '--affine-background-secondary-color',
} as const;

export const CalloutBlockSchema = defineBlockSchema({
  flavour: 'affine:callout',
  props: internal => ({
    type: 'info' as CalloutType,
    text: internal.Text(),
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
