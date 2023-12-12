import { assertExists } from '@blocksuite/global/utils';

import type { CssVariableName, CssVariablesMap } from './css-variables.js';
import type { ThemeObserver } from './theme-observer.js';

function getClosestEditorContainer(element: Element) {
  const container = element.closest(
    'affine-editor-container'
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
