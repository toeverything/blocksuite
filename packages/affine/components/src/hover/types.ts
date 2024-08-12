import type { StyleInfo } from 'lit/directives/style-map.js';

import type {
  SafeBridgeOptions,
  SafeTriangleOptions,
} from './middlewares/safe-area.js';

export type WhenHoverOptions = {
  enterDelay?: number;
  leaveDelay?: number;
  /**
   * When already hovered to the reference element,
   * but the floating element is not ready,
   * the callback will still be executed if the `alwayRunWhenNoFloating` is true.
   *
   * It is useful when the floating element is removed just before by a user's action,
   * and the user's mouse is still hovering over the reference element.
   *
   * @default true
   */
  alwayRunWhenNoFloating?: boolean;
  safeTriangle?: boolean | SafeTriangleOptions;
  /**
   * Create a virtual rectangular bridge between the reference element and the floating element.
   */
  safeBridge?: boolean | SafeBridgeOptions;
};

export type HoverMiddleware = (ctx: {
  event: Event;
  referenceElement?: Element;
  floatingElement?: Element;
}) => boolean | Promise<boolean>;

export type HoverOptions = {
  /**
   * Transition style when the portal is shown or hidden.
   */
  transition: {
    /**
     * Specifies the length of the transition in ms.
     *
     * You only need to specify the transition end duration actually.
     *
     * ---
     *
     * Why is the duration required?
     *
     * The transition event is not reliable, and it may not be triggered in some cases.
     *
     * See also https://github.com/w3c/csswg-drafts/issues/3043 https://github.com/toeverything/blocksuite/pull/7248/files#r1631375330
     *
     * Take a look at solutions from other projects: https://floating-ui.com/docs/useTransition#duration
     */
    duration: number;
    in: StyleInfo;
    out: StyleInfo;
  } | null;
  /**
   * Set the portal as hover element automatically.
   * @default true
   */
  setPortalAsFloating: boolean;
  allowMultiple?: boolean;
} & WhenHoverOptions;
