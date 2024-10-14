import type { GfxModel } from '../gfx-block-model.js';
import type { GfxCompatibleProps } from './element-model.js';

export const gfxContainerSymbol = Symbol('GfxContainerElement');

export const isGfxContainerElm = (elm: unknown): elm is GfxContainerElement => {
  if (typeof elm !== 'object' || elm === null) return false;
  return gfxContainerSymbol in elm && elm[gfxContainerSymbol] === true;
};

export interface GfxContainerElement extends GfxCompatibleProps {
  [gfxContainerSymbol]: true;
  childIds: string[];

  /**
   * ! Note that `childElements` may not match the `childIds` during doc loading stage.
   */
  childElements: GfxModel[];
  descendantElements: GfxModel[];

  addChild(element: GfxModel): void;
  removeChild(element: GfxModel): void;
  hasChild(element: GfxModel): boolean;

  hasDescendant(element: GfxModel): boolean;
}
