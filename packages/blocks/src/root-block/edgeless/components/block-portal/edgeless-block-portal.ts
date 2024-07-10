/* eslint-disable lit/binding-positions, lit/no-invalid-html */
import './note/edgeless-note.js';
import './image/edgeless-image.js';
import './bookmark/edgeless-bookmark.js';
import './attachment/edgeless-attachment.js';
import './frame/edgeless-frame.js';
import './embed/edgeless-embed.js';
import './edgeless-text/edgeless-edgeless-text.js';
import '../rects/edgeless-selected-rect.js';
import '../rects/edgeless-dragging-area-rect.js';
import '../presentation/edgeless-navigator-black-background.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { css, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html, literal, unsafeStatic } from 'lit/static-html.js';

import { requestThrottledConnectFrame } from '../../../../_common/utils/event.js';
import { last } from '../../../../_common/utils/iterable.js';
import type { FrameBlockModel } from '../../../../frame-block/frame-model.js';
import type { NoteBlockModel } from '../../../../note-block/index.js';
import type { GroupElementModel } from '../../../../surface-block/index.js';
import type { BlockLayer } from '../../../../surface-block/managers/layer-manager.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';
import { EdgelessBlockModel } from '../../edgeless-block-model.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';
import { getBackgroundGrid, isNoteBlock } from '../../utils/query.js';
import type { EdgelessSelectedRect } from '../rects/edgeless-selected-rect.js';
import type { EdgelessPortalBase } from './edgeless-portal-base.js';

export type AutoConnectElement =
  | NoteBlockModel
  | FrameBlockModel
  | GroupElementModel;

const portalMap = new Map<BlockSuite.EdgelessModelKeyType | RegExp, string>([
  ['affine:frame', 'edgeless-block-portal-frame'],
  ['affine:note', 'edgeless-block-portal-note'],
  ['affine:image', 'edgeless-block-portal-image'],
  ['affine:bookmark', 'edgeless-block-portal-bookmark'],
  ['affine:attachment', 'edgeless-block-portal-attachment'],
  ['affine:edgeless-text', 'edgeless-block-portal-edgeless-text'],
  [/affine:embed-*/, 'edgeless-block-portal-embed'],
]);

