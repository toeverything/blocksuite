import { DisposableGroup } from '@blocksuite/global/utils';
import { css, html, LitElement } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import { requestConnectedFrame } from '../../../../../_common/utils/event.js';

/**
 * A scrollbar that is only visible when the user is interacting with it.
 * Append this element to the a container that has a scrollable element. Which means
 * the scrollable element should lay on the same level as the overlay-scrollbar.
 *
 * And the scrollable element should have a `data-scrollable` attribute.
 *
 * Example:
 * ```
 * <div class="container">
 *    <div class="scrollable-element-with-fixed-height" data-scrollable>
 *       <!--.... very long content ....-->
 *    </div>
 *    <overlay-scrollbar></overlay-scrollbar>
 * </div>
 * ```
 *
 * Note:
 * - It only works with vertical scrollbars.
 */
@customElement('overlay-scrollbar')
export class OverlayScrollbar extends LitElement {
  static override styles = css`
    :host {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 10px;
      opacity: 0;
      transition: opacity 0.3s;
    }

    .overlay-handle {
      position: absolute;
      top: 0;
      left: 2px;
      background-color: rgba(0, 0, 0, 0.44);
      border-radius: 3px;
      width: 6px;
    }
  `;

  @query('.overlay-handle')
  private _handle!: HTMLDivElement;

  private _disposable = new DisposableGroup();

  override firstUpdated(): void {
    this._initScrollbar();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._disposable.dispose();
  }

  private _setHandleHeight(clientHeight: number, scrollHeight: number) {
    this._handle.style.height = `${(clientHeight / scrollHeight) * 100}%`;
  }

  private _showScrollbar(top: number, scrollHeight: number) {
    this.style.opacity = '1';
    this._handle.style.top = `${(top / scrollHeight) * 100}%`;
  }

  private _initScrollbar() {
    const container = this.parentElement as HTMLElement;

    container.style.contain = 'layout';
    container.style.overflow = 'hidden';

    let firstEvent = true;
    let timeoutId: null | ReturnType<typeof setTimeout> = null;
    const resetFirstEvent = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        firstEvent = true;
        timeoutId = null;
      }, 50);
    };

    let hideScrollbarTimeout: null | ReturnType<typeof setTimeout> = null;
    const showScrollbar = (top: number, height: number) => {
      requestConnectedFrame(() => {
        this._showScrollbar(top, height);
      });

      if (hideScrollbarTimeout) clearTimeout(hideScrollbarTimeout);
      hideScrollbarTimeout = setTimeout(() => {
        this.style.opacity = '0';
        hideScrollbarTimeout = null;
      }, 800);
    };

    let scrollable: HTMLElement | null = null;
    this._disposable.addFromEvent(container, 'wheel', event => {
      scrollable = scrollable?.isConnected
        ? scrollable
        : (container.querySelector('[data-scrollable]') as HTMLElement);

      if (!scrollable) return;

      // firefox may report a wheel event with deltaMode of value other than 0
      // we just simply multiply it by 16 which is common default line height to get the correct value
      const scrollDistance =
        event.deltaMode === 0 ? event.deltaY : event.deltaY * 16;

      if (!firstEvent) {
        scrollable.scrollBy({
          left: 0,
          top: scrollDistance,
          behavior: 'instant',
        });
        showScrollbar(scrollable.scrollTop, scrollable.scrollHeight);
      }

      if (firstEvent) {
        this._setHandleHeight(scrollable.clientHeight, scrollable.scrollHeight);
        firstEvent = false;
        resetFirstEvent();
      }
    });
  }

  override render() {
    return html`<div class="overlay-handle"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'overlay-scrollbar': OverlayScrollbar;
  }
}
