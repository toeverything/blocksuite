import { LitElement, type TemplateResult, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { MindmapStyle } from '../../../../../surface-block/index.js';

import { getTooltipWithShortcut } from '../../utils.js';
import { EdgelessDraggableElementController } from '../common/draggable/draggable-element.controller.js';
import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';
import { type ToolbarMindmapItem, getMindMaps } from './assets.js';
import { textRender } from './basket-elements.js';
import { textIcon } from './icons.js';

type TextItem = {
  icon: TemplateResult;
  render: typeof textRender;
  type: 'text';
};
const textItem: TextItem = { icon: textIcon, render: textRender, type: 'text' };

@customElement('edgeless-mindmap-menu')
export class EdgelessMindmapMenu extends EdgelessToolbarToolMixin(LitElement) {
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
    .mindmap-item:hover {
      background: var(--affine-hover-color);
    }
    .text-item > button.next,
    .mindmap-item > button.next {
      transition: transform 0.3s ease-in-out;
    }
  `;

  draggableController!: EdgelessDraggableElementController<
    TextItem | ToolbarMindmapItem
  >;

  override type = 'mindmap' as const;

  initDragController() {
    if (this.draggableController || !this.edgeless) return;
    this.draggableController = new EdgelessDraggableElementController(this, {
      clickToDrag: true,
      edgeless: this.edgeless,
      onDrop: (element, bound) => {
        const id = element.data.render(
          bound,
          this.edgeless.service,
          this.edgeless
        );
        if (element.data.type === 'mindmap') {
          this.onActiveStyleChange?.(element.data.style);
          this.setEdgelessTool(
            { type: 'default' },
            { editing: false, elements: [id] }
          );
        } else if (element.data.type === 'text') {
          this.setEdgelessTool({ type: 'default' });
        }
      },
      onOverlayCreated: () => {
        // a workaround to active mindmap, so that menu cannot be closed by `Escape`
        this.setEdgelessTool({ type: 'mindmap' });
      },
      scopeElement: this,
      service: this.edgeless.service,
    });
  }

  override render() {
    const { cancelled, dragOut, draggingElement } =
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
                data: textItem,
                preview: textItem.icon,
              })}
            @touchstart=${(e: TouchEvent) =>
              this.draggableController.onTouchStart(e, {
                data: textItem,
                preview: textItem.icon,
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
          return html`
            <div class="mindmap-item">
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
                    data: mindMap,
                    preview: mindMap.icon,
                    standardWidth: 350,
                  });
                }}
                @touchstart=${(e: TouchEvent) => {
                  this.draggableController.onTouchStart(e, {
                    data: mindMap,
                    preview: mindMap.icon,
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
      </div>
    </edgeless-slide-menu>`;
  }

  override updated(changedProperties: Map<PropertyKey, unknown>) {
    if (!changedProperties.has('edgeless')) return;
    this.initDragController();
  }

  get mindMaps() {
    return getMindMaps(this.theme);
  }

  @property({ attribute: false })
  accessor activeStyle!: MindmapStyle;

  @property({ attribute: false })
  accessor onActiveStyleChange!: (style: MindmapStyle) => void;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-mindmap-menu': EdgelessMindmapMenu;
  }
}