@customElement('edgeless-block-portal-container')
export class EdgelessBlockPortalContainer extends WithDisposable(
  ShadowlessElement
) {
  get isDragging() {
    return this.selectedRect.dragging;
  }

  static override styles = css`
    .affine-block-children-container.edgeless {
      user-select: none;
    }

    .surface-layer {
      position: absolute;
    }

    .affine-edgeless-layer > [data-portal-block-id] {
      display: none;
      position: relative;
    }
  `;

  @state()
  private accessor _isResizing = false;

  @state()
  private accessor _enableNoteSlicer = false;

  @state()
  private accessor _slicerAnchorNote: NoteBlockModel | null = null;

  private _visibleElements = new Set<EdgelessBlockModel>();

  private _updateOnVisibleBlocksChange = requestThrottledConnectFrame(() => {
    if (this._updateVisibleBlocks()) {
      this.requestUpdate();
    }
  }, this);

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @query('.affine-block-children-container.edgeless')
  accessor container!: HTMLDivElement;

  @query('edgeless-selected-rect')
  accessor selectedRect!: EdgelessSelectedRect;

  @query('.affine-edgeless-layer')
  accessor layer!: HTMLDivElement;

  @query('.canvas-slot')
  accessor canvasSlot!: HTMLDivElement;

  concurrentRendering: number = 2;

  renderingSet = new Set<string>();

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

  /**
   * @returns true if the visible elements have changed
   */
  private _updateVisibleBlocks() {
    const { service } = this.edgeless;
    const blockSet = service.layer.blocksGrid.search(
      service.viewport.viewportBounds,
      false,
      true
    );
    const frameSet = service.layer.framesGrid.search(
      service.viewport.viewportBounds,
      false,
      true
    );

    if (this._visibleElements.size !== blockSet.size + frameSet.size) {
      this._visibleElements = new Set([...blockSet, ...frameSet]);
      return true;
    } else {
      for (const element of this._visibleElements) {
        if (
          !blockSet.has(element) &&
          !frameSet.has(element as FrameBlockModel)
        ) {
          this._visibleElements = new Set([...blockSet, ...frameSet]);
          return true;
        }
      }
    }

    return false;
  }

  private _updateNoteSlicer() {
    const { edgeless } = this;
    const { selectedElements } = edgeless.service.selection;
    if (
      !edgeless.service.selection.editing &&
      selectedElements.length === 1 &&
      isNoteBlock(selectedElements[0])
    ) {
      this._slicerAnchorNote = selectedElements[0];
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

  setSlotContent(children: HTMLElement[]) {
    if (this.canvasSlot.children.length !== children.length) {
      children.forEach(child => {
        child.style.setProperty('transform', 'var(--canvas-transform-offset)');
      });
      this.canvasSlot.replaceChildren(...children);
    }
  }

  getPortalElement(id: string) {
    return this.querySelector(
      `[data-portal-block-id="${id}"]`
    ) as EdgelessPortalBase<BlockSuite.EdgelessBlockModelType> | null;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._updateVisibleBlocks();
  }

  override firstUpdated() {
    const { _disposables, edgeless } = this;

    _disposables.add(
      edgeless.service.viewport.viewportUpdated.on(() => {
        this.refreshLayerViewport();
        this._updateOnVisibleBlocksChange();
      })
    );

    _disposables.add(
      edgeless.service.layer.slots.layerUpdated.on(() => {
        this.requestUpdate();
      })
    );

    _disposables.add(
      edgeless.doc.slots.blockUpdated.on(payload => {
        if (
          (payload.type === 'update' && payload.props.key === 'xywh') ||
          payload.type === 'add'
        ) {
          const block = edgeless.doc.getBlock(payload.id);

          if (block?.model instanceof EdgelessBlockModel) {
            this._updateOnVisibleBlocksChange();
          }
        } else {
          if (
            'model' in payload &&
            payload.model instanceof EdgelessBlockModel
          ) {
            this._updateOnVisibleBlocksChange();
          }
        }
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
    const { edgeless, _visibleElements } = this;
    const { surface, doc, service } = edgeless;
    const { readonly } = doc;
    const { zoom } = service.viewport;

    if (!surface) return nothing;

    const layers = service.layer.layers;
    const lastLayer = last(layers);
    const frameStartIndex =
      lastLayer?.zIndex ?? 1 + (lastLayer?.elements.length ?? 0) + 1;
    const blocks = layers.reduce(
      (pre, layer) => {
        if (layer.type === 'block') {
          pre = pre.concat(
            layer.elements.map((block, index) => [block, layer, index])
          );
        }

        return pre;
      },
      [] as [EdgelessBlockModel, BlockLayer, number][]
    );

    return html`
      <div class="affine-block-children-container edgeless">
        <div
          class="affine-edgeless-layer"
          data-scale="${zoom}"
          data-translate="true"
        >
          <div class="canvas-slot"></div>
          ${repeat(
            blocks,
            block => block[0].id,
            ([block, layer, index]) => {
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
              const tag = unsafeStatic(tagName);

              return html`<${tag}
                      data-index=${block.index}
                      data-portal-block-id=${block.id}
                      .index=${layer.zIndex + index}
                      .model=${block}
                      .surface=${surface}
                      .edgeless=${edgeless}
                      .updatingSet=${this.renderingSet}
                      .concurrentUpdatingCount=${this.concurrentRendering}
                      .portalContainer=${this}
                      style=${`z-index: ${layer.zIndex + index};${_visibleElements.has(block) ? 'display:block' : ''}`}
                    ></${tag}>`;
            }
          )}
          <edgeless-frames-container
            .edgeless=${edgeless}
            .frames=${service.layer.frames}
            .startIndex=${frameStartIndex}
            .visibleFrames=${this._visibleElements}
          >
          </edgeless-frames-container>
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

      <edgeless-navigator-black-background
        .edgeless=${edgeless}
      ></edgeless-navigator-black-background>
    `;
  }

  static renderPortal(
    block: BlockSuite.EdgelessBlockModelType,
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
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-block-portal-container': EdgelessBlockPortalContainer;
  }
}
