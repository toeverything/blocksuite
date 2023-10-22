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
