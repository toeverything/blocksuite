import * as zod from 'zod';
import Zod from 'zod';

import { defineDataType } from './data-type.js';
import { typesystem } from './typesystem.js';

export type SelectTag = Zod.TypeOf<typeof SelectTagSchema>
export const SelectTagSchema = Zod.object({
  id: Zod.string(),
  color: Zod.string(),
  value: Zod.string(),
  parentId: Zod.string().optional(),
});

export const t = {
  unknown: defineDataType('Number', zod.never(), zod.unknown()),
  number: defineDataType('Number', zod.number(), zod.number()),
  string: defineDataType('String', zod.string(), zod.string()),
  boolean: defineDataType('Boolean', zod.boolean(), zod.boolean()),
  richText: defineDataType('RichText', zod.string(), zod.string()),
  date: defineDataType('Date', zod.number(), zod.number()),
  url: defineDataType('URL', zod.string(), zod.string()),
  image: defineDataType('Image', zod.string(), zod.string()),
  tag: defineDataType('Tag', zod.array(SelectTagSchema), zod.string()),
};
export const tNumber = typesystem.defineData<{
  value: number
}>({
  name: 'Number',
  supers: [],
  validate: zod.object({
    value: zod.number(),
  }),
});
export const tString = typesystem.defineData<{
  value: string
}>({
  name: 'String',
  supers: [],
  validate: zod.object({
    value: zod.string(),
  }),
});
export const tRichText = typesystem.defineData<{
  value: string
}>({
  name: 'RichText',
  supers: [tString],
  validate: zod.object({
    value: zod.string(),
  }),
});
export const tBoolean = typesystem.defineData<{
  value: boolean
}>({
  name: 'Boolean',
  supers: [],
  validate: zod.object({
    value: zod.boolean(),
  }),
});
export const tDate = typesystem.defineData<{
  value: number
}>({
  name: 'Date',
  supers: [],
  validate: zod.object({
    value: zod.number(),
  }),
});
export const tURL = typesystem.defineData({
  name: 'URL',
  supers: [tString],
  validate: zod.object({
    value: zod.string(),
  }),
});
export const tImage = typesystem.defineData({
  name: 'Image',
  supers: [],
  validate: zod.object({
    value: zod.string(),
  }),
});
export const tEmail = typesystem.defineData({
  name: 'Email',
  supers: [tString],
  validate: zod.object({
    value: zod.string(),
  }),
});
export const tPhone = typesystem.defineData({
  name: 'Phone',
  supers: [tString],
  validate: zod.object({
    value: zod.string(),
  }),
});
export const tTag = typesystem.defineData<{
  tags: SelectTag[]
}>({
  name: 'Tag',
  supers: [],
  validate: zod.object({
    tags: zod.array(SelectTagSchema),
  }),
});
