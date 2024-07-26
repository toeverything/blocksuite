import { Slot } from '@blocksuite/global/utils';

import type { CustomColor } from '../../surface-block/consts.js';
import type { CssVariablesMap } from './css-variables.js';

import { StyleVariables, isCssVariable } from './css-variables.js';

export enum ColorScheme {
  Dark = 'dark',
  Light = 'light',
  Normal = 'normal',
}

export function extractCssVariables(element: Element): CssVariablesMap {
  const styles = window.getComputedStyle(element);
  const variables = StyleVariables.reduce((acc, cssName) => {
    const value = styles.getPropertyValue(cssName).trim();
    acc[cssName] = value;

    // --affine-palette-transparent: special values added for the sake of logical consistency.
    if (cssName === '--affine-palette-transparent' && !value) {
      acc[cssName] = '#00000000';
    }

    return acc;
  }, {} as CssVariablesMap);
  return variables;
}

/**
 * Observer theme changing by `data-theme` property
 */
export class ThemeObserver extends Slot<CssVariablesMap> {
  private _cssVariables: CssVariablesMap | null = null;

  private _mode: ColorScheme = ColorScheme.Normal;

  private _observer?: MutationObserver;

  override dispose() {
    super.dispose();
    this._observer?.disconnect();
  }

  /**
   * Generates a CSS's color property with `var` or `light-dark` functions.
   *
   * Sometimes used to set the frame/note background.
   *
   * @param color - A color value.
   * @param fallback  - If color value processing fails, it will be used as a fallback.
   * @returns - A color property string.
   *
   * @example
   *
   * ```
   * `rgba(255,0,0)`
   * `#fff`
   * `light-dark(#fff, #000)`
   * `var(--affine-palette-shape-blue)`
   * ```
   */
  generateColorProperty(color: string | CustomColor, fallback = 'transparent') {
    fallback = fallback.startsWith('--') ? `var(${fallback})` : fallback;

    if (typeof color === 'string') {
      return color.startsWith('--') ? `var(${color})` : color ?? fallback;
    }

    if (color.light && color.dark) {
      return `light-dark(${color.light}, ${color.dark})`;
    }

    return color.normal ?? fallback;
  }

  /**
   * Gets a color with the current theme.
   *
   * @param color - A color value.
   * @param fallback  - If color value processing fails, it will be used as a fallback.
   * @param real - If true, it returns the computed style.
   * @returns - A color property string.
   *
   * @example
   *
   * ```
   * `rgba(255,0,0)`
   * `#fff`
   * `--affine-palette-shape-blue`
   * ```
   */
  getColor(
    color: string | CustomColor,
    fallback = '--affine-palette-transparent',
    real?: boolean
  ) {
    color =
      (typeof color === 'string'
        ? color
        : color[this.mode] ?? color['normal']) ??
      fallback ??
      'transparent';
    return real ? this.getVariableValue(color) : color;
  }

  getVariableValue(variable: string) {
    if (isCssVariable(variable)) {
      const value = this._cssVariables?.[variable];

      if (value === undefined) {
        console.error(new Error(`Cannot find css variable: ${variable}`));
      } else {
        return value;
      }
    }

    return variable;
  }

  observe(element: HTMLElement) {
    const callback = () => {
      const mode = element.dataset.theme;
      if (mode && this._mode !== mode) {
        this._mode = mode as ColorScheme;
        this._cssVariables = extractCssVariables(element);
        this.emit(this._cssVariables);
      }
    };

    this._observer?.disconnect();
    this._observer = new MutationObserver(callback);
    this._observer.observe(element, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    callback();
  }

  get cssVariables() {
    return this._cssVariables;
  }

  get mode() {
    return this._mode;
  }
}
