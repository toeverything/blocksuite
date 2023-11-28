/* eslint-disable lit/binding-positions, lit/no-invalid-html */
import './note/edgeless-note.js';
import './image/edgeless-image.js';
import './frame/edgeless-frame.js';
import '../rects/edgeless-selected-rect.js';
import '../rects/edgeless-hover-rect.js';
import '../rects/edgeless-dragging-area-rect.js';
import '../../components/auto-connect/edgeless-index-label.js';
import '../../components/auto-connect/edgeless-auto-connect-line.js';
import '../component-toolbar/component-toolbar.js';

import { assertExists, throttle } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';
import { css, nothing } from 'lit';
import {
  customElement,
  property,
  query,
  queryAll,
  state,
} from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html, literal, unsafeStatic } from 'lit/static-html.js';

import {
  EDGELESS_BLOCK_CHILD_BORDER_WIDTH,
  EDGELESS_BLOCK_CHILD_PADDING,
} from '../../../../_common/consts.js';
import { delayCallback } from '../../../../_common/utils/event.js';
import {
  matchFlavours,
  type TopLevelBlockModel,
} from '../../../../_common/utils/index.js';
import type { SurfaceBlockComponent } from '../../../../index.js';
import type { FrameBlockModel } from '../../../../models.js';
import type { NoteBlockModel } from '../../../../note-block/index.js';
import { EdgelessBlockType } from '../../../../surface-block/edgeless-types.js';
import type { GroupElement } from '../../../../surface-block/index.js';
import {
  almostEqual,
  Bound,
  serializeXYWH,
} from '../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { NoteResizeObserver } from '../../utils/note-resize-observer.js';
import { getBackgroundGrid, isNoteBlock } from '../../utils/query.js';
import type { EdgelessSelectedRect } from '../rects/edgeless-selected-rect.js';

export type AutoConnectElement =
  | NoteBlockModel
  | FrameBlockModel
  | GroupElement;

const { NOTE, IMAGE, FRAME } = EdgelessBlockType;

export const portalMap = {
  [FRAME]: 'edgeless-block-portal-frame',
  [NOTE]: 'edgeless-block-portal-note',
  [IMAGE]: 'edgeless-block-portal-image',
};

