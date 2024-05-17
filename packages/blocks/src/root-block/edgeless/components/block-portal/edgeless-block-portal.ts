/* eslint-disable lit/binding-positions, lit/no-invalid-html */
import './note/edgeless-note.js';
import './image/edgeless-image.js';
import './bookmark/edgeless-bookmark.js';
import './attachment/edgeless-attachment.js';
import './frame/edgeless-frame.js';
import './embed/edgeless-embed.js';
import '../rects/edgeless-selected-rect.js';
import '../rects/edgeless-dragging-area-rect.js';
import '../../components/auto-connect/edgeless-index-label.js';
import '../presentation/edgeless-navigator-black-background.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { css, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html, literal, unsafeStatic } from 'lit/static-html.js';

import {
  requestConnectedFrame,
  requestThrottledConnectFrame,
} from '../../../../_common/utils/event.js';
import { type TopLevelBlockModel } from '../../../../_common/utils/index.js';
import type {
  FrameBlockModel,
  SurfaceBlockComponent,
} from '../../../../index.js';
import type { NoteBlockModel } from '../../../../note-block/index.js';
import type { GroupElementModel } from '../../../../surface-block/index.js';
import { type EdgelessBlockType } from '../../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';
import { getBackgroundGrid, isNoteBlock } from '../../utils/query.js';
import type { EdgelessSelectedRect } from '../rects/edgeless-selected-rect.js';

export type AutoConnectElement =
  | NoteBlockModel
  | FrameBlockModel
  | GroupElementModel;

const portalMap = new Map<EdgelessBlockType | RegExp, string>([
  ['affine:frame', 'edgeless-block-portal-frame'],
  ['affine:note', 'edgeless-block-portal-note'],
  ['affine:image', 'edgeless-block-portal-image'],
  ['affine:bookmark', 'edgeless-block-portal-bookmark'],
  ['affine:attachment', 'edgeless-block-portal-attachment'],
  [/affine:embed-*/, 'edgeless-block-portal-embed'],
]);

