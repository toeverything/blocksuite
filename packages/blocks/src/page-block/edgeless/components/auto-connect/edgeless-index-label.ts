import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  AutoConnectLeftIcon,
  AutoConnectRightIcon,
} from '../../../../_common/icons/edgeless.js';
import { Bound } from '../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { isFrameBlock, isNoteBlock } from '../../utils/query.js';
import type { AutoConnectElement } from '../block-portal/edgeless-block-portal.js';

function calculatePosition(gap: number, count: number, iconWidth: number) {
  const positions = [];
  if (count === 1) {
    positions.push([0, 10]);
    return positions;
  }
  const middleIndex = (count - 1) / 2;
  const isEven = count % 2 === 0;
  const middleOffset = (gap + iconWidth) / 2;
  function getSign(num: number) {
    return num - middleIndex > 0 ? 1 : -1;
  }
  for (let j = 0; j < count; j++) {
    let left = 10;
    if (isEven) {
      if (Math.abs(j - middleIndex) < 1 && isEven) {
        left = 10 + middleOffset * getSign(j);
      } else {
        left =
          10 +
          ((Math.ceil(Math.abs(j - middleIndex)) - 1) * (gap + 24) +
            middleOffset) *
            getSign(j);
      }
    } else {
      const offset = gap + iconWidth;
      left = 10 + Math.ceil(Math.abs(j - middleIndex)) * offset * getSign(j);
    }
    positions.push([0, left]);
  }

  return positions;
}

