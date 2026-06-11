import { ImageLayoutPainterExtension } from '@labre/affine-block-image/turbo-painter';
import { ListLayoutPainterExtension } from '@labre/affine-block-list/turbo-painter';
import { NoteLayoutPainterExtension } from '@labre/affine-block-note/turbo-painter';
import { ParagraphLayoutPainterExtension } from '@labre/affine-block-paragraph/turbo-painter';
import { ViewportLayoutPainter } from '@labre/affine-gfx-turbo-renderer/painter';

new ViewportLayoutPainter([
  ParagraphLayoutPainterExtension,
  ListLayoutPainterExtension,
  NoteLayoutPainterExtension,
  ImageLayoutPainterExtension,
]);
