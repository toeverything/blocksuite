import type { ColorScheme } from '@blocks/_common/theme/theme-observer.js';
import type { Color } from '@blocks/surface-block/consts.js';

import { ThemeObserver } from '@blocks/_common/theme/theme-observer.js';
import { parseStringToRgba } from '@blocks/root-block/edgeless/components/color-picker/utils.js';
import { type Locator, type Page, expect } from '@playwright/test';
import { dragBetweenCoords } from 'utils/actions/drag.js';
import {
  Shape,
  addBasicShapeElement,
  switchEditorMode,
  triggerComponentToolbarAction,
} from 'utils/actions/edgeless.js';
import {
  enterPlaygroundRoom,
  initEmptyEdgelessState,
} from 'utils/actions/misc.js';

import { test } from '../utils/playwright.js';

declare global {
  interface Window {
    getThemeObserver: () => Promise<CustomThemeObserver>;
    getThemeMode: () => Promise<string>;
    setThemeMode: (mode: string) => Promise<void>;
    getColorValue: (
      color: Color,
      fallback?: string,
      real?: boolean
    ) => Promise<void>;
  }
}

async function setupWithColorPickerFunction(page: Page) {
  await enterPlaygroundRoom(page, { flags: { enable_color_picker: true } });
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
}

function getColorPickerButtonWithClass(page: Page, classes: string) {
  return page.locator(`edgeless-color-picker-button.${classes}`);
}

function getCurrentColorUnitButton(locator: Locator) {
  return locator.locator('edgeless-color-button').locator('.color-unit');
}

function getCurrentColor(locator: Locator) {
  return locator.evaluate(ele =>
    getComputedStyle(ele).getPropertyValue('background-color')
  );
}

function getCustomButton(locator: Locator) {
  return locator.locator('edgeless-color-custom-button');
}

function getColorPickerPanel(locator: Locator) {
  return locator.locator('edgeless-color-picker');
}

function getPaletteControl(locator: Locator) {
  return locator.locator('.color-palette');
}

function getHueControl(locator: Locator) {
  return locator.locator('.color-slider-wrapper.hue .color-slider');
}

function getAlphaControl(locator: Locator) {
  return locator.locator('.color-slider-wrapper.alpha .color-slider');
}

function getHexInput(locator: Locator) {
  return locator.locator('label.color input');
}

function getAlphaInput(locator: Locator) {
  return locator.locator('label.alpha input');
}

async function themeObserverSetup(page: Page) {
  await setupWithColorPickerFunction(page);

  CustomThemeObserver.instance = new CustomThemeObserver();
  CustomThemeObserver.computedStyle = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
  );

  await page.exposeFunction('setThemeMode', (mode: string) => {
    CustomThemeObserver.instance.mode$.value = mode as ColorScheme;
  });

  await page.exposeFunction('getThemeMode', () => CustomThemeObserver.mode);

  await page.exposeFunction('getThemeObserver', () => CustomThemeObserver);

  await page.exposeFunction(
    'getColorValue',
    async (color: Color, fallback?: string, real?: boolean) => {
      return CustomThemeObserver.getColorValue2(
        color,
        fallback,
        real,
        CustomThemeObserver.mode,
        async (property: string) => {
          if (property.startsWith('--')) {
            if (property.endsWith('transparent')) {
              return 'transparent';
            }
            return (
              (await page.evaluate(
                property =>
                  getComputedStyle(document.documentElement)
                    .getPropertyValue(property)
                    .trim(),
                property
              )) || property
            );
          }
          return property;
        }
      );
    }
  );

  await page.evaluate(() => {
    const callback = () => {
      const mode = document.documentElement.dataset.theme ?? 'light';
      window.setThemeMode(mode).catch(console.error);
    };
    const observer = new MutationObserver(callback);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.onchange = e => {
      window.setThemeMode(e.matches ? 'dark' : 'light').catch(console.error);
    };

    callback();
  });
}

function getColorValue(
  page: Page,
  color: Color,
  fallback?: string,
  real?: boolean
) {
  return page.evaluate(
    ([color, fallback, real]) =>
      window.getColorValue(
        color as Color,
        fallback as string | undefined,
        real as boolean | undefined
      ),
    [color, fallback, real]
  );
}

class CustomThemeObserver extends ThemeObserver {
  static override #computedStyle: CSSStyleDeclaration;

  static override #instance: CustomThemeObserver;

  static override get computedStyle() {
    return CustomThemeObserver.#computedStyle;
  }

  static override set computedStyle(style: CSSStyleDeclaration) {
    CustomThemeObserver.#computedStyle = style;
  }

