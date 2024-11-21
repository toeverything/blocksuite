import type { GfxCompatibleInterface } from '../base.js';
import type { GfxModel } from '../model.js';

/**
 * The symbol to mark a model as a container.
 */
export const gfxContainerSymbol = Symbol('GfxContainerElement');

/**
 * Check if the element is a container element.
 */
export const isGfxContainerElm = (elm: unknown): elm is GfxContainerElement => {
  if (typeof elm !== 'object' || elm === null) return false;
  return gfxContainerSymbol in elm && elm[gfxContainerSymbol] === true;
};

/**
 * GfxContainerElement is a model that can contain other models.
 * It just like a group that in common graphic software.
 */
export interface GfxContainerElement extends GfxCompatibleInterface {
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
