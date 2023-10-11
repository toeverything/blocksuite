import { dedupe, delayHide, delayShow } from './middlewares.js';
import { safeTriangle } from './safe-area.js';
import type { HoverMiddleware, WhenHoverOptions } from './types.js';

/**
 * Call the `whenHoverChange` callback when the element is hovered.
 *
 * After the mouse leaves the element, there is a 300ms delay by default.
 *
 * Note: The callback may be called multiple times when the mouse is hovering or hovering out.
 *
 * See also https://floating-ui.com/docs/useHover
 *
 * @example
 * ```ts
 * private _setReference: RefOrCallback;
 *
 * connectedCallback() {
 *   let hoverTip: HTMLElement | null = null;
 *   const { setReference, setFloating } = whenHover(isHover => {
 *     if (!isHover) {
 *       hoverTips?.remove();
 *       return;
 *     }
 *     hoverTip = document.createElement('div');
 *     document.body.append(hoverTip);
 *     setFloating(hoverTip);
 *   }, { hoverDelay: 500 });
 *   this._setReference = setReference;
 * }
 *
 * render() {
 *   return html`
 *     <div ref=${this._setReference}></div>
 *   `;
 * }
 * ```
 */
export const whenHover = (
  whenHoverChange: (isHover: boolean, event?: Event) => void,
  {
    enterDelay = 0,
    leaveDelay = 300,
    alwayRunWhenNoFloating = true,
    safeArea = false,
  }: WhenHoverOptions = {}
) => {
  /**
   * The event listener will be removed when the signal is aborted.
   */
  const abortController = new AbortController();
  let referenceElement: Element | undefined;
  let floatingElement: Element | undefined;

  const middlewares: HoverMiddleware[] = [
    dedupe(alwayRunWhenNoFloating),
    ...(safeArea
      ? [safeTriangle(typeof safeArea === 'boolean' ? undefined : safeArea)]
      : []),
    delayShow(enterDelay),
    delayHide(leaveDelay),
  ];

  let id = 0;
  let resId = 0;
  const onHoverChange = async (e: Event) => {
    const curId = id++;
    for (const middleware of middlewares) {
      const go = await middleware({
        event: e,
        floatingElement,
        referenceElement,
      });
      if (!go) {
        return;
      }
    }
    if (curId < resId)
      // ignore expired event
      return;
    resId = curId;
    if (e.type === 'mouseover') {
      whenHoverChange(true, e);
      return;
    }
    if (e.type === 'mouseleave') {
      whenHoverChange(false, e);
      return;
    }
    console.error('Unknown event type in whenHover', e);
  };

  const addHoverListener = (element?: Element) => {
    if (!element) return;
    // see https://stackoverflow.com/questions/14795099/pure-javascript-to-check-if-something-has-hover-without-setting-on-mouseover-ou
    const alreadyHover = element.matches(':hover');
    if (alreadyHover && !abortController.signal.aborted) {
      // When the element is already hovered, we need to trigger the callback manually
      onHoverChange(new MouseEvent('mouseover'));
    }
    element.addEventListener('mouseover', onHoverChange, {
      signal: abortController.signal,
    });
    element.addEventListener('mouseleave', onHoverChange, {
      signal: abortController.signal,
    });
  };
  const removeHoverListener = (element?: Element) => {
    if (!element) return;
    element.removeEventListener('mouseover', onHoverChange);
    element.removeEventListener('mouseleave', onHoverChange);
  };

  const setReference = (element?: Element) => {
    // Clean previous listeners
    removeHoverListener(referenceElement);
    addHoverListener(element);
    referenceElement = element;
  };

  const setFloating = (element?: Element) => {
    // Clean previous listeners
    removeHoverListener(floatingElement);
    addHoverListener(element);
    floatingElement = element;
  };

  return {
    setReference,
    setFloating,
    dispose: () => {
      abortController.abort();
    },
  };
};

export type { WhenHoverOptions };