  static async getColorValue2(
    color: Color,
    fallback = 'transparent',
    real?: boolean,
    mode = CustomThemeObserver.mode,
    getPropertyValue: (property: string) => Promise<string> = (
      property: string
    ) => Promise.resolve(property)
  ) {
    if (typeof color === 'object') {
      color = color[mode] ?? color.normal ?? fallback;
    }
    if (!color) {
      color = fallback ?? 'transparent';
    }
    if (real && color.startsWith('--')) {
      color = color.endsWith('transparent')
        ? 'transparent'
        : await getPropertyValue(color);

      if (!color) {
        color = fallback.startsWith('--')
          ? await getPropertyValue(fallback)
          : fallback;
      }
    }

    return color;
  }

  static override get instance() {
    return CustomThemeObserver.#instance;
  }

  static override set instance(instance: CustomThemeObserver) {
    CustomThemeObserver.#instance = instance;
  }

  static override get mode() {
    return CustomThemeObserver.instance.mode$.peek();
  }
}

// Theme Observer
test.describe('theme observer', () => {
  test.describe('dark', () => {
    test.use({ colorScheme: 'dark' });

    test('should update theme mode', async ({ page }) => {
      await themeObserverSetup(page);

      let isDark = await page.evaluate(
        () => matchMedia('(prefers-color-scheme: dark)').matches
      );
      expect(isDark).toBeTruthy();
      isDark = await page.evaluate(
        async () => (await window.getThemeMode()) === 'dark'
      );
      expect(isDark).toBeTruthy();
      expect(CustomThemeObserver.mode).toEqual('dark');
    });

    test('should return a normal color value', async ({ page }) => {
      await themeObserverSetup(page);

      let color = await getColorValue(page, { normal: '#f0f' });
      expect(color).toEqual('#f0f');

      color = await getColorValue(page, {
        light: '#f00',
        dark: '#00f',
      });
      expect(color).toEqual('#00f');
    });

    test('should return a real color value', async ({ page }) => {
      await themeObserverSetup(page);

      let color = await getColorValue(page, 'transparent', undefined, true);
      expect(color).toEqual('transparent');

      color = await getColorValue(
        page,
        '--affine-palette-transparent',
        undefined,
        true
      );
      expect(color).toEqual('transparent');

      color = await getColorValue(
        page,
        '--affine-palette-shape-yellow',
        undefined,
        true
      );
      expect(color).toEqual('rgb(255, 223, 107)');
    });
  });

  test.describe('light', () => {
    test.use({ colorScheme: 'light' });

    test('should update theme mode', async ({ page }) => {
      await themeObserverSetup(page);

      let isLight = await page.evaluate(
        () => matchMedia('(prefers-color-scheme: light)').matches
      );
      expect(isLight).toBeTruthy();
      isLight = await page.evaluate(
        async () => (await window.getThemeMode()) === 'light'
      );
      expect(isLight).toBeTruthy();
      expect(CustomThemeObserver.mode).toEqual('light');
    });

    test('should return a normal color value', async ({ page }) => {
      await themeObserverSetup(page);

      let color = await getColorValue(page, { normal: '#f0f' });
      expect(color).toEqual('#f0f');

      color = await getColorValue(page, {
        light: '#f00',
        dark: '#00f',
      });
      expect(color).toEqual('#f00');
    });
  });
});