@customElement('edgeless-block-portal-container')
export class EdgelessBlockPortalContainer extends WithDisposable(
  ShadowlessElement
) {
  static override styles = css`
    .surface-layer {
      position: absolute;
    }
  `;

  static renderPortal(
    block: TopLevelBlockModel,
    zIndex: number,
    surface: SurfaceBlockComponent,
    edgeless: EdgelessPageBlockComponent
  ) {
    const tag = literal`${unsafeStatic(
      portalMap[block.flavour as EdgelessBlockType]
    )}`;
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

  @query('.affine-block-children-container.edgeless')
  container!: HTMLDivElement;

  @query('edgeless-selected-rect')
  selectedRect!: EdgelessSelectedRect;

  @query('.affine-edgeless-layer')
  layer!: HTMLDivElement;

  @queryAll('.surface-layer')
  canvases!: HTMLCanvasElement[];

  @query('.portal-slot')
  portalSlot!: HTMLDivElement;

  @state()
  private _showAutoConnect = false;

  @state()
  private _toolbarVisible = false;

  @state()
  private _isResizing = false;

  private _cancelRestoreWillchange: (() => void) | null = null;

  private _noteResizeObserver = new NoteResizeObserver();

  private _surfaceRefReferenceSet = new Set<string>();

  private _initNoteHeightUpdate() {
    const { page } = this.edgeless;
    assertExists(page.root);

    const resetNoteResizeObserver = throttle(
      () => {
        requestAnimationFrame(() => {
          this._noteResizeObserver.resetListener(page);
        });
      },
      16,
      { leading: true }
    );

    this._disposables.add(
      page.root.childrenUpdated.on(resetNoteResizeObserver)
    );

    this._disposables.add(
      page.slots.blockUpdated.on(({ flavour }) => {
        if (flavour === NOTE) {
          resetNoteResizeObserver();
        }
      })
    );
  }

  get isDragging() {
    return this.selectedRect.dragging;
  }

  aboutToChangeViewport() {
    if (this._cancelRestoreWillchange) this._cancelRestoreWillchange();
    if (!this.layer.style.willChange)
      this.layer.style.setProperty('will-change', 'transform');

    this._cancelRestoreWillchange = delayCallback(() => {
      this.layer.style.removeProperty('will-change');
      this._cancelRestoreWillchange = null;
    }, 150);
  }

  refreshLayerViewport = () => {
    if (!this.isConnected || !this.edgeless || !this.edgeless.surface) return;

    const { surface } = this.edgeless;
    const { zoom, translateX, translateY } = surface.viewport;
    const { gap } = getBackgroundGrid(zoom, true);

    this.container.style.setProperty(
      'background-position',
      `${translateX}px ${translateY}px`
    );
    this.container.style.setProperty('background-size', `${gap}px ${gap}px`);
    this.layer.style.setProperty('transform', this._getLayerViewport());
  };

  setSlotContent(children: HTMLElement[]) {
    if (this.portalSlot.children.length !== children.length)
      this.portalSlot.replaceChildren(...children);
  }

  private _getLayerViewport(negative = false) {
    const { surface } = this.edgeless;
    const { translateX, translateY } = surface.viewport;

    return `translate(${negative ? -translateX : translateX}px, ${
      negative ? -translateY : translateY
    }px)`;
  }

  private _updateReference() {
    const { _surfaceRefReferenceSet, edgeless } = this;
    edgeless.surface.getBlocks(NOTE).forEach(note => {
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

  override firstUpdated() {
    this._updateReference();
    const { _disposables, edgeless } = this;
    const { page } = edgeless;

    this._initNoteHeightUpdate();

    requestAnimationFrame(() => {
      this._noteResizeObserver.resetListener(page);
    });

    _disposables.add(this._noteResizeObserver);

    _disposables.add(
      this._noteResizeObserver.slots.resize.on(resizedNotes => {
        resizedNotes.forEach(([domRect], id) => {
          if (page.readonly) return;

          const model = edgeless.surface.pickById(id) as NoteBlockModel;
          const { xywh } = model;
          const { x, y, w, h } = Bound.deserialize(xywh);

          // ResizeObserver is not effected by CSS transform, so don't deal with viewport zoom.
          const newModelHeight =
            domRect.height +
            EDGELESS_BLOCK_CHILD_PADDING * 2 +
            (model.hidden ? EDGELESS_BLOCK_CHILD_BORDER_WIDTH * 2 : 0);

          if (!almostEqual(newModelHeight, h)) {
            if (this.isDragging && edgeless.selectionManager.isSelected(id)) {
              edgeless.updateElementInLocal(model.id, {
                xywh: serializeXYWH(x, y, w, Math.round(newModelHeight)),
              });
            } else {
              page.updateBlock(model, {
                xywh: serializeXYWH(x, y, w, Math.round(newModelHeight)),
              });
            }
          }
        });

        edgeless.slots.selectedRectUpdated.emit({ type: 'resize' });
      })
    );

    let rAqId: number | null = null;
    _disposables.add(
      edgeless.slots.viewportUpdated.on(() => {
        this.aboutToChangeViewport();

        if (rAqId) return;

        rAqId = requestAnimationFrame(() => {
          this.refreshLayerViewport();
          rAqId = null;
        });
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
      (page.root as BaseBlockModel).childrenUpdated.on(() => {
        this.requestUpdate();
      })
    );

    _disposables.add(
      page.slots.blockUpdated.on(({ type, flavour }) => {
        if (
          (type === 'add' || type === 'delete') &&
          (flavour === 'affine:surface-ref' || flavour === NOTE)
        ) {
          requestAnimationFrame(() => {
            this._updateReference();
            this._updateAutoConnect();
          });
        }
      })
    );

    _disposables.add(
      edgeless.selectionManager.slots.updated.on(e => {
        if (e.elements.length === 0 || e.editing) {
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

    const notes = surface.getBlocks([NOTE]);
    const frames = surface.layer.frames;
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
        <div
          class="affine-edgeless-layer"
          style=${styleMap({
            transform: this._getLayerViewport(),
          })}
        >
          <edgeless-frames-container
            .surface=${surface}
            .edgeless=${edgeless}
            .frames=${frames}
          >
          </edgeless-frames-container>
          ${readonly || this._isResizing
            ? nothing
            : html`<affine-note-slicer
                .edgelessPage=${edgeless}
              ></affine-note-slicer>`}
          <div class="portal-slot"></div>
          ${layers
            .filter(layer => layer.type === 'block')
            .map(layer => {
              return repeat(
                layer.elements as TopLevelBlockModel[],
                block => block.id,
                (block, index) => {
                  const tag = unsafeStatic(
                    portalMap[block.flavour as EdgelessBlockType]
                  );
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
      ${this._isResizing
        ? nothing
        : html`
            <edgeless-hover-rect .edgeless=${edgeless}></edgeless-hover-rect>
          `}
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
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-block-portal-container': EdgelessBlockPortalContainer;
  }
}
