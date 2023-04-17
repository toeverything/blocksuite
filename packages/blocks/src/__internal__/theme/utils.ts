import { assertExists } from '@blocksuite/store';

import { capitalize, uncapitalize } from '../utils/std.js';
import type { CssVariableName, CssVariablesMap } from './css-variables.js';
import type { ThemeObserver } from './theme-observer.js';

/**
 * Usage:
 * cssNameToJsName('--affine-theme-mode');  // affineThemeMode
 */
export function cssNameToJsName(cssName: string) {
  const upper = cssName
    .split('-')
    .filter(s => !!s)
    .map(s => capitalize(s))
    .join('');
  return uncapitalize(upper);
}

function getClosestEditorContainer(element: Element) {
  const container = element.closest(
    'editor-container'
  ) as unknown as Element & {
    themeObserver: ThemeObserver;
  };
  assertExists(container);
  return container;
}

export function listenToThemeChange(
  currentELement: Element,
  callback: (cssVariables: CssVariablesMap) => void
) {
  const container = getClosestEditorContainer(currentELement);
  return container.themeObserver.on(callback);
}

export function getThemePropertyValue(
  currentELement: Element,
  name: CssVariableName
) {
  const container = getClosestEditorContainer(currentELement);
  return container.themeObserver.cssVariables?.[name];
}
