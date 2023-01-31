import { nanoid } from '@blocksuite/store';
import TagSchema = BlockSuiteInternal.TagSchema;
import BaseTagSchema = BlockSuiteInternal.BaseTagSchema;
import NumberTagSchema = BlockSuiteInternal.NumberTagSchema;
import TextTagSchema = BlockSuiteInternal.TextTagSchema;
import SelectTagSchema = BlockSuiteInternal.SelectTagSchema;

export function columnTypeToTagSchema<Schema extends TagSchema>(
  type: Schema['type']
): Schema {
  const baseSchema: Omit<
    BaseTagSchema<TagSchema['__$TYPE_HOLDER$__']>,
    'type'
  > = {
    id: nanoid(),
    name: type,
    meta: {
      color: '#ff0000',
      hide: false,
      width: 200,
    },
  };
  switch (type) {
    case 'number':
      return {
        ...baseSchema,
        type: 'number',
        decimal: 0,
      } satisfies NumberTagSchema as Schema;
    case 'select':
      return {
        ...baseSchema,
        type: 'select',
        selection: [] as string[],
      } satisfies SelectTagSchema as Schema;
    case 'text':
      return {
        ...baseSchema,
        type: 'text',
      } satisfies TextTagSchema as Schema;
    case 'rich-text':
    default:
      throw new Error('');
  }
}
