import type { DocMode } from '@blocksuite/affine-model';

import '@blocksuite/affine-shared/selection';
import { WidgetComponent } from '@blocksuite/block-std';
import {
  GfxControllerIdentifier,
  type GfxModel,
} from '@blocksuite/block-std/gfx';
import { Bound, deserializeXYWH } from '@blocksuite/global/utils';
import { computed, signal } from '@preact/signals-core';
import { cssVarV2 } from '@toeverything/theme/v2';
import { css, html, nothing, unsafeCSS } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

type Anchor = {
  id: string;
  mode: DocMode;
};

export const AFFINE_SCROLL_ANCHORING_WIDGET = 'affine-scroll-anchoring-widget';

export class AffineScrollAnchoringWidget extends WidgetComponent {
  static override styles = css`
    :host {
      pointer-events: none;
      position: absolute;
      left: 0px;
      top: 0px;
      transform-origin: left top;
      contain: size layout;
      z-index: 1;

      & .highlight {
        position: absolute;
        box-sizing: border-box;

        &.edgeless {
          border-width: 1.39px;
          border-style: solid;
          border-color: ${unsafeCSS(
            cssVarV2('layer/insideBorder/primaryBorder')
          )};
          box-shadow: var(--affine-active-shadow);
        }

        &.page {
          border-radius: 5px;
          background-color: var(--affine-hover-color);
        }
      }
    }
  `;

  #listened = false;

  #requestUpdateFn = () => this.requestUpdate();

  #resizeObserver: ResizeObserver = new ResizeObserver(this.#requestUpdateFn);

  anchor$ = signal<Anchor | null>(null);

  anchorBounds$ = signal<Bound | null>(null);

  highlighted$ = computed(() =>
    this.service.selectionManager.find('highlight')
  );

  #getBoundsInEdgeless() {
    const controller = this.std.getOptional(GfxControllerIdentifier);
    if (!controller) return;

    const bounds = this.anchorBounds$.peek();
    if (!bounds) return;

    const { x, y, w, h } = bounds;
    const zoom = controller.viewport.zoom;
    const [vx, vy] = controller.viewport.toViewCoord(x, y);

    return new Bound(vx, vy, w * zoom, h * zoom);
  }

  #getBoundsInPage(id: string) {
    const blockComponent = this.std.view.getBlock(id);
    if (!blockComponent) return;

    const container = this.offsetParent!;
    const containerRect = container.getBoundingClientRect();
    const { left, top, width, height } = blockComponent.getBoundingClientRect();

    const offsetX = containerRect.left + container.scrollLeft;
    const offsetY = containerRect.top + container.scrollTop;

    return new Bound(left - offsetX, top - offsetY, width, height);
  }

  #moveToAnchorInEdgeless(id: string) {
    const controller = this.std.getOptional(GfxControllerIdentifier);
    if (!controller) return;

    const surface = controller.surface;
    if (!surface) return;

    const xywh = controller.getElementById<GfxModel>(id)?.xywh;
    if (!xywh) {
      if (!this.#listened) return;

      // listen for document updates
      this.disposables.add(
        this.std.doc.slots.blockUpdated
          .filter(v => v.type === 'add' && v.id === id)
          .once(() => this.#moveToAnchorInEdgeless(id))
      );

      this.disposables.add(
        surface.elementAdded
          .filter(v => v.id === id && v.local === false)
          .once(() => this.#moveToAnchorInEdgeless(id))
      );
      return;
    }

    let bounds = Bound.fromXYWH(deserializeXYWH(xywh));

    const viewport = controller.viewport;
    const blockComponent = this.std.view.getBlock(id);
    const parentComponent = blockComponent?.parentComponent;
    if (parentComponent && parentComponent.flavour === 'affine:note') {
      const { left: x, width: w } = parentComponent.getBoundingClientRect();
      const { top: y, height: h } = blockComponent.getBoundingClientRect();
      const coord = viewport.toModelCoordFromClientCoord([x, y]);
      bounds = new Bound(
        coord[0],
        coord[1],
        w / viewport.zoom,
        h / viewport.zoom
      );
    }

    const { zoom, centerX, centerY } = viewport.getFitToScreenData(
      bounds,
      [20, 20, 100, 20]
    );

    viewport.setZoom(zoom);
    viewport.setCenter(centerX, centerY);

    this.#listened = false;
    this.anchorBounds$.value = bounds;
  }

  #moveToAnchorInPage(id: string) {
    const blockComponent = this.std.view.getBlock(id);
    if (!blockComponent) {
      if (!this.#listened) return;

      // listen for document updates
      this.disposables.add(
        this.std.doc.slots.blockUpdated
          .filter(v => v.type === 'add' && v.id === id)
          .once(() => this.#moveToAnchorInPage(id))
      );
      return;
    }

    // use `requestAnimationFrame` to better scroll to the target
    // because sometimes it is impossible to scroll to the target
    requestAnimationFrame(() => {
      blockComponent.scrollIntoView({
        behavior: 'instant',
        block: 'center',
      });
    });

    this.#listened = false;
    this.anchorBounds$.value = Bound.fromDOMRect(
      blockComponent.getBoundingClientRect()
    );
  }

  override connectedCallback() {
    super.connectedCallback();

    this.#resizeObserver.observe(this.offsetParent!);
    this.handleEvent('wheel', this.#requestUpdateFn);
    this.disposables.addFromEvent(window, 'resize', this.#requestUpdateFn);

    // Clears highlight
    this.disposables.addFromEvent(this.host, 'pointerdown', () => {
      this.#listened = false;
      this.anchor$.value = null;
      this.anchorBounds$.value = null;
    });

    // In edgeless
    const controler = this.std.getOptional(GfxControllerIdentifier);
    if (controler) {
      this.disposables.add(
        controler.viewport.viewportUpdated.on(this.#requestUpdateFn)
      );
    }

    this.disposables.add(
      this.anchor$.subscribe(anchor => {
        if (!anchor) return;

        const { mode, id } = anchor;

        if (mode === 'page') {
          this.#moveToAnchorInPage(id);
          return;
        }

        this.#moveToAnchorInEdgeless(id);
      })
    );

    this.disposables.add(
      this.highlighted$.subscribe(highlighted => {
        if (!highlighted) return;

        const {
          mode,
          blockIds: [bid],
          elementIds: [eid],
        } = highlighted;
        const id = mode === 'page' ? bid : eid || bid;
        if (!id) return;

        // Consumes highlight selection
        this.std.selection.clear(['highlight']);

        this.anchor$.value = { mode, id };
        this.#listened = true;
      })
    );
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#resizeObserver.disconnect();
  }

  override render() {
    const anchor = this.anchor$.value;
    if (!anchor) return nothing;

    const { mode, id } = anchor;

    const bounds =
      mode === 'page' ? this.#getBoundsInPage(id) : this.#getBoundsInEdgeless();
    if (!bounds) return nothing;

    const classes = { highlight: true, [mode]: true };
    const style = {
      left: `${bounds.x}px`,
      top: `${bounds.y}px`,
      width: `${bounds.w}px`,
      height: `${bounds.h}px`,
    };

    return html`<div
      class=${classMap(classes)}
      style=${styleMap(style)}
    ></div>`;
  }
}
