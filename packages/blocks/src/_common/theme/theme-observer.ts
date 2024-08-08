import { signal } from '@lit-labs/preact-signals';

import type { Color } from '../../surface-block/consts.js';

export enum ColorScheme {
  Dark = 'dark',
  Light = 'light',
}

const COLOR_SCHEMES: string[] = Object.values(ColorScheme);

const TRANSPARENT = 'transparent';

/**
 * Observer theme changing by `data-theme` property
 */
export class ThemeObserver {
  static #computedStyle: CSSStyleDeclaration;

  static #instance: ThemeObserver;

  #observer?: MutationObserver;

  mode$ = signal<ColorScheme>(ColorScheme.Light);

  // A live `CSSStyleDeclaration` object, which updates automatically when the element's styles are changed.
  static get computedStyle() {
    let computedStyle = ThemeObserver.#computedStyle;
    if (!computedStyle) {
      computedStyle = window.getComputedStyle(document.documentElement);
      ThemeObserver.#computedStyle = computedStyle;
    }
    return computedStyle;
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
  static generateColorProperty(color: Color, fallback = 'transparent') {
    fallback = fallback.startsWith('--')
      ? fallback.endsWith(TRANSPARENT)
        ? TRANSPARENT
        : `var(${fallback})`
      : fallback;

    if (typeof color === 'string') {
      return (
        (color.startsWith('--')
          ? color.endsWith(TRANSPARENT)
            ? TRANSPARENT
            : `var(${color})`
          : color) ?? fallback
      );
    }

    if (!color) {
      return fallback;
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
   * @param fallback - If color value processing fails, it will be used as a fallback.
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
  static getColorValue(
    color: Color,
    fallback = TRANSPARENT,
    real?: boolean,
    mode = ThemeObserver.mode,
    getPropertyValue = ThemeObserver.getPropertyValue
  ) {
    if (typeof color === 'object') {
      color = color[mode] ?? color.normal ?? fallback;
    }
    if (!color) {
      color = fallback ?? TRANSPARENT;
    }
    if (real && color.startsWith('--')) {
      color = color.endsWith(TRANSPARENT)
        ? TRANSPARENT
        : getPropertyValue(color);

      if (!color) {
        color = fallback.startsWith('--')
          ? getPropertyValue(fallback)
          : fallback;
      }
    }

    return color;
  }

  static getPropertyValue(property: string) {
    if (property.startsWith('--')) {
      if (property.endsWith(TRANSPARENT)) {
        return TRANSPARENT;
      }
      return (
        ThemeObserver.computedStyle.getPropertyValue(property).trim() ||
        property
      );
    }
    return property;
  }

  static get instance(): ThemeObserver {
    if (!ThemeObserver.#instance) {
      const instance = new ThemeObserver();
      instance.observe(document.documentElement);
      ThemeObserver.#instance = instance;
    }

    return ThemeObserver.#instance;
  }

  static get mode() {
    return ThemeObserver.instance.mode$.peek();
  }

  static subscribe(callback: (T: ColorScheme) => void) {
    return ThemeObserver.instance.mode$.subscribe(callback);
  }

  disconnect() {
    this.#observer?.disconnect();
  }

  observe(element: HTMLElement) {
    const callback = () => {
      const mode = element.dataset.theme;
      if (mode && COLOR_SCHEMES.includes(mode) && this.mode$.peek() !== mode) {
        this.mode$.value = mode as ColorScheme;
      }
    };

    this.#observer?.disconnect();
    this.#observer = new MutationObserver(callback);
    this.#observer.observe(element, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    callback();
  }
}
