import type { SelectTag } from '../utils/tags/multi-tag-select.js';

import { typesystem } from './typesystem.js';

export const tNumber = typesystem.defineData<{ value: number }>({
  name: 'Number',
  supers: [],
});
export const tString = typesystem.defineData<{ value: string }>({
  name: 'String',
  supers: [],
});
export const tRichText = typesystem.defineData<{ value: string }>({
  name: 'RichText',
  supers: [tString],
});
export const tBoolean = typesystem.defineData<{ value: boolean }>({
  name: 'Boolean',
  supers: [],
});
export const tDate = typesystem.defineData<{ value: number }>({
  name: 'Date',
  supers: [],
});
export const tURL = typesystem.defineData({
  name: 'URL',
  supers: [tString],
});
export const tImage = typesystem.defineData({
  name: 'Image',
  supers: [],
});
export const tEmail = typesystem.defineData({
  name: 'Email',
  supers: [tString],
});
export const tPhone = typesystem.defineData({
  name: 'Phone',
  supers: [tString],
});
export const tTag = typesystem.defineData<{ tags: SelectTag[] }>({
  name: 'Tag',
  supers: [],
});
