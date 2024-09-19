import type { MindmapStyle } from '@blocksuite/affine-model';
import type { BlockStdScope } from '@blocksuite/block-std';
import type { Bound } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';

import { toast } from '@blocksuite/affine-components/toast';
import {
  EditPropsStore,
  TelemetryProvider,
} from '@blocksuite/affine-shared/services';
import { modelContext, stdContext } from '@blocksuite/block-std';
import { ErrorCode } from '@blocksuite/global/exceptions';
import { SignalWatcher } from '@blocksuite/global/utils';
import { consume } from '@lit/context';
import { computed } from '@preact/signals-core';
import { css, html, LitElement, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { EdgelessRootBlockComponent } from '../../../index.js';

import { getTooltipWithShortcut } from '../../utils.js';
import { EdgelessDraggableElementController } from '../common/draggable/draggable-element.controller.js';
import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';
import { getMindMaps, type ToolbarMindmapItem } from './assets.js';
import { textRender } from './basket-elements.js';
import { importMindMapIcon, textIcon } from './icons.js';
import { MindMapPlaceholder } from './mindmap-importing-placeholder.js';

type TextItem = {
  type: 'text';
  icon: TemplateResult;
  render: typeof textRender;
};

type ImportItem = {
  type: 'import';
  icon: TemplateResult;
};

const textItem: TextItem = { type: 'text', icon: textIcon, render: textRender };

export class EdgelessMindmapMenu extends EdgelessToolbarToolMixin(
  SignalWatcher(LitElement)
) {
  static override styles = css`
    :host {
      display: flex;
      z-index: -1;
      justify-content: flex-end;
    }
    .text-and-mindmap {
      display: flex;
      gap: 10px;
      padding: 8px 0px;
      box-sizing: border-box;
    }
    .thin-divider {
      width: 1px;
      transform: scaleX(0.5);
      height: 48px;
      background: var(--affine-border-color);
    }
    .text-item {
      width: 60px;
    }
    .mindmap-item {
      width: 64px;
    }

    .text-item,
    .mindmap-item {
      border-radius: 4px;
      height: 48px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .text-item > button,
    .mindmap-item > button {
      position: absolute;
      border-radius: inherit;
      border: none;
      background: none;
      cursor: grab;
      padding: 0;
    }
    .text-item:hover,
    .mindmap-item[data-is-active='true'],
    .mindmap-item:hover {
      background: var(--affine-hover-color);
    }
    .text-item > button.next,
    .mindmap-item > button.next {
      transition: transform 0.3s ease-in-out;
    }
  `;

  private _style$ = computed(() => {
    const { style } =
      this.edgeless.std.get(EditPropsStore).lastProps$.value.mindmap;
    return style;
  });

  draggableController!: EdgelessDraggableElementController<
    ToolbarMindmapItem | TextItem | ImportItem
  >;

  override type = 'mindmap' as const;

  private get _rootBlock(): EdgelessRootBlockComponent {
    return this.std.view.getBlock(this.model.id) as EdgelessRootBlockComponent;
  }

  get mindMaps() {
    return getMindMaps(this.theme);
  }

  private _importMindMapEntry() {
    const { draggingElement } = this.draggableController?.states || {};
    const isBeingDragged = draggingElement?.data.type === 'import';

    return html`<div class="mindmap-item">
      <button
        style="opacity: ${isBeingDragged ? 0 : 1}"
        class="next"
        @mousedown=${(e: MouseEvent) => {
          this.draggableController.onMouseDown(e, {
            preview: importMindMapIcon,
            data: {
              type: 'import',
              icon: importMindMapIcon,
            },
            standardWidth: 350,
          });
        }}
        @touchstart=${(e: TouchEvent) => {
          this.draggableController.onTouchStart(e, {
            preview: importMindMapIcon,
            data: {
              type: 'import',
              icon: importMindMapIcon,
            },
            standardWidth: 350,
          });
        }}
        @click=${() => {
          this.draggableController.cancel();
          const viewportBound = this._rootBlock.service.viewport.viewportBounds;

          viewportBound.x += viewportBound.w / 2;
          viewportBound.y += viewportBound.h / 2;

          this._onImportMindMap(viewportBound);
        }}
      >
        ${importMindMapIcon}
      </button>
      <affine-tooltip tip-position="top" .offset=${12}>
        ${getTooltipWithShortcut('Support import of FreeMind,OPML.')}
      </affine-tooltip>
    </div>`;
  }

  private _onImportMindMap(bound: Bound) {
    const edgelessBlock = this._rootBlock;
    if (!edgelessBlock) return;

    const placeholder = new MindMapPlaceholder();

    placeholder.style.position = 'absolute';
    placeholder.style.left = `${bound.x}px`;
    placeholder.style.top = `${bound.y}px`;

    edgelessBlock.gfxViewportElm.append(placeholder);

    this.onImportMindMap?.(bound)
      .then(() => {
        this.std.get(TelemetryProvider)?.track('CanvasElementAdded', {
          page: 'whiteboard editor',
          type: 'imported mind map',
          other: 'success',
          module: 'toolbar',
        });
      })
      .catch(e => {
        if (e.code === ErrorCode.UserAbortError) return;
        this.std.get(TelemetryProvider)?.track('CanvasElementAdded', {
          page: 'whiteboard editor',
          type: 'imported mind map',
          other: 'failed',
          module: 'toolbar',
        });
        toast(this.edgeless.host, 'Import failed, please try again');
        console.error(e);
      })
      .finally(() => {
        placeholder.remove();
      });
  }

  initDragController() {
    if (this.draggableController || !this.edgeless) return;
    this.draggableController = new EdgelessDraggableElementController(this, {
      service: this.edgeless.service,
      edgeless: this.edgeless,
      scopeElement: this,
      clickToDrag: true,
      onOverlayCreated: (_layer, element) => {
        if (element.data.type === 'mindmap') {
          this.onActiveStyleChange?.(element.data.style);
        }
        // a workaround to active mindmap, so that menu cannot be closed by `Escape`
        this.setEdgelessTool({ type: 'mindmap' });
      },
      onDrop: (element, bound) => {
        if ('render' in element.data) {
          const id = element.data.render(
            bound,
            this.edgeless.service,
            this.edgeless
          );
          if (element.data.type === 'mindmap') {
            this.onActiveStyleChange?.(element.data.style);
            this.setEdgelessTool(
              { type: 'default' },
              { elements: [id], editing: false }
            );
          } else if (element.data.type === 'text') {
            this.setEdgelessTool({ type: 'default' });
          }
        }

        if (element.data.type === 'import') {
          this._onImportMindMap?.(bound);
        }
      },
    });
  }

  override render() {
    const { cancelled, draggingElement, dragOut } =
      this.draggableController?.states || {};

    const isDraggingText = draggingElement?.data?.type === 'text';
    const showNextText = dragOut && !cancelled;
    return html`<edgeless-slide-menu .height=${'64px'}>
      <div class="text-and-mindmap">
        <div class="text-item">
          ${isDraggingText
            ? html`<button
                class="next"
                style="transform: translateY(${showNextText ? 0 : 64}px)"
              >
                ${textItem.icon}
              </button>`
            : nothing}
          <button
            style="opacity: ${isDraggingText ? 0 : 1}"
            @mousedown=${(e: MouseEvent) =>
              this.draggableController.onMouseDown(e, {
                preview: textItem.icon,
                data: textItem,
              })}
            @touchstart=${(e: TouchEvent) =>
              this.draggableController.onTouchStart(e, {
                preview: textItem.icon,
                data: textItem,
              })}
          >
            ${textItem.icon}
          </button>
          <affine-tooltip tip-position="top" .offset=${12}>
            ${getTooltipWithShortcut('Edgeless Text', 'T')}
          </affine-tooltip>
        </div>
        <div class="thin-divider"></div>
        <!-- mind map -->
        ${repeat(this.mindMaps, mindMap => {
          const isDraggingMindMap = draggingElement?.data?.type !== 'text';
          const draggingEle = draggingElement?.data as ToolbarMindmapItem;
          const isBeingDragged =
            isDraggingMindMap && draggingEle?.style === mindMap.style;
          const showNext = dragOut && !cancelled;
          const isActive = this._style$.value === mindMap.style;
          return html`
            <div class="mindmap-item" data-is-active=${isActive}>
              ${isBeingDragged
                ? html`<button
                    style="transform: translateY(${showNext ? 0 : 64}px)"
                    class="next"
                  >
                    ${mindMap.icon}
                  </button>`
                : nothing}
              <button
                style="opacity: ${isBeingDragged ? 0 : 1}"
                @mousedown=${(e: MouseEvent) => {
                  this.draggableController.onMouseDown(e, {
                    preview: mindMap.icon,
                    data: mindMap,
                    standardWidth: 350,
                  });
                }}
                @touchstart=${(e: TouchEvent) => {
                  this.draggableController.onTouchStart(e, {
                    preview: mindMap.icon,
                    data: mindMap,
                    standardWidth: 350,
                  });
                }}
                @click=${() => this.onActiveStyleChange?.(mindMap.style)}
              >
                ${mindMap.icon}
              </button>
              <affine-tooltip tip-position="top" .offset=${12}>
                ${getTooltipWithShortcut('Mind Map', 'M')}
              </affine-tooltip>
            </div>
          `;
        })}
        ${this.std.doc.awarenessStore.getFlag('enable_mind_map_import')
          ? this._importMindMapEntry()
          : nothing}
      </div>
    </edgeless-slide-menu>`;
  }

  override updated(changedProperties: Map<PropertyKey, unknown>) {
    if (!changedProperties.has('edgeless')) return;
    this.initDragController();
  }

  @consume({ context: modelContext })
  accessor model!: BlockModel;

  @property({ attribute: false })
  accessor onActiveStyleChange!: (style: MindmapStyle) => void;

  @property({ attribute: false })
  accessor onImportMindMap!: (bound: Bound) => Promise<void>;

  @consume({ context: stdContext })
  accessor std!: BlockStdScope;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-mindmap-menu': EdgelessMindmapMenu;
  }
}
