import { type Color, ColorScheme } from '@blocksuite/affine-model';
import { signal } from '@preact/signals-core';

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
  static generateColorProperty(
    color: Color,
    fallback = 'transparent',
    mode = ThemeObserver.mode
  ) {
    let result: string | undefined = undefined;

    if (typeof color === 'object') {
      result = color[mode] ?? color.normal;
    } else {
      result = color;
    }
    if (!result) {
      result = fallback;
    }
    if (result.startsWith('--')) {
      return result.endsWith(TRANSPARENT) ? TRANSPARENT : `var(${result})`;
    }

    return result ?? TRANSPARENT;
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
    real = false,
    mode = ThemeObserver.mode
  ) {
    let result: string | undefined = undefined;

    if (typeof color === 'object') {
      result = color[mode] ?? color.normal;
    } else {
      result = color;
    }
    if (!result) {
      result = fallback;
    }
    if (real && result.startsWith('--')) {
      result = result.endsWith(TRANSPARENT)
        ? TRANSPARENT
        : ThemeObserver.getPropertyValue(result);
    }

    return result ?? TRANSPARENT;
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

  static subscribe(callback: (T: ColorScheme) => void) {
    return ThemeObserver.instance.mode$.subscribe(callback);
  }

  disconnect() {
    this.#observer?.disconnect();
  }

  observe(element: HTMLElement) {
    const callback = () => {
      const mode = element.dataset.theme;
      if (!mode) return;
      if (!COLOR_SCHEMES.includes(mode)) return;
      if (mode === this.mode$.value) return;

      this.mode$.value = mode as ColorScheme;
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
