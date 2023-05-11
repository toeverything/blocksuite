import { Slot } from '@blocksuite/store';

import type { CssVariablesMap } from './css-variables.js';
import { VARIABLES } from './css-variables.js';

export function extractCssVariables(element: Element): CssVariablesMap {
  const styles = window.getComputedStyle(element);
  const variables = VARIABLES.reduce((acc, cssName) => {
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
  private _observer?: MutationObserver;

  private _mode = '';
  private _cssVariables: CssVariablesMap | null = null;

  get cssVariables() {
    return this._cssVariables;
  }

  observer(element: Element) {
    this._observer?.disconnect();
    this._cssVariables = extractCssVariables(element);
    this._observer = new MutationObserver(() => {
      const mode = element.getAttribute('data-theme');
      if (this._mode !== mode) {
        this._cssVariables = extractCssVariables(element);
        this.emit(this._cssVariables);
      }
    });
    this._observer.observe(element, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  }

  override dispose() {
    super.dispose();
    this._observer?.disconnect();
  }
}
