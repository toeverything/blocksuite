import { CommentInlineSpecExtension } from '@labre/affine-inline-comment';
import { FootNoteInlineSpecExtension } from '@labre/affine-inline-footnote';
import { LatexInlineSpecExtension } from '@labre/affine-inline-latex';
import { LinkInlineSpecExtension } from '@labre/affine-inline-link';
import { MentionInlineSpecExtension } from '@labre/affine-inline-mention';
import { ReferenceInlineSpecExtension } from '@labre/affine-inline-reference';
import type { AffineTextAttributes } from '@labre/affine-shared/types';
import { InlineManagerExtension } from '@labre/std/inline';

import {
  BackgroundInlineSpecExtension,
  BoldInlineSpecExtension,
  CodeInlineSpecExtension,
  ColorInlineSpecExtension,
  ItalicInlineSpecExtension,
  StrikeInlineSpecExtension,
  UnderlineInlineSpecExtension,
} from './inline-spec';

export const DefaultInlineManagerExtension =
  InlineManagerExtension<AffineTextAttributes>({
    id: 'DefaultInlineManager',
    specs: [
      BoldInlineSpecExtension.identifier,
      ItalicInlineSpecExtension.identifier,
      UnderlineInlineSpecExtension.identifier,
      StrikeInlineSpecExtension.identifier,
      CodeInlineSpecExtension.identifier,
      BackgroundInlineSpecExtension.identifier,
      ColorInlineSpecExtension.identifier,
      LatexInlineSpecExtension.identifier,
      ReferenceInlineSpecExtension.identifier,
      LinkInlineSpecExtension.identifier,
      FootNoteInlineSpecExtension.identifier,
      MentionInlineSpecExtension.identifier,
      CommentInlineSpecExtension.identifier,
    ],
  });
