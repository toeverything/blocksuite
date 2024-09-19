import {
  AlignBottomIcon,
  AlignDistributeHorizontallyIcon,
  AlignDistributeVerticallyIcon,
  AlignHorizontallyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignTopIcon,
  AlignVerticallyIcon,
  SmallArrowDownIcon,
} from '@blocksuite/affine-components/icons';
import {
  ConnectorElementModel,
  GroupElementModel,
  MindmapElementModel,
} from '@blocksuite/affine-model';
import { Bound, WithDisposable } from '@blocksuite/global/utils';
import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

const enum Alignment {
  Bottom = 'Align bottom',
  DistributeHorizontally = 'Distribute horizontally',
  DistributeVertically = 'Distribute vertically',
  Horizontally = 'Align horizontally',
  Left = 'Align left',
  Right = 'Align right',
  Top = 'Align top',
  Vertically = 'Align vertically',
}

const ALIGNMENT_LIST = [
  {
    name: Alignment.Left,
    content: AlignLeftIcon,
  },
  {
    name: Alignment.Horizontally,
    content: AlignHorizontallyIcon,
  },
  {
    name: Alignment.Right,
    content: AlignRightIcon,
  },
  {
    name: Alignment.DistributeHorizontally,
    content: AlignDistributeHorizontallyIcon,
  },
  {
    name: 'separator',
    content: html`<editor-toolbar-separator></editor-toolbar-separator>`,
  },
  {
    name: Alignment.Top,
    content: AlignTopIcon,
  },
  {
    name: Alignment.Vertically,
    content: AlignVerticallyIcon,
  },
  {
    name: Alignment.Bottom,
    content: AlignBottomIcon,
  },
  {
    name: Alignment.DistributeVertically,
    content: AlignDistributeVerticallyIcon,
  },
] as const;

export class EdgelessAlignButton extends WithDisposable(LitElement) {
  private get elements() {
    return this.edgeless.service.selection.selectedElements;
  }

  private _align(type: Alignment) {
    switch (type) {
      case Alignment.Left:
        this._alignLeft();
        break;
      case Alignment.Horizontally:
        this._alignHorizontally();
        break;
      case Alignment.Right:
        this._alignRight();
        break;
      case Alignment.DistributeHorizontally:
        this._alignDistributeHorizontally();
        break;
      case Alignment.Top:
        this._alignTop();
        break;
      case Alignment.Vertically:
        this._alignVertically();
        break;
      case Alignment.Bottom:
        this._alignBottom();
        break;
      case Alignment.DistributeVertically:
        this._alignDistributeVertically();
        break;
    }
  }

  private _alignBottom() {
    const { elements } = this;
    const bounds = elements.map(a => a.elementBound);
    const bottom = Math.max(...bounds.map(b => b.maxY));

    elements.forEach((ele, index) => {
      const elementBound = bounds[index];
      const bound = Bound.deserialize(ele.xywh);
      const offset = bound.maxY - elementBound.maxY;
      bound.y = bottom - bound.h + offset;
      this._updateXYWH(ele, bound);
    });
  }

  private _alignDistributeHorizontally() {
    const { elements } = this;

    elements.sort((a, b) => a.elementBound.minX - b.elementBound.minX);
    const bounds = elements.map(a => a.elementBound);
    const left = bounds[0].minX;
    const right = bounds[bounds.length - 1].maxX;

    const totalWidth = right - left;
    const totalGap =
      totalWidth - elements.reduce((prev, ele) => prev + ele.elementBound.w, 0);
    const gap = totalGap / (elements.length - 1);
    let next = bounds[0].maxX + gap;
    for (let i = 1; i < elements.length - 1; i++) {
      const bound = Bound.deserialize(elements[i].xywh);
      bound.x = next + bounds[i].w / 2 - bound.w / 2;
      next += gap + bounds[i].w;
      this._updateXYWH(elements[i], bound);
    }
  }

  private _alignDistributeVertically() {
    const { elements } = this;

    elements.sort((a, b) => a.elementBound.minY - b.elementBound.minY);
    const bounds = elements.map(a => a.elementBound);
    const top = bounds[0].minY;
    const bottom = bounds[bounds.length - 1].maxY;

    const totalHeight = bottom - top;
    const totalGap =
      totalHeight -
      elements.reduce((prev, ele) => prev + ele.elementBound.h, 0);
    const gap = totalGap / (elements.length - 1);
    let next = bounds[0].maxY + gap;
    for (let i = 1; i < elements.length - 1; i++) {
      const bound = Bound.deserialize(elements[i].xywh);
      bound.y = next + bounds[i].h / 2 - bound.h / 2;
      next += gap + bounds[i].h;
      this._updateXYWH(elements[i], bound);
    }
  }

