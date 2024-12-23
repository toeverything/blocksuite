import { typesystem } from './typesystem.js';

export const tString = typesystem.defineData<{ value: string }>({
  name: 'String',
  supers: [],
});
export const tRichText = typesystem.defineData<{ value: string }>({
  name: 'RichText',
  supers: [tString],
});
