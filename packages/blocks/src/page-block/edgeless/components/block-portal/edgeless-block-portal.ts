/* eslint-disable lit/binding-positions, lit/no-invalid-html */
import './note/edgeless-note.js';
import './image/edgeless-image.js';
import './bookmark/edgeless-bookmark.js';
import './frame/edgeless-frame.js';
import './embed/edgeless-embed.js';
import '../rects/edgeless-selected-rect.js';
import '../rects/edgeless-dragging-area-rect.js';
import '../../components/auto-connect/edgeless-index-label.js';
import '../../components/auto-connect/edgeless-auto-connect-line.js';
import '../component-toolbar/component-toolbar.js';
import '../presentation/edgeless-navigator-black-background.js';

import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { BlockModel } from '@blocksuite/store';
import { css, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html, literal, unsafeStatic } from 'lit/static-html.js';

import {
  batchToAnimationFrame,
  requestConnectedFrame,
} from '../../../../_common/utils/event.js';
import {
  matchFlavours,
  type TopLevelBlockModel,
} from '../../../../_common/utils/index.js';
import type { SurfaceBlockComponent } from '../../../../index.js';
import type { FrameBlockModel } from '../../../../models.js';
import type { NoteBlockModel } from '../../../../note-block/index.js';
import type { GroupElement } from '../../../../surface-block/index.js';
import { type EdgelessBlockType } from '../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { getBackgroundGrid, isNoteBlock } from '../../utils/query.js';
import type { EdgelessSelectedRect } from '../rects/edgeless-selected-rect.js';

export type AutoConnectElement =
  | NoteBlockModel
  | FrameBlockModel
  | GroupElement;

const portalMap = new Map<EdgelessBlockType | RegExp, string>([
  ['affine:frame', 'edgeless-block-portal-frame'],
  ['affine:note', 'edgeless-block-portal-note'],
  ['affine:image', 'edgeless-block-portal-image'],
  ['affine:bookmark', 'edgeless-block-portal-bookmark'],
  [/affine:embed-*/, 'edgeless-block-portal-embed'],
]);