  private _alignHorizontally() {
    const { elements } = this;
    const bounds = elements.map(a => a.elementBound);
    const left = Math.min(...bounds.map(b => b.minX));
    const right = Math.max(...bounds.map(b => b.maxX));
    const centerX = (left + right) / 2;

    elements.forEach(ele => {
      const bound = Bound.deserialize(ele.xywh);
      bound.x = centerX - bound.w / 2;
      this._updateXYWH(ele, bound);
    });
  }

  private _alignLeft() {
    const { elements } = this;
    const bounds = elements.map(a => a.elementBound);
    const left = Math.min(...bounds.map(b => b.minX));

    elements.forEach((ele, index) => {
      const elementBound = bounds[index];
      const bound = Bound.deserialize(ele.xywh);
      const offset = bound.minX - elementBound.minX;
      bound.x = left + offset;
      this._updateXYWH(ele, bound);
    });
  }

  private _alignRight() {
    const { elements } = this;
    const bounds = elements.map(a => a.elementBound);
    const right = Math.max(...bounds.map(b => b.maxX));

    elements.forEach((ele, index) => {
      const elementBound = bounds[index];
      const bound = Bound.deserialize(ele.xywh);
      const offset = bound.maxX - elementBound.maxX;
      bound.x = right - bound.w + offset;
      this._updateXYWH(ele, bound);
    });
  }

  private _alignTop() {
    const { elements } = this;
    const bounds = elements.map(a => a.elementBound);
    const top = Math.min(...bounds.map(b => b.minY));

    elements.forEach((ele, index) => {
      const elementBound = bounds[index];
      const bound = Bound.deserialize(ele.xywh);
      const offset = bound.minY - elementBound.minY;
      bound.y = top + offset;
      this._updateXYWH(ele, bound);
    });
  }

  private _alignVertically() {
    const { elements } = this;
    const bounds = elements.map(a => a.elementBound);
    const top = Math.min(...bounds.map(b => b.minY));
    const bottom = Math.max(...bounds.map(b => b.maxY));
    const centerY = (top + bottom) / 2;

    elements.forEach(ele => {
      const bound = Bound.deserialize(ele.xywh);
      bound.y = centerY - bound.h / 2;
      this._updateXYWH(ele, bound);
    });
  }

  private _updateXYWH(ele: BlockSuite.EdgelessModel, bound: Bound) {
    if (ele instanceof ConnectorElementModel) {
      ele.moveTo(bound);
    } else if (ele instanceof GroupElementModel) {
      const groupBound = Bound.deserialize(ele.xywh);
      ele.childElements.forEach(child => {
        const newBound = Bound.deserialize(child.xywh);
        newBound.x += bound.x - groupBound.x;
        newBound.y += bound.y - groupBound.y;
        this._updateXYWH(child, newBound);
      });
    } else {
      this.edgeless.service.updateElement(ele.id, {
        xywh: bound.serialize(),
      });
    }
  }

  override firstUpdated() {
    this._disposables.add(
      this.edgeless.service.selection.slots.updated.on(() =>
        this.requestUpdate()
      )
    );
  }

  override render() {
    return html`
      <editor-menu-button
        .button=${html`
          <editor-icon-button
            aria-label="Align objects"
            .tooltip=${'Align objects'}
          >
            ${AlignLeftIcon}${SmallArrowDownIcon}
          </editor-icon-button>
        `}
      >
        <div>
          ${repeat(
            ALIGNMENT_LIST,
            (item, index) => item.name + index,
            ({ name, content }) => {
              if (name === 'separator') return content;
              return html`
                <editor-icon-button
                  aria-label=${name}
                  .tooltip=${name}
                  @click=${() => this._align(name)}
                >
                  ${content}
                </editor-icon-button>
              `;
            }
          )}
        </div>
      </editor-menu-button>
    `;
  }

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-align-button': EdgelessAlignButton;
  }
}

export function renderAlignButton(
  edgeless: EdgelessRootBlockComponent,
  elements: BlockSuite.EdgelessModel[]
) {
  if (elements.length < 2) return nothing;
  if (elements.some(e => e.group instanceof MindmapElementModel))
    return nothing;

  return html`
    <edgeless-align-button .edgeless=${edgeless}></edgeless-align-button>
  `;
}
