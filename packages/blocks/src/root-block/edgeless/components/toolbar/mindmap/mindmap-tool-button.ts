import './mindmap-menu.js';

import { assertExists } from '@blocksuite/global/utils';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { MindmapStyle } from '../../../../../surface-block/index.js';
import type { EdgelessTool } from '../../../types.js';
import { EdgelessDraggableElementController } from '../common/draggable/draggable-element.controller.js';
import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';
import { getMindMaps } from './assets.js';
import {
  type DraggableTool,
  getMindmapRender,
  mindmapConfig,
  textConfig,
  textRender,
  toolConfig2StyleObj,
} from './basket-elements.js';
import { basketIconDark, basketIconLight, textIcon } from './icons.js';

@customElement('edgeless-mindmap-tool-button')
export class EdgelessMindmapToolButton extends EdgelessToolbarToolMixin(
  LitElement
) {
  get mindmaps() {
    return getMindMaps(this.theme);
  }

  get draggableTools(): DraggableTool[] {
    const mindmap = this.mindmaps.find(m => m.style === this.activeStyle)!;
    return [
      {
        name: 'text',
        icon: textIcon,
        config: textConfig,
        standardWidth: 100,
        render: textRender,
      },
      {
        name: 'mindmap',
        icon: mindmap.icon,
        config: mindmapConfig,
        standardWidth: 350,
        render: getMindmapRender(this.activeStyle),
      },
    ];
  }

  static override styles = css`
    :host {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .partial-clip {
      flex-shrink: 0;
      box-sizing: border-box;
      width: calc(100% + 20px);
      pointer-events: none;
      padding: 0 10px;
      overflow: hidden;
    }
    .basket-wrapper {
      pointer-events: auto;
      height: 64px;
      width: 96px;
      display: flex;
      justify-content: center;
      align-items: flex-end;
      position: relative;
    }
    .basket,
    .basket-tool-item {
      transition: transform 0.3s ease-in-out;
      position: absolute;
    }

    .basket {
      bottom: 0;
      height: 17px;
      width: 76px;
    }
    .basket > div,
    .basket > svg {
      position: absolute;
    }
    .glass {
      width: 76px;
      height: 17px;
      border-radius: 2px;
      mask: url(#mindmap-basket-body-mask);
    }
    .glass.enabled {
      backdrop-filter: blur(2px);
    }

    .basket {
      z-index: 3;
    }
    .basket-tool-item {
      cursor: grab;
    }
    .basket-tool-item svg {
      display: block;
    }
    .basket-tool-item {
      transform: translate(var(--default-x, 0), var(--default-y, 0))
        rotate(var(--default-r, 0)) scale(var(--default-s, 1));
      z-index: var(--default-z, 0);
    }

    .basket-tool-item.next {
      transform: translate(var(--next-x, 0), var(--next-y, 0))
        rotate(var(--next-r, 0)) scale(var(--next-s, 1));
      z-index: var(--next-z, 0);
    }

    /* active & hover */
    .basket-wrapper:hover .basket,
    .basket-wrapper.active .basket {
      z-index: 0;
    }
    .basket-wrapper:hover .basket-tool-item.current,
    .basket-wrapper.active .basket-tool-item.current {
      transform: translate(var(--active-x, 0), var(--active-y, 0))
        rotate(var(--active-r, 0)) scale(var(--active-s, 1));
      z-index: var(--active-z, 0);
    }

    .basket-tool-item.next.coming,
    .basket-wrapper:hover .basket-tool-item.current:hover {
      transform: translate(var(--hover-x, 0), var(--hover-y, 0))
        rotate(var(--hover-r, 0)) scale(var(--hover-s, 1));
      z-index: var(--hover-z, 0);
    }
  `;

  override type: EdgelessTool['type'][] = ['mindmap', 'text'];

  override enableActiveBackground = true;

  draggableController!: EdgelessDraggableElementController<DraggableTool>;

  @property({ type: Boolean })
  accessor enableBlur = true;

  @state()
  accessor activeStyle: MindmapStyle = MindmapStyle.ONE;

  @state()
  accessor readyToDrop = false;

  @query('.basket-tool-item.mindmap')
  accessor mindmapElement!: HTMLElement;

  private _toggleMenu() {
    if (this.tryDisposePopper()) return;
    this.setEdgelessTool({ type: 'default' });

    const menu = this.createPopper('edgeless-mindmap-menu', this);
    Object.assign(menu.element, {
      edgeless: this.edgeless,
      activeStyle: this.activeStyle,
      onActiveStyleChange: (style: MindmapStyle) => {
        this.activeStyle = style;
      },
    });
  }

  initDragController() {
    if (!this.edgeless || !this.toolbarContainer) return;
    if (this.draggableController) return;
    this.draggableController = new EdgelessDraggableElementController(this, {
      service: this.edgeless.service,
      edgeless: this.edgeless,
      scopeElement: this.toolbarContainer,
      standardWidth: 100,
      clickToDrag: true,
      onOverlayCreated: (overlay, { data }) => {
        const tool = this.draggableTools.find(t => t.name === data.name);
        if (!tool) return;

        // recover the rotation
        const rotate = tool.config?.hover?.r ?? tool.config?.default?.r ?? 0;
        overlay.element.style.setProperty('--rotate', rotate + 'deg');
        setTimeout(() => {
          overlay.transitionWrapper.style.setProperty(
            '--rotate',
            -rotate + 'deg'
          );
        }, 50);

        // set the scale (without transition)
        const scale = tool.config?.hover?.s ?? tool.config?.default?.s ?? 1;
        overlay.element.style.setProperty('--scale', `${scale}`);

        // a workaround to handle getBoundingClientRect() when the element is rotated
        const _left = parseInt(overlay.element.style.left);
        const _top = parseInt(overlay.element.style.top);
        if (data.name === 'mindmap') {
          overlay.element.style.left = _left + 3 + 'px';
          overlay.element.style.top = _top + 5 + 'px';
        } else if (data.name === 'text') {
          overlay.element.style.left = _left + 0 + 'px';
          overlay.element.style.top = _top + 3 + 'px';
        }
        this.readyToDrop = true;
      },
      onCanceled: overlay => {
        overlay.transitionWrapper.style.transformOrigin = 'unset';
        overlay.transitionWrapper.style.setProperty('--rotate', '0deg');
        this.readyToDrop = false;
      },
      onDrop: (el, bound) => {
        const id = el.data.render(bound, this.edgeless.service, this.edgeless);
        this.readyToDrop = false;
        if (el.data.name === 'mindmap') {
          this.setEdgelessTool(
            { type: 'default' },
            { elements: [id], editing: false }
          );
        } else if (el.data.name === 'text') {
          this.setEdgelessTool({ type: 'default' });
        }
      },
    });

    const dispose = this.edgeless.bindHotKey(
      {
        m: () => {
          const service = this.edgeless.service;
          if (service.locked) return;
          if (service.selection.editing) return;

          if (this.readyToDrop) {
            // change the style
            const activeIndex = this.mindmaps.findIndex(
              m => m.style === this.activeStyle
            );
            const nextIndex = (activeIndex + 1) % this.mindmaps.length;
            const next = this.mindmaps[nextIndex];
            this.activeStyle = next.style;
            const tool = this.draggableTools.find(t => t.name === 'mindmap');
            assertExists(tool);
            this.draggableController.updateElementInfo({
              data: tool,
              preview: next.icon,
            });
            return;
          }
          this.setEdgelessTool({ type: 'mindmap' });
          const icon = this.mindmapElement;
          assertExists(icon);
          const { x, y } = service.tool.lastMousePos;
          const { left, top } = this.edgeless.viewport;
          const clientPos = { x: x + left, y: y + top };
          this.draggableController.clickToDrag(icon, clientPos);
        },
      },
      { global: true }
    );
    this.disposables.add(dispose);
  }

  override updated(_changedProperties: Map<PropertyKey, unknown>) {
    const controllerRequiredProps = ['edgeless', 'toolbarContainer'] as const;
    if (
      controllerRequiredProps.some(p => _changedProperties.has(p)) &&
      !this.draggableController
    ) {
      this.initDragController();
    }
  }

  override render() {
    const { popper, theme } = this;
    const basketIcon = theme === 'light' ? basketIconLight : basketIconDark;
    const glassBg =
      theme === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(74, 74, 74, 0.6)';

    const { cancelled, dragOut, draggingElement } =
      this.draggableController?.states || {};

    const active = popper || draggingElement;

    return html`<edgeless-toolbar-button
      class="edgeless-mindmap-button"
      ?withHover=${true}
      .tooltip=${popper ? '' : 'Others'}
      .tooltipOffset=${4}
      @click=${this._toggleMenu}
      style="width: 100%; height: 100%; display: inline-block"
    >
      <div class="partial-clip">
        <div class="basket-wrapper ${active ? 'active' : ''}">
          ${repeat(
            this.draggableTools,
            t => t.name,
            tool => {
              const isBeingDragged = draggingElement?.data.name === tool.name;
              const variables = toolConfig2StyleObj(tool.config);

              const nextStyle = styleMap({
                ...variables,
              });
              const currentStyle = styleMap({
                ...variables,
                opacity: isBeingDragged ? 0 : 1,
                pointerEvents: draggingElement ? 'none' : 'auto',
              });

              return html`${isBeingDragged
                  ? html`<div
                      class=${classMap({
                        'basket-tool-item': true,
                        next: true,
                        coming: !!dragOut && !cancelled,
                      })}
                      style=${nextStyle}
                    >
                      ${tool.icon}
                    </div>`
                  : nothing}

                <div
                  style=${currentStyle}
                  @mousedown=${(e: MouseEvent) =>
                    this.draggableController.onMouseDown(e, {
                      data: tool,
                      preview: tool.icon,
                      standardWidth: tool.standardWidth,
                    })}
                  @touchstart=${(e: TouchEvent) =>
                    this.draggableController.onTouchStart(e, {
                      data: tool,
                      preview: tool.icon,
                      standardWidth: tool.standardWidth,
                    })}
                  class="basket-tool-item current ${tool.name}"
                >
                  ${tool.icon}
                </div>`;
            }
          )}

          <div class="basket">
            <div
              class="glass ${this.enableBlur ? 'enabled' : ''}"
              style="background: ${glassBg}"
            ></div>
            ${basketIcon}
          </div>
        </div>
      </div>

      <svg width="0" height="0" style="opacity: 0; pointer-events: none">
        <defs>
          <mask id="mindmap-basket-body-mask">
            <rect
              x="2"
              width="71.8"
              y="2"
              height="15"
              rx="1.5"
              ry="1.5"
              fill="white"
            />
            <rect
              width="32"
              height="6"
              x="22"
              y="5.9"
              fill="black"
              rx="3"
              ry="3"
            />
          </mask>
        </defs>
      </svg>
    </edgeless-toolbar-button>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-mindmap-tool-button': EdgelessMindmapToolButton;
  }
}
