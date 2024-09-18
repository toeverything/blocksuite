import type { DocMode } from '@blocksuite/affine-model';

import { HighlightSelection } from '@blocksuite/affine-shared/selection';
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

  #requestUpdateFn = () => this.requestUpdate();

  #resizeObserver: ResizeObserver = new ResizeObserver(this.#requestUpdateFn);

  anchor = signal<{ mode: DocMode; id: string } | null>(null);

  anchorBounds = signal<Bound | null>(null);

  highlighted = computed(() => this.service.selectionManager.find('highlight'));

  #getBoundsInEdgeless() {
    const controller = this.std.getOptional(GfxControllerIdentifier);
    if (!controller) return;

    const bounds = this.anchorBounds.peek();
    if (!bounds) return;

    const { x, y, w, h } = bounds;
    const zoom = controller.viewport.zoom;
    const [vx, vy] = controller.viewport.toViewCoord(x, y);

    return new Bound(vx, vy, w * zoom, h * zoom);
  }

  #getBoundsInPage(id: string) {
    const blockComponent = this.std.view.getBlock(id);
    if (!blockComponent) return;

    const { left, top, width, height } = blockComponent.getBoundingClientRect();
    const container = this.offsetParent;
    const containerRect = container?.getBoundingClientRect();

    const offsetX = (containerRect?.left ?? 0) + (container?.scrollLeft ?? 0);
    const offsetY = (containerRect?.top ?? 0) + (container?.scrollTop ?? 0);

    return new Bound(left - offsetX, top - offsetY, width, height);
  }

  #moveToAnchorInEdgeless(id: string) {
    const controller = this.std.getOptional(GfxControllerIdentifier);
    if (!controller) return;

    const model = controller.getElementById<GfxModel>(id);
    if (!model) return;

    const xywh = model.xywh;
    if (!xywh) return;

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

    viewport.setCenter(centerX, centerY);
    viewport.setZoom(zoom);

    this.anchorBounds.value = bounds;
  }

  #moveToAnchorInPage(id: string) {
    const blockComponent = this.std.view.getBlock(id);
    if (!blockComponent) return;

    blockComponent.scrollIntoView({
      behavior: 'instant',
      block: 'center',
    });

    this.anchorBounds.value = Bound.fromDOMRect(
      blockComponent.getBoundingClientRect()
    );
  }

  override connectedCallback() {
    super.connectedCallback();

    this.std.selection.register(HighlightSelection);

    this.#resizeObserver.observe(this.offsetParent!);
    this.handleEvent('wheel', this.#requestUpdateFn);
    this.disposables.addFromEvent(window, 'resize', this.#requestUpdateFn);

    // Clears highlight
    this.disposables.addFromEvent(this.host, 'pointerdown', () => {
      this.anchor.value = null;
      this.anchorBounds.value = null;
    });

    // In edgeless
    const controler = this.std.getOptional(GfxControllerIdentifier);
    if (controler) {
      this.disposables.add(
        controler.viewport.viewportUpdated.on(this.#requestUpdateFn)
      );
    }

    this.disposables.add(
      this.anchor.subscribe(anchor => {
        if (!anchor) return;

        requestAnimationFrame(() => {
          const { mode, id } = anchor;

          if (mode === 'edgeless') {
            this.#moveToAnchorInEdgeless(id);
            return;
          }

          this.#moveToAnchorInPage(id);
        });
      })
    );

    this.disposables.add(
      this.highlighted.subscribe(highlighted => {
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

        this.anchor.value = { mode, id };
      })
    );
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#resizeObserver.disconnect();
  }

  override render() {
    const anchor = this.anchor.value;
    if (!anchor) return nothing;

    const { mode, id } = anchor;

    const bounds =
      mode === 'edgeless'
        ? this.#getBoundsInEdgeless()
        : this.#getBoundsInPage(id);
    if (!bounds) return;

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
