import {
  type EdgelessRootBlockComponent,
  ThemeObserver,
} from '@blocksuite/blocks';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@toeverything/theme/style.css';
import { beforeEach, describe, expect, test } from 'vitest';

import { wait } from '../utils/common.js';
import { getDocRootBlock } from '../utils/edgeless.js';
import { setupEditor } from '../utils/setup.js';

describe('theme observer', () => {
  let edgeless!: EdgelessRootBlockComponent;

  beforeEach(async () => {
    const cleanup = await setupEditor('edgeless');

    edgeless = getDocRootBlock(doc, editor, 'edgeless');

    edgeless.tools.edgelessTool = {
      type: 'default',
    };

    return cleanup;
  });

  test('switches theme', async () => {
    expect(ThemeObserver.mode).toBe('light');

    document.documentElement.dataset.theme = 'dark';
    await wait();

    expect(ThemeObserver.mode).toBe('dark');

    document.documentElement.dataset.theme = 'light';
    await wait();

    expect(ThemeObserver.mode).toBe('light');

    document.documentElement.dataset.theme = 'dark';
    await wait();

    expect(ThemeObserver.mode).toBe('dark');
  });

  test('generates a color property', async () => {
    document.documentElement.dataset.theme = 'light';
    await wait();

    expect(ThemeObserver.generateColorProperty('--affine-hover-color')).toBe(
      'var(--affine-hover-color)'
    );

    expect(ThemeObserver.generateColorProperty('--affine-transparent')).toBe(
      'transparent'
    );

    expect(ThemeObserver.generateColorProperty('transparent')).toBe(
      'transparent'
    );

    expect(
      ThemeObserver.generateColorProperty({ dark: 'white', light: 'black' })
    ).toBe('black');

    document.documentElement.dataset.theme = 'dark';
    await wait();

    expect(
      ThemeObserver.generateColorProperty({ dark: 'white', light: 'black' })
    ).toBe('white');

    expect(ThemeObserver.generateColorProperty({ normal: 'grey' })).toBe(
      'grey'
    );

    expect(ThemeObserver.generateColorProperty('', 'blue')).toBe('blue');
    expect(ThemeObserver.generateColorProperty({}, 'red')).toBe('red');
  });

  test('gets a color value', async () => {
    document.documentElement.dataset.theme = 'light';
    await wait();

    expect(ThemeObserver.getColorValue('--affine-transparent')).toBe(
      '--affine-transparent'
    );
    expect(
      ThemeObserver.getColorValue('--affine-transparent', 'transparent', true)
    ).toBe('transparent');
    expect(
      ThemeObserver.getColorValue('--affine-hover-color', 'transparent', true)
    ).toBe('rgba(0, 0, 0, .04)');
    expect(
      ThemeObserver.getColorValue('--affine-tooltip', undefined, true)
    ).toBe('rgba(0, 0, 0, 1)');

    expect(
      ThemeObserver.getColorValue(
        { dark: 'white', light: 'black' },
        undefined,
        true
      )
    ).toBe('black');
    expect(
      ThemeObserver.getColorValue({ dark: 'white', light: '' }, undefined, true)
    ).toBe('transparent');
    expect(
      ThemeObserver.getColorValue({ normal: 'grey' }, undefined, true)
    ).toBe('grey');

    document.documentElement.dataset.theme = 'dark';
    await wait();

    expect(
      ThemeObserver.getColorValue('--affine-hover-color', 'transparent', true)
    ).toEqual('rgba(255, 255, 255, .1)');
    expect(
      ThemeObserver.getColorValue('--affine-tooltip', undefined, true)
    ).toEqual('rgba(234, 234, 234, 1)'); // #eaeaea
  });
});