@customElement('edgeless-block-portal-container')
export class EdgelessBlockPortalContainer extends WithDisposable(
  ShadowlessElement
) {
  static override styles = css`
    .affine-block-children-container.edgeless {
      user-select: none;
    }

    .surface-layer {
      position: absolute;
    }

    .affine-edgeless-layer edgeless-frames-container {
      position: relative;
      z-index: 1;
    }
  `;

  static renderPortal(
    block: TopLevelBlockModel,
    zIndex: number,
    surface: SurfaceBlockComponent,
    edgeless: EdgelessRootBlockComponent
  ) {
    const target = Array.from(portalMap.entries()).find(([key]) => {
      if (typeof key === 'string') {
        return key === block.flavour;
      }
      return key.test(block.flavour);
    });
    assertExists(
      target,
      `Unknown block flavour for edgeless portal: ${block.flavour}`
    );

    const [_, tagName] = target;

    const tag = literal`${unsafeStatic(tagName)}`;
    return html`<${tag}
          slot="blocks"
          data-index=${block.index}
          .index=${zIndex}
          .model=${block}
          .surface=${surface}
          .edgeless=${edgeless}
          style=${styleMap({
            zIndex,
            display: 'block',
            position: 'relative',
          })}
        ></${tag}>`;
  }

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @query('.affine-block-children-container.edgeless')
  container!: HTMLDivElement;

  @query('edgeless-selected-rect')
  selectedRect!: EdgelessSelectedRect;

  @query('.affine-edgeless-layer')
  layer!: HTMLDivElement;

  @query('.canvas-slot')
  canvasSlot!: HTMLDivElement;

  @state()
  private _isResizing = false;

  @state()
  private _enableNoteSlicer = false;

  @state()
  private _slicerAnchorNote: NoteBlockModel | null = null;

  private _clearWillChangeId: null | ReturnType<typeof setTimeout> = null;

  concurrentRendering: number = 2;

  renderingSet = new Set<string>();

  get isDragging() {
    return this.selectedRect.dragging;
  }

  refreshLayerViewport = requestThrottledConnectFrame(() => {
    if (!this.edgeless || !this.edgeless.surface) return;

    const { service } = this.edgeless;
    const { zoom, translateX, translateY } = service.viewport;
    const { gap } = getBackgroundGrid(zoom, true);

    this.container.style.setProperty(
      'background-position',
      `${translateX}px ${translateY}px`
    );
    this.container.style.setProperty('background-size', `${gap}px ${gap}px`);

    this.layer.style.setProperty('transform', this._getLayerViewport());
    this.layer.dataset.scale = zoom.toString();

    this.canvasSlot.style.setProperty(
      '--canvas-transform-offset',
      this._getLayerViewport(true)
    );
  }, this);

  private _applyWillChangeProp = () => {
    if (this._clearWillChangeId) clearTimeout(this._clearWillChangeId);

    this._clearWillChangeId = setTimeout(() => {
      this.layer?.style.removeProperty('will-change');
      this._clearWillChangeId = null;
    }, 100);

    if (this.layer.style.getPropertyValue('will-change') !== 'content') {
      requestConnectedFrame(() => {
        this.layer.style.setProperty('will-change', 'content');
      }, this);
    }
  };

  setSlotContent(children: HTMLElement[]) {
    if (this.canvasSlot.children.length !== children.length) {
      children.forEach(child => {
        child.style.setProperty('transform', 'var(--canvas-transform-offset)');
      });
      this.canvasSlot.replaceChildren(...children);
    }
  }

  private _updateNoteSlicer() {
    const { edgeless } = this;
    const { elements } = edgeless.service.selection;
    if (
      !edgeless.service.selection.editing &&
      elements.length === 1 &&
      isNoteBlock(elements[0])
    ) {
      this._slicerAnchorNote = elements[0];
    } else {
      this._slicerAnchorNote = null;
    }
  }

  private _getLayerViewport(negative = false) {
    const { service } = this.edgeless;
    const { translateX, translateY, zoom } = service.viewport;

    if (negative) {
      return `scale(${1 / zoom}) translate(${-translateX}px, ${-translateY}px)`;
    }

    return `translate(${translateX}px, ${translateY}px) scale(${zoom})`;
  }

  override firstUpdated() {
    const { _disposables, edgeless } = this;

    _disposables.add(
      edgeless.service.viewport.viewportUpdated.on(() => {
        this._applyWillChangeProp();
        this.refreshLayerViewport();
      })
    );

    _disposables.add(
      edgeless.service.layer.slots.layerUpdated.on(() => {
        this.requestUpdate();
      })
    );

    _disposables.add(
      edgeless.slots.readonlyUpdated.on(() => {
        this.requestUpdate();
      })
    );

    _disposables.add(
      edgeless.service.selection.slots.updated.on(() => {
        this._enableNoteSlicer = false;
        this._updateNoteSlicer();
      })
    );

    _disposables.add(
      edgeless.slots.elementResizeStart.on(() => {
        this._isResizing = true;
      })
    );

    _disposables.add(
      edgeless.slots.elementResizeEnd.on(() => {
        this._isResizing = false;
      })
    );

    _disposables.add(
      edgeless.slots.toggleNoteSlicer.on(() => {
        this._enableNoteSlicer = !this._enableNoteSlicer;
      })
    );
  }

  override render() {
    const { edgeless } = this;
    const { surface, doc, service } = edgeless;
    const { readonly } = doc;
    const { zoom } = service.viewport;

    if (!surface) return nothing;

    const layers = service.layer.layers;

    return html`
      <div class="affine-block-children-container edgeless">
        <div
          class="affine-edgeless-layer"
          data-scale="${zoom}"
          data-translate="true"
        >
          <edgeless-frames-container
            .surface=${surface}
            .edgeless=${edgeless}
            .frames=${service.layer.frames}
          >
          </edgeless-frames-container>
          <div class="canvas-slot"></div>
          ${layers
            .filter(layer => layer.type === 'block')
            .map(layer => {
              const elements = layer.elements as TopLevelBlockModel[];

              return repeat(
                elements,
                block => block.id,
                (block, index) => {
                  const target = Array.from(portalMap.entries()).find(
                    ([key]) => {
                      if (typeof key === 'string') {
                        return key === block.flavour;
                      }
                      return key.test(block.flavour);
                    }
                  );
                  assertExists(
                    target,
                    `Unknown block flavour for edgeless portal: ${block.flavour}`
                  );

                  const [_, tagName] = target;

                  const tag = unsafeStatic(tagName);
                  const zIndex = layer.zIndex + index;

                  return html`<${tag}
                      data-index=${block.index}
                      data-portal-block-id=${block.id}
                      .index=${zIndex}
                      .model=${block}
                      .surface=${surface}
                      .edgeless=${edgeless}
                      .updatingSet=${this.renderingSet}
                      .concurrentUpdatingCount=${this.concurrentRendering}
                      style=${styleMap({
                        display: 'block',
                        zIndex,
                        position: 'relative',
                      })}
                    ></${tag}>`;
                }
              );
            })}
        </div>
      </div>
      <edgeless-dragging-area-rect
        .edgeless=${edgeless}
      ></edgeless-dragging-area-rect>

      ${readonly || this._isResizing || !this._enableNoteSlicer
        ? nothing
        : html`<note-slicer
            .edgeless=${edgeless}
            .anchorNote=${this._slicerAnchorNote}
          ></note-slicer>`}

      <edgeless-selected-rect
        .edgeless=${edgeless}
        .autoCompleteOff=${this._enableNoteSlicer}
      ></edgeless-selected-rect>

      ${!readonly
        ? html`<edgeless-index-label
            .surface=${surface}
            .edgeless=${edgeless}
          ></edgeless-index-label>`
        : nothing}

      <edgeless-navigator-black-background
        .edgeless=${edgeless}
      ></edgeless-navigator-black-background>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-block-portal-container': EdgelessBlockPortalContainer;
  }
}
