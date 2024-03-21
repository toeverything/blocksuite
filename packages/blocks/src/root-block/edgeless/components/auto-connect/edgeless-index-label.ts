import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css, html, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  AutoConnectLeftIcon,
  AutoConnectRightIcon,
  HiddenIcon,
} from '../../../../_common/icons/edgeless.js';
import { SmallDocIcon } from '../../../../_common/icons/text.js';
import { requestConnectedFrame } from '../../../../_common/utils/event.js';
import type { NoteBlockModel } from '../../../../note-block/index.js';
import { Bound } from '../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';
import { isNoteBlock } from '../../utils/query.js';
import type { AutoConnectElement } from '../block-portal/edgeless-block-portal.js';

const PAGE_VISIBLE_INDEX_LABEL_WIDTH = 44;
const PAGE_VISIBLE_INDEX_LABEL_HEIGHT = 24;
const EDGELESS_ONLY_INDEX_LABEL_WIDTH = 24;
const EDGELESS_ONLY_INDEX_LABEL_HEIGHT = 24;
const INDEX_LABEL_OFFSET = 16;

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

function getIndexLabelTooltip(icon: TemplateResult, content: string) {
  const styles = css`
    .index-label-tooltip {
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      gap: 10px;
    }

    .index-label-tooltip-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .index-label-tooltip-content {
      font-size: var(--affine-font-sm);

      display: flex;
      height: 16px;
      line-height: 16px;
    }
  `;

  return html`<style>
      ${styles}
    </style>
    <div class="index-label-tooltip">
      <span class="index-label-tooltip-icon">${icon}</span>
      <span class="index-label-tooltip-content">${content}</span>
    </div>`;
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
  edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  show = false;

  @property({ attribute: false })
  pageVisibleElementsMap!: Map<AutoConnectElement, number>;

  @property({ attribute: false })
  edgelessOnlyNotesSet!: Set<NoteBlockModel>;

  @state()
  private _index = -1;

  protected override firstUpdated(): void {
    const { _disposables, edgeless } = this;

    _disposables.add(
      edgeless.service.viewport.viewportUpdated.on(() => {
        this.requestUpdate();
      })
    );

    const requestUpdate = (payload: { id: string }) => {
      if (!this.isConnected) return;

      const element = edgeless.service.getElementById(
        payload.id
      ) as AutoConnectElement;
      if (element && this.pageVisibleElementsMap.has(element)) {
        this.requestUpdate();
      }

      if (isNoteBlock(element) && this.edgelessOnlyNotesSet.has(element)) {
        this.requestUpdate();
      }
    };

    _disposables.add(
      edgeless.surfaceBlockModel.elementUpdated.on(requestUpdate)
    );
    _disposables.add(
      edgeless.doc.slots.blockUpdated.on(payload => {
        if (payload.type === 'update') {
          requestUpdate(payload);
        }
      })
    );

    _disposables.add(
      edgeless.service.selection.slots.updated.on(() => {
        const { elements } = edgeless.service.selection;
        if (!(elements.length === 1 && isNoteBlock(elements[0]))) {
          this._index = -1;
        }
      })
    );

    requestConnectedFrame(() => {
      this._disposables.add(
        edgeless.dispatcher.add('click', ctx => {
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
          } else if (target.closest('.edgeless-auto-connect-previous-button')) {
            this._navigateToPrev();
            return true;
          }
          return false;
        })
      );
    }, edgeless);
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
    for (const [key, value] of this.pageVisibleElementsMap.entries()) {
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
    this.edgeless.service.selection.set({
      elements: [element.id],
      editing: false,
    });
    this.edgeless.service.viewport.setViewportByBound(
      bound,
      [80, 80, 80, 80],
      true
    );
  }

  private _navigateToPrev() {
    const { elements } = this._getElementsAndCounts();
    if (this._index <= 0) return;
    this._index = this._index - 1;
    const element = elements[this._index];
    const bound = Bound.deserialize(element.xywh);
    this.edgeless.service.selection.set({
      elements: [element.id],
      editing: false,
    });
    this.edgeless.service.viewport.setViewportByBound(
      bound,
      [80, 80, 80, 80],
      true
    );
  }

  private _NavigatorComponent(elements: AutoConnectElement[]) {
    const { viewport } = this.surface.edgeless.service;
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

  private _PageVisibleIndexLabels(
    elements: AutoConnectElement[],
    counts: number[]
  ) {
    const { viewport } = this.edgeless.service;
    const { zoom } = viewport;
    let index = 0;

    return html`${repeat(
      elements,
      element => element.id,
      (element, i) => {
        const bound = Bound.deserialize(element.xywh);
        const [left, right] = viewport.toViewCoord(bound.x, bound.y);
        const [width, height] = [bound.w * zoom, bound.h * zoom];
        const style = styleMap({
          width: `${PAGE_VISIBLE_INDEX_LABEL_WIDTH}px`,
          maxWidth: `${PAGE_VISIBLE_INDEX_LABEL_WIDTH}px`,
          height: `${PAGE_VISIBLE_INDEX_LABEL_HEIGHT}px`,
          position: 'absolute',
          transform: `translate(${
            left + width / 2 - PAGE_VISIBLE_INDEX_LABEL_WIDTH / 2
          }px,
          ${right + height + INDEX_LABEL_OFFSET}px)`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        });
        const components = [];
        const count = counts[i];
        const initGap = 24 / count - 24;
        const positions = calculatePosition(
          initGap,
          count,
          PAGE_VISIBLE_INDEX_LABEL_HEIGHT
        );
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
              <affine-tooltip tip-position="bottom">
                ${getIndexLabelTooltip(SmallDocIcon, 'Page mode index')}
              </affine-tooltip>
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
            const positions = calculatePosition(
              5,
              count,
              PAGE_VISIBLE_INDEX_LABEL_HEIGHT
            );
            updateChildrenPosition(e, positions);
          }}
          @mouseleave=${(e: MouseEvent) => {
            const positions = calculatePosition(
              initGap,
              count,
              PAGE_VISIBLE_INDEX_LABEL_HEIGHT
            );
            updateChildrenPosition(e, positions);
          }}
        >
          ${components}
        </div>`;
      }
    )}`;
  }

  private _EdgelessOnlyLabels() {
    const { edgelessOnlyNotesSet } = this;
    if (!edgelessOnlyNotesSet.size) return nothing;

    return html`${repeat(
      edgelessOnlyNotesSet,
      note => note.id,
      note => {
        const { viewport } = this.edgeless.service;
        const { zoom } = viewport;
        const bound = Bound.deserialize(note.xywh);
        const [left, right] = viewport.toViewCoord(bound.x, bound.y);
        const [width, height] = [bound.w * zoom, bound.h * zoom];
        const style = styleMap({
          width: `${EDGELESS_ONLY_INDEX_LABEL_WIDTH}px`,
          height: `${EDGELESS_ONLY_INDEX_LABEL_HEIGHT}px`,
          borderRadius: '50%',
          backgroundColor: 'var(--affine-text-secondary-color)',
          border: '1px solid var(--affine-border-color)',
          color: 'var(--affine-white)',
          position: 'absolute',
          transform: `translate(${
            left + width / 2 - EDGELESS_ONLY_INDEX_LABEL_WIDTH / 2
          }px,
          ${right + height + INDEX_LABEL_OFFSET}px)`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        });
        return html`<div style=${style}>
          ${HiddenIcon}
          <affine-tooltip tip-position="bottom">
            ${getIndexLabelTooltip(SmallDocIcon, 'Hidden on page')}
          </affine-tooltip>
        </div>`;
      }
    )}`;
  }

  protected override render() {
    if (!this.show) return nothing;

    const { elements, counts } = this._getElementsAndCounts();

    return html`${this._PageVisibleIndexLabels(elements, counts)}
    ${this._EdgelessOnlyLabels()}
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
