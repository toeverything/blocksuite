import type * as RichTextEffects from '@labre/affine-rich-text/effects';
import type RemarkMath from 'remark-math';

export * from './adapters';
export * from './command';
export * from './inline-spec';
export * from './markdown';

declare type _GLOBAL_ = typeof RichTextEffects | typeof RemarkMath;