@customElement('edgeless-index-label')
export class EdgelessIndexLabel extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .edgeless-index-label {
      font-size: 15px;
      text-align: center;
      height: 24px;
      min-width: 24px;
      padding: 0px 6px;
      width: fit-content;
      border-radius: 25px;
      border: 1px solid #0000001a;
      background: var(--affine-primary-color);
      color: var(--affine-white);
      cursor: pointer;
      user-select: none;
    }

    .navigator {
      width: 48px;
      padding: 4px;
      border-radius: 58px;
      border: 1px solid rgba(227, 226, 228, 1);
      transition: opacity 0.5s ease-in-out;
      background: rgba(251, 251, 252, 1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      opacity: 0;
    }

    .navigator div {
      display: flex;
      align-items: center;
      cursor: pointer;
    }

    .navigator span {
      display: inline-block;
      height: 8px;
      border: 1px solid rgba(227, 226, 228, 1);
    }

    .navigator div:hover {
      background: var(--affine-hover-color);
    }

    .navigator.show {
      opacity: 1;
    }
  `;

  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  show = false;

  @property({ attribute: false })
  elementsMap!: Map<AutoConnectElement, number>;

  @state()
  private _index = -1;

  protected override firstUpdated(): void {
    const { _disposables, surface, edgeless } = this;

    _disposables.add(
      surface.viewport.slots.viewportUpdated.on(() => {
        this.requestUpdate();
      })
    );

    _disposables.add(
      surface.page.slots.yBlockUpdated.on(({ type, id }) => {
        const block = surface.page.getBlockById(id);
        if (type === 'update' && isNoteBlock(block)) {
          this.requestUpdate();
        } else if (isFrameBlock(block) && this.elementsMap.has(block)) {
          this.requestUpdate();
        }
      })
    );

    _disposables.add(
      surface.slots.elementUpdated.on(({ id }) => {
        const element = surface.pickById(id) as AutoConnectElement;
        if (element && this.elementsMap.has(element)) {
          this.requestUpdate();
        }
      })
    );

    _disposables.add(
      edgeless.slots.elementSizeUpdated.on(id => {
        if (isNoteBlock(surface.pickById(id))) {
          this.requestUpdate();
        }
      })
    );

    _disposables.add(
      edgeless.selectionManager.slots.updated.on(() => {
        const { elements } = edgeless.selectionManager;
        if (!(elements.length === 1 && isNoteBlock(elements[0]))) {
          this._index = -1;
        }
      })
    );

    requestAnimationFrame(() => {
      if (surface.edgeless.dispatcher) {
        this._disposables.add(
          surface.edgeless.dispatcher.add('click', ctx => {
            const event = ctx.get('pointerState');
            const { raw } = event;
            const target = raw.target as HTMLElement;
            if (!target) return false;
            if (target.closest('.edgeless-index-label')) {
              const ele = target.closest('.edgeless-index-label') as Element;
              const index = Number(ele.getAttribute('index'));
              this._index = index === this._index ? -1 : index;
              return true;
            } else if (target.closest('.edgeless-auto-connect-next-button')) {
              this._navigateToNext();
              return true;
            } else if (
              target.closest('.edgeless-auto-connect-previous-button')
            ) {
              this._navigateToPrev();
              return true;
            }
            return false;
          })
        );
      }
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.style.position = 'absolute';
    this.style.top = '0';
    this.style.left = '0';
    this.style.zIndex = '1';
  }

  private _getElementsAndCounts() {
    const elements: AutoConnectElement[] = [];
    const counts: number[] = [];
    for (const [key, value] of this.elementsMap.entries()) {
      elements.push(key);
      counts.push(value);
    }
    return { elements, counts };
  }

  private _navigateToNext() {
    const { elements } = this._getElementsAndCounts();
    if (this._index >= elements.length - 1) return;
    this._index = this._index + 1;
    const element = elements[this._index];
    const bound = Bound.deserialize(element.xywh);
    this.surface.edgeless.selectionManager.setSelection({
      elements: [element.id],
      editing: false,
    });
    this.surface.viewport.setViewportByBound(bound, [80, 80, 80, 80], true);
  }

  private _navigateToPrev() {
    const { elements } = this._getElementsAndCounts();
    if (this._index <= 0) return;
    this._index = this._index - 1;
    const element = elements[this._index];
    const bound = Bound.deserialize(element.xywh);
    this.surface.edgeless.selectionManager.setSelection({
      elements: [element.id],
      editing: false,
    });
    this.surface.viewport.setViewportByBound(bound, [80, 80, 80, 80], true);
  }

  private _NavigatorComponent(elements: AutoConnectElement[]) {
    const { viewport } = this.surface;
    const { zoom } = viewport;
    const classname = `navigator ${this._index >= 0 ? 'show' : 'hidden'}`;
    const element = elements[this._index];
    const bound = Bound.deserialize(element.xywh);
    const [left, right] = viewport.toViewCoord(bound.x, bound.y);
    const [width, height] = [bound.w * zoom, bound.h * zoom];
    const navigatorStyle = styleMap({
      position: 'absolute',
      transform: `translate(${left + width / 2 - 26}px, ${
        right + height + 16
      }px)`,
    });
    return html`<div class=${classname} style=${navigatorStyle}>
      <div class="edgeless-auto-connect-previous-button">
        ${AutoConnectLeftIcon}
      </div>
      <span></span>
      <div class="edgeless-auto-connect-next-button">
        ${AutoConnectRightIcon}
      </div>
    </div> `;
  }

  protected override render() {
    if (!this.show) return nothing;

    const { viewport } = this.surface;
    const { zoom } = viewport;
    const { elements, counts } = this._getElementsAndCounts();
    let index = 0;

    return html`${repeat(
      elements,
      element => element.id,
      (element, i) => {
        const bound = Bound.deserialize(element.xywh);
        const [left, right] = viewport.toViewCoord(bound.x, bound.y);
        const [width, height] = [bound.w * zoom, bound.h * zoom];
        const iconWidth = 24;
        const style = styleMap({
          width: '44px',
          maxWidth: '44px',
          height: iconWidth + 'px',
          position: 'absolute',
          transform: `translate(${left + width / 2 - 44 / 2}px, ${
            right + height - 14
          }px)`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        });
        const components = [];
        const count = counts[i];
        const initGap = 24 / count - 24;
        const positions = calculatePosition(initGap, count, iconWidth);
        for (let j = 0; j < count; j++) {
          index++;
          components.push(html`
            <div
              style=${styleMap({
                position: 'absolute',
                top: positions[j][0] + 'px',
                left: positions[j][1] + 'px',
                transition: 'all 0.1s linear',
              })}
              index=${i}
              class="edgeless-index-label"
            >
              ${index}
            </div>
          `);
        }

        function updateChildrenPosition(e: MouseEvent, positions: number[][]) {
          if (!e.target) return;
          const children = (<HTMLElement>e.target).children;
          (<HTMLElement[]>Array.from(children)).forEach((c, index) => {
            c.style.top = positions[index][0] + 'px';
            c.style.left = positions[index][1] + 'px';
          });
        }

        return html`<div
          style=${style}
          @mouseenter=${(e: MouseEvent) => {
            const positions = calculatePosition(5, count, iconWidth);
            updateChildrenPosition(e, positions);
          }}
          @mouseleave=${(e: MouseEvent) => {
            const positions = calculatePosition(initGap, count, iconWidth);
            updateChildrenPosition(e, positions);
          }}
        >
          ${components}
        </div>`;
      }
    )}
    ${this._index >= 0 && this._index < elements.length
      ? this._NavigatorComponent(elements)
      : nothing} `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-index-label': EdgelessIndexLabel;
  }
}