@customElement('edgeless-block-portal-container')
export class EdgelessBlockPortalContainer extends WithDisposable(
  ShadowlessElement
) {
  static override styles = css`
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
    edgeless: EdgelessPageBlockComponent
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
            position: 'relative',
          })}
        ></${tag}>`;
  }

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  frames!: FrameBlockModel[];

  @query('.affine-block-children-container.edgeless')
  container!: HTMLDivElement;

  @query('edgeless-selected-rect')
  selectedRect!: EdgelessSelectedRect;

  @query('.affine-edgeless-layer')
  layer!: HTMLDivElement;

  @query('.canvas-slot')
  canvasSlot!: HTMLDivElement;

  @state()
  private _showAutoConnect = false;

  @state()
  private _toolbarVisible = false;

  @state()
  private _isResizing = false;

  private _surfaceRefReferenceSet = new Set<string>();

  private _clearWillChangeId: null | ReturnType<typeof setTimeout> = null;

  get isDragging() {
    return this.selectedRect.dragging;
  }

  refreshLayerViewport = batchToAnimationFrame(() => {
    if (!this.edgeless || !this.edgeless.surface) return;

    const { surface } = this.edgeless;
    const { zoom, translateX, translateY } = surface.viewport;
    const { gap } = getBackgroundGrid(zoom, true);

    this.container.style.setProperty(
      'background-position',
      `${translateX}px ${translateY}px`
    );
    this.container.style.setProperty('background-size', `${gap}px ${gap}px`);
    this.layer.style.setProperty('transform', this._getLayerViewport());
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

  private _updateReference() {
    const { _surfaceRefReferenceSet, edgeless } = this;
    edgeless.surface.getBlocks('affine:note').forEach(note => {
      note.children.forEach(model => {
        if (matchFlavours(model, ['affine:surface-ref'])) {
          _surfaceRefReferenceSet.add(model.reference);
        }
      });
    });
  }

  private _updateAutoConnect() {
    const { edgeless } = this;
    const { elements } = edgeless.selectionManager;
    if (
      !edgeless.selectionManager.editing &&
      elements.length === 1 &&
      (isNoteBlock(elements[0]) ||
        this._surfaceRefReferenceSet.has(elements[0].id))
    ) {
      this._showAutoConnect = true;
    } else {
      this._showAutoConnect = false;
    }
  }

  private _getLayerViewport(negative = false) {
    const { surface } = this.edgeless;
    const { translateX, translateY, zoom } = surface.viewport;

    if (negative) {
      return `scale(${1 / zoom}) translate(${-translateX}px, ${-translateY}px)`;
    }

    return `translate(${translateX}px, ${translateY}px) scale(${zoom})`;
  }

  override firstUpdated() {
    this._updateReference();
    const { _disposables, edgeless } = this;
    const { page } = edgeless;

    _disposables.add(
      edgeless.slots.viewportUpdated.on(() => {
        this._applyWillChangeProp();
        this.refreshLayerViewport();
      })
    );

    _disposables.add(
      edgeless.surface.layer.slots.layerUpdated.on(() => {
        this.requestUpdate();
      })
    );

    _disposables.add(
      edgeless.slots.readonlyUpdated.on(() => {
        this.requestUpdate();
      })
    );

    _disposables.add(
      edgeless.surface.model.childrenUpdated.on(() => {
        this.requestUpdate();
      })
    );

    _disposables.add(
      (page.root as BlockModel).childrenUpdated.on(() => {
        this.requestUpdate();
      })
    );

    _disposables.add(
      page.slots.blockUpdated.on(({ type, flavour }) => {
        if (
          (type === 'add' || type === 'delete') &&
          (flavour === 'affine:surface-ref' || flavour === 'affine:note')
        ) {
          requestConnectedFrame(() => {
            this._updateReference();
            this._updateAutoConnect();
          }, this);
        }
      })
    );

    _disposables.add(
      edgeless.selectionManager.slots.updated.on(() => {
        const selection = edgeless.selectionManager;

        if (selection.selectedIds.length === 0 || selection.editing) {
          this._toolbarVisible = false;
        } else {
          this._toolbarVisible = true;
        }
        this._updateAutoConnect();
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
  }

  override render() {
    const { edgeless } = this;
    const { surface, page } = edgeless;
    const { readonly } = page;

    if (!surface) return nothing;

    const notes = surface.getBlocks(['affine:note']);
    const layers = surface.layer.layers;
    const autoConnectedBlocks = new Map<AutoConnectElement, number>();

    notes.forEach(note => {
      if (isNoteBlock(note) && !note.hidden) {
        autoConnectedBlocks.set(note, 1);
      }
      note.children.forEach(model => {
        if (matchFlavours(model, ['affine:surface-ref'])) {
          const reference = surface.pickById(
            model.reference
          ) as AutoConnectElement;
          if (!autoConnectedBlocks.has(reference)) {
            autoConnectedBlocks.set(reference, 1);
          } else {
            autoConnectedBlocks.set(
              reference,
              autoConnectedBlocks.get(reference)! + 1
            );
          }
        }
      });
    });

    return html`
      <div class="affine-block-children-container edgeless">
        <edgeless-auto-connect-line
          .surface=${surface}
          .show=${this._showAutoConnect}
          .elementsMap=${autoConnectedBlocks}
        >
        </edgeless-auto-connect-line>
        <div class="affine-edgeless-layer">
          <edgeless-frames-container
            .surface=${surface}
            .edgeless=${edgeless}
            .frames=${this.frames}
          >
          </edgeless-frames-container>
          ${readonly || this._isResizing
            ? nothing
            : html`<affine-note-slicer
                .edgelessPage=${edgeless}
              ></affine-note-slicer>`}
          <div class="canvas-slot"></div>
          ${layers
            .filter(layer => layer.type === 'block')
            .map(layer => {
              return repeat(
                layer.elements as TopLevelBlockModel[],
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
                  const zIndex =
                    (layer.zIndexes as [number, number])[0] + index;

                  return html`<${tag}
                      data-index=${block.index}
                      data-portal-block-id=${block.id}
                      .index=${zIndex}
                      .model=${block}
                      .surface=${surface}
                      .edgeless=${edgeless}
                      style=${styleMap({
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

      <edgeless-selected-rect
        .edgeless=${edgeless}
        .toolbarVisible=${this._toolbarVisible}
        .setToolbarVisible=${(v: boolean) => {
          this._toolbarVisible = v;
        }}
      ></edgeless-selected-rect>
      <edgeless-index-label
        .elementsMap=${autoConnectedBlocks}
        .surface=${surface}
        .edgeless=${edgeless}
        .show=${this._showAutoConnect}
      ></edgeless-index-label>
      ${this._toolbarVisible && !page.readonly
        ? html`<edgeless-component-toolbar .edgeless=${edgeless}>
          </edgeless-component-toolbar>`
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
