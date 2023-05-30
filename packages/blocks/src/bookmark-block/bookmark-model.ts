import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

// This type is declared in Affine, this block will move to Affine
type MetaData = {
  title?: string;
  description?: string;
  icon?: string;
  image?: string;
  // keywords?: string[];
  // language?: string;
  // type?: string;
  // url?: string;
  // provider?: string;
  [x: string]: string | string[] | undefined | boolean;
};
export type BookmarkProps = {
  url: string;
  caption?: string;
  crawled?: boolean;
} & MetaData;

export const defaultBookmarkProps: BookmarkProps = {
  url: '',
  title: '',
  description: '',
  icon: '',
  image: '',
  caption: '',
  crawled: false,
};

export const BookmarkBlockSchema = defineBlockSchema({
  flavour: 'affine:bookmark',
  props: (internal): BookmarkProps => defaultBookmarkProps,
  metadata: {
    version: 1,
    role: 'content',
    tag: literal`affine-bookmark`,
    parent: ['affine:frame'],
  },
});

export type BookmarkBlockModel = SchemaToModel<typeof BookmarkBlockSchema>;