// Basic functions
test.describe('basic functions', () => {
  test('custom color button should be displayed', async ({ page }) => {
    await setupWithColorPickerFunction(page);

    const start0 = { x: 100, y: 100 };
    const end0 = { x: 150, y: 200 };
    await addBasicShapeElement(page, start0, end0, Shape.Square);

    const fillColorButton = getColorPickerButtonWithClass(page, 'fill-color');
    await expect(fillColorButton).toBeVisible();

    await triggerComponentToolbarAction(page, 'changeShapeFillColor');

    const customButton = getCustomButton(fillColorButton);
    await expect(customButton).toBeVisible();
  });

  test('should open color-picker panel when clicking on custom color button', async ({
    page,
  }) => {
    await setupWithColorPickerFunction(page);

    const start0 = { x: 100, y: 100 };
    const end0 = { x: 150, y: 200 };
    await addBasicShapeElement(page, start0, end0, Shape.Square);

    await triggerComponentToolbarAction(page, 'changeShapeFillColor');

    const fillColorButton = getColorPickerButtonWithClass(page, 'fill-color');
    const customButton = getCustomButton(fillColorButton);

    await customButton.click();

    const colorPickerPanel = getColorPickerPanel(fillColorButton);

    await expect(colorPickerPanel).toBeVisible();
  });

  test('should close color-picker panel when clicking on outside', async ({
    page,
  }) => {
    await setupWithColorPickerFunction(page);

    const start0 = { x: 100, y: 100 };
    const end0 = { x: 150, y: 200 };
    await addBasicShapeElement(page, start0, end0, Shape.Square);

    await triggerComponentToolbarAction(page, 'changeShapeFillColor');

    const fillColorButton = getColorPickerButtonWithClass(page, 'fill-color');
    const currentColorUnit = getCurrentColorUnitButton(fillColorButton);

    const value = await getCurrentColor(currentColorUnit);
    await expect(currentColorUnit).toHaveCSS('background-color', value);

    const customButton = getCustomButton(fillColorButton);

    await customButton.click();

    const colorPickerPanel = getColorPickerPanel(fillColorButton);

    await expect(colorPickerPanel).toBeVisible();

    await colorPickerPanel.click({ position: { x: 0, y: 0 } });
    await expect(colorPickerPanel).toBeVisible();

    await page.mouse.click(0, 0);

    await expect(colorPickerPanel).toBeHidden();
  });

  test('should return to the palette panel when re-clicking the color button', async ({
    page,
  }) => {
    await setupWithColorPickerFunction(page);

    const start0 = { x: 100, y: 100 };
    const end0 = { x: 150, y: 200 };
    await addBasicShapeElement(page, start0, end0, Shape.Square);

    await triggerComponentToolbarAction(page, 'changeShapeFillColor');

    const fillColorButton = getColorPickerButtonWithClass(page, 'fill-color');
    const customButton = getCustomButton(fillColorButton);
    const colorPickerPanel = getColorPickerPanel(fillColorButton);

    await customButton.click();

    await expect(colorPickerPanel).toBeVisible();

    await page.mouse.click(0, 0);

    await expect(colorPickerPanel).toBeHidden();

    await dragBetweenCoords(page, { x: 125, y: 75 }, { x: 175, y: 225 });

    await fillColorButton.click();

    await expect(customButton).toBeVisible();
    await expect(colorPickerPanel).toBeHidden();
  });

  test('should pick a color when clicking on the palette canvas', async ({
    page,
  }) => {
    await setupWithColorPickerFunction(page);

    const start0 = { x: 100, y: 100 };
    const end0 = { x: 150, y: 200 };
    await addBasicShapeElement(page, start0, end0, Shape.Square);

    await triggerComponentToolbarAction(page, 'changeShapeFillColor');

    const fillColorButton = getColorPickerButtonWithClass(page, 'fill-color');
    const customButton = getCustomButton(fillColorButton);
    const colorPickerPanel = getColorPickerPanel(fillColorButton);

    await customButton.click();

    const paletteControl = getPaletteControl(colorPickerPanel);
    const hexInput = getHexInput(colorPickerPanel);

    const value = await hexInput.inputValue();

    await paletteControl.click();

    const newValue = await hexInput.inputValue();

    expect(value).not.toEqual(newValue);
  });

  test('should pick a color when clicking on the hue control', async ({
    page,
  }) => {
    await setupWithColorPickerFunction(page);

    const start0 = { x: 100, y: 100 };
    const end0 = { x: 150, y: 200 };
    await addBasicShapeElement(page, start0, end0, Shape.Square);

    await triggerComponentToolbarAction(page, 'changeShapeFillColor');

    const fillColorButton = getColorPickerButtonWithClass(page, 'fill-color');
    const customButton = getCustomButton(fillColorButton);
    const colorPickerPanel = getColorPickerPanel(fillColorButton);

    await customButton.click();

    const hueControl = getHueControl(colorPickerPanel);
    const hexInput = getHexInput(colorPickerPanel);

    const value = await hexInput.inputValue();

    await hueControl.click();

    const newValue = await hexInput.inputValue();

    expect(value).not.toEqual(newValue);
  });

  test('should update color when changing the hex input', async ({ page }) => {
    await setupWithColorPickerFunction(page);

    const start0 = { x: 100, y: 100 };
    const end0 = { x: 150, y: 200 };
    await addBasicShapeElement(page, start0, end0, Shape.Square);

    await triggerComponentToolbarAction(page, 'changeShapeFillColor');

    const fillColorButton = getColorPickerButtonWithClass(page, 'fill-color');
    const customButton = getCustomButton(fillColorButton);
    const colorPickerPanel = getColorPickerPanel(fillColorButton);

    await customButton.click();

    const hexInput = getHexInput(colorPickerPanel);

    await hexInput.fill('fff');
    await page.keyboard.press('Enter');
    await expect(hexInput).toHaveValue('ffffff');

    await hexInput.fill('000000');
    await page.keyboard.press('Enter');
    await expect(hexInput).toHaveValue('000000');

    await hexInput.fill('fff$');
    await page.keyboard.press('Enter');
    await expect(hexInput).toHaveValue('ffffff');

    await hexInput.fill('#f0f');
    await page.keyboard.press('Enter');
    await expect(hexInput).toHaveValue('ff00ff');
  });

  test('should adjust alpha when clicking on the alpha control', async ({
    page,
  }) => {
    await setupWithColorPickerFunction(page);

    const start0 = { x: 100, y: 100 };
    const end0 = { x: 150, y: 200 };
    await addBasicShapeElement(page, start0, end0, Shape.Square);

    await triggerComponentToolbarAction(page, 'changeShapeFillColor');

    const fillColorButton = getColorPickerButtonWithClass(page, 'fill-color');
    const customButton = getCustomButton(fillColorButton);
    const colorPickerPanel = getColorPickerPanel(fillColorButton);

    await customButton.click();

    const alphaControl = getAlphaControl(colorPickerPanel);
    const alphaInput = getAlphaInput(colorPickerPanel);

    const value = await alphaInput.inputValue();

    await alphaControl.click();

    const newValue = await alphaInput.inputValue();

    expect(value).not.toEqual(newValue);
  });

  test('should adjust alpha when changing the alpha input', async ({
    page,
  }) => {
    await setupWithColorPickerFunction(page);

    const start0 = { x: 100, y: 100 };
    const end0 = { x: 150, y: 200 };
    await addBasicShapeElement(page, start0, end0, Shape.Square);

    await triggerComponentToolbarAction(page, 'changeShapeFillColor');

    const fillColorButton = getColorPickerButtonWithClass(page, 'fill-color');
    const customButton = getCustomButton(fillColorButton);
    const colorPickerPanel = getColorPickerPanel(fillColorButton);

    await customButton.click();

    const alphaInput = getAlphaInput(colorPickerPanel);

    await alphaInput.fill('101');
    await expect(alphaInput).toHaveValue('100');

    await alphaInput.fill('-1');
    await expect(alphaInput).toHaveValue('1');

    await alphaInput.pressSequentially('--1');
    await expect(alphaInput).toHaveValue('1');

    await alphaInput.pressSequentially('++1');
    await expect(alphaInput).toHaveValue('1');

    await alphaInput.pressSequentially('-+1');
    await expect(alphaInput).toHaveValue('1');

    await alphaInput.pressSequentially('+-1');
    await expect(alphaInput).toHaveValue('1');

    await alphaInput.fill('23');
    await expect(alphaInput).toHaveValue('23');
  });

  test('the computed style should be parsed correctly', async ({ page }) => {
    await setupWithColorPickerFunction(page);

    const start0 = { x: 100, y: 100 };
    const end0 = { x: 150, y: 200 };
    await addBasicShapeElement(page, start0, end0, Shape.Square);

    await triggerComponentToolbarAction(page, 'changeShapeFillColor');

    const fillColorButton = getColorPickerButtonWithClass(page, 'fill-color');
    const currentColorUnit = getCurrentColorUnitButton(fillColorButton);

    const value = await getCurrentColor(currentColorUnit);
    let rgba = parseStringToRgba(value);

    expect(rgba.a).toEqual(1);

    rgba = parseStringToRgba('rgb(25.5,0,0)');
    expect(rgba.r).toBeCloseTo(0.1);

    rgba = parseStringToRgba('rgba(233,233,233, .5)');
    expect(rgba.a).toEqual(0.5);

    rgba = parseStringToRgba('transparent');
    expect(rgba).toEqual({ r: 1, g: 1, b: 1, a: 0 });

    rgba = parseStringToRgba('--blocksuite-transparent');
    expect(rgba).toEqual({ r: 1, g: 1, b: 1, a: 0 });

    rgba = parseStringToRgba('--affine-palette-transparent');
    expect(rgba).toEqual({ r: 1, g: 1, b: 1, a: 0 });

    rgba = parseStringToRgba('#ff0');
    expect(rgba).toEqual({ r: 1, g: 1, b: 0, a: 1 });

    rgba = parseStringToRgba('#ff09');
    expect(rgba).toEqual({ r: 1, g: 1, b: 0, a: 0.6 });
  });
});

// Shapes: `fillColor`, `strokeColor` and `color`
test.describe('shapes colors', () => {
  test('should pick a color for `fillColor`', async ({ page }) => {
    await setupWithColorPickerFunction(page);
  });

  test('should pick a color for `strokeColor`', async ({ page }) => {
    await setupWithColorPickerFunction(page);
  });

  test('should pick a color for `color`', async ({ page }) => {
    await setupWithColorPickerFunction(page);
  });
});
