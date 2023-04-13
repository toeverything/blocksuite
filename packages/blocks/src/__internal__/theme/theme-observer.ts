import { Slot } from '@blocksuite/store';

import { capitalize, uncapitalize } from '../utils/std.js';
import type { CssVariable, CssVariableName } from './css-variables.js';
import { VARIABLES } from './css-variables.js';

function cssNameToJsName(cssName: string) {
  const upper = cssName
    .split('-')
    .filter(s => !!s)
    .map(s => capitalize(s))
    .join('');
  return uncapitalize(upper);
}

function extractCssVariables(element: Element): CssVariable {
  const styles = window.getComputedStyle(element);
  const variables = VARIABLES.reduce((acc, cssName) => {
    const value = styles.getPropertyValue(cssName);
    const name = cssNameToJsName(cssName) as CssVariableName;
    acc[name] = value;
    return acc;
  }, {} as CssVariable);
  return variables;
}

/**
 * Observer theme changing by `data-theme` property
 */
export class ThemeObserver extends Slot<CssVariable> {
  private _observer?: MutationObserver;

  private _mode = '';
  private _cssVariables: CssVariable | null = null;

  get cssVariables() {
    return this._cssVariables;
  }

  observer(element: Element) {
    this._observer?.disconnect();
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

  dispose() {
    super.dispose();
    this._observer?.disconnect();
  }
}
