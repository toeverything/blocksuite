import { describe, expect, test } from 'vitest';

import { getInternalStoreExtensions } from '../../extensions/store.js';
import { getInternalViewExtensions } from '../../extensions/view.js';
import { type BlockFlags, OPTIONAL_BLOCKS } from '../../flags.js';
import { AffineSchemas, getAffineSchemas } from '../../schemas.js';

const flavours = (flags?: BlockFlags) =>
  getAffineSchemas(flags).map(schema => schema.model.flavour);

describe('block registry flags', () => {
  test('no flags registers everything, in the legacy order', () => {
    expect(getAffineSchemas()).toEqual(AffineSchemas);
    expect(getAffineSchemas({})).toEqual(AffineSchemas);
    expect(getInternalStoreExtensions({})).toEqual(
      getInternalStoreExtensions()
    );
    expect(getInternalViewExtensions({})).toEqual(getInternalViewExtensions());
  });

  test('disabling a block removes its schema only', () => {
    const names = flavours({ database: false });
    expect(names).not.toContain('affine:database');
    expect(names).toHaveLength(AffineSchemas.length - 1);
    expect(flavours()).toContain('affine:database');
  });

  test('disabling embed keeps doc embeds', () => {
    const names = flavours({ embed: false });
    expect(names).not.toContain('affine:embed-youtube');
    expect(names).not.toContain('affine:embed-figma');
    expect(names).not.toContain('affine:embed-github');
    expect(names).not.toContain('affine:embed-html');
    expect(names).not.toContain('affine:embed-loom');
    expect(names).toContain('affine:embed-linked-doc');
    expect(names).toContain('affine:embed-synced-doc');
  });

  test('core blocks survive disabling every optional block', () => {
    const allOff = Object.fromEntries(
      OPTIONAL_BLOCKS.map(block => [block, false])
    ) as BlockFlags;
    const names = flavours(allOff);
    expect(names).toContain('affine:page');
    expect(names).toContain('affine:note');
    expect(names).toContain('affine:paragraph');
    expect(names).toContain('affine:surface');
    expect(getInternalStoreExtensions(allOff).length).toBeGreaterThan(0);
    expect(getInternalViewExtensions(allOff).length).toBeGreaterThan(0);
  });

  test('store extensions honor flags', () => {
    const all = getInternalStoreExtensions();
    expect(getInternalStoreExtensions({ database: false })).toHaveLength(
      all.length - 1
    );
    // latex gates both the block and the inline extension
    expect(getInternalStoreExtensions({ latex: false })).toHaveLength(
      all.length - 2
    );
  });

  test('view extensions honor flags', () => {
    const all = getInternalViewExtensions();
    expect(
      getInternalViewExtensions({ wardley: false, edgy: false })
    ).toHaveLength(all.length - 2);
    // frame gates both the block view and the frame panel fragment
    expect(getInternalViewExtensions({ frame: false })).toHaveLength(
      all.length - 2
    );
  });
});
