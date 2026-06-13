import { SURFACE_TEXT_UNIQ_IDENTIFIER } from '@labre/std/gfx';

/** A surface-elements map as it appears inside a template's DocSnapshot. */
export type SurfaceElementsJSON = Record<string, Record<string, unknown>>;

/**
 * Serialize a plain string into the surface `Y.Text` JSON form used inside
 * snapshots (the shape inner-text / label field). Mirrors what
 * `SurfaceBlockTransformer.toSnapshot` would emit, so templates can be
 * hand-authored without a live document.
 */
export function surfaceText(text: string) {
  return {
    [SURFACE_TEXT_UNIQ_IDENTIFIER]: true,
    delta: text ? [{ insert: text }] : [],
  };
}

/**
 * Wrap a surface-elements map into the minimal `page → surface` DocSnapshot a
 * template's `content` expects. Block/element ids are remapped on insert by the
 * template job's `replaceIdMiddleware`, and z-order indices are regenerated, so
 * callers only need stable-within-snapshot ids and meaningful element props.
 */
export function makeTemplateSnapshot(
  elements: SurfaceElementsJSON,
  title = 'Template'
) {
  return {
    type: 'page',
    meta: {
      id: 'doc:template',
      title,
      createDate: 1700000000000,
      tags: [],
    },
    blocks: {
      type: 'block',
      id: 'block:template-page',
      flavour: 'affine:page',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: title ? [{ insert: title }] : [],
        },
      },
      children: [
        {
          type: 'block',
          id: 'block:template-surface',
          flavour: 'affine:surface',
          props: { elements },
          children: [],
        },
      ],
    },
  };
}
