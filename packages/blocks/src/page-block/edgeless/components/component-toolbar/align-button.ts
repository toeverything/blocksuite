import '../buttons/menu-button.js';
import '../../../../components/menu-divider.js';

import { WithDisposable } from '@blocksuite/lit';
import { Bound, ConnectorElement } from '@blocksuite/phasor';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

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
} from '../../../../icons/edgeless.js';
import type { EdgelessElement } from '../../../../index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { getGridBound } from '../../utils/bound-utils.js';
import { isTopLevelBlock } from '../../utils/query.js';

@customElement('edgeless-align-button')
export class EdgelessAlignButton extends WithDisposable(LitElement) {
  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  private get elements() {
    return this.edgeless.selectionManager.elements;
  }

  override firstUpdated() {
    this._disposables.add(
      this.edgeless.selectionManager.slots.updated.on(() =>
        this.requestUpdate()
      )
    );
  }

  private _updateXYWH(ele: EdgelessElement, bound: Bound) {
    if (isTopLevelBlock(ele)) {
      this.edgeless.page.updateBlock(ele, {
        xywh: bound.serialize(),
      });
    } else if (ele instanceof ConnectorElement) {
      this.edgeless.connector.updateXYWH(ele, bound);
    } else {
      this.edgeless.surface.updateElement(ele.id, {
        xywh: bound.serialize(),
      });
    }
  }

  private _alignLeft() {
    const { elements } = this;
    const bounds = elements.map(getGridBound);
    const left = Math.min(...bounds.map(b => b.minX));

    elements.forEach((ele, index) => {
      const gridBound = bounds[index];
      const bound = Bound.deserialize(ele.xywh);
      const offset = bound.minX - gridBound.minX;
      bound.x = left + offset;
      this._updateXYWH(ele, bound);
    });
  }

  private _alignRight() {
    const { elements } = this;
    const bounds = elements.map(getGridBound);
    const right = Math.max(...bounds.map(b => b.maxX));

    elements.forEach((ele, index) => {
      const gridBound = bounds[index];
      const bound = Bound.deserialize(ele.xywh);
      const offset = bound.maxX - gridBound.maxX;
      bound.x = right - bound.w + offset;
      this._updateXYWH(ele, bound);
    });
  }

  private _alignHorizontally() {
    const { elements } = this;
    const bounds = elements.map(getGridBound);
    const left = Math.min(...bounds.map(b => b.minX));
    const right = Math.max(...bounds.map(b => b.maxX));
    const centerX = (left + right) / 2;

    elements.forEach(ele => {
      const bound = Bound.deserialize(ele.xywh);
      bound.x = centerX - bound.w / 2;
      this._updateXYWH(ele, bound);
    });
  }

  private _alignDistributeHorizontally() {
    const { elements } = this;

    elements.sort((a, b) => getGridBound(a).minX - getGridBound(b).minX);
    const bounds = elements.map(getGridBound);
    const left = bounds[0].minX;
    const right = bounds[bounds.length - 1].maxX;

    const totalWidth = right - left;
    const totalGap =
      totalWidth -
      elements.reduce((prev, ele) => prev + getGridBound(ele).w, 0);
    const gap = totalGap / (elements.length - 1);
    let next = bounds[0].maxX + gap;
    for (let i = 1; i < elements.length - 1; i++) {
      const bound = Bound.deserialize(elements[i].xywh);
      bound.x = next + bounds[i].w / 2 - bound.w / 2;
      next += gap + bounds[i].w;
      this._updateXYWH(elements[i], bound);
    }
  }

  private _alignTop() {
    const { elements } = this;
    const bounds = elements.map(getGridBound);
    const top = Math.min(...bounds.map(b => b.minY));

    elements.forEach((ele, index) => {
      const gridBound = bounds[index];
      const bound = Bound.deserialize(ele.xywh);
      const offset = bound.minY - gridBound.minY;
      bound.y = top + offset;
      this._updateXYWH(ele, bound);
    });
  }

  private _alignBottom() {
    const { elements } = this;
    const bounds = elements.map(getGridBound);
    const bottom = Math.max(...bounds.map(b => b.maxY));

    elements.forEach((ele, index) => {
      const gridBound = bounds[index];
      const bound = Bound.deserialize(ele.xywh);
      const offset = bound.maxY - gridBound.maxY;
      bound.y = bottom - bound.h + offset;
      this._updateXYWH(ele, bound);
    });
  }

  private _alignVertically() {
    const { elements } = this;
    const bounds = elements.map(getGridBound);
    const top = Math.min(...bounds.map(b => b.minY));
    const bottom = Math.max(...bounds.map(b => b.maxY));
    const centerY = (top + bottom) / 2;

    elements.forEach(ele => {
      const bound = Bound.deserialize(ele.xywh);
      bound.y = centerY - bound.h / 2;
      this._updateXYWH(ele, bound);
    });
  }

  private _alignDistributeVertically() {
    const { elements } = this;

    elements.sort((a, b) => getGridBound(a).minY - getGridBound(b).minY);
    const bounds = elements.map(getGridBound);
    const top = bounds[0].minY;
    const bottom = bounds[bounds.length - 1].maxY;

    const totalHeight = bottom - top;
    const totalGap =
      totalHeight -
      elements.reduce((prev, ele) => prev + getGridBound(ele).h, 0);
    const gap = totalGap / (elements.length - 1);
    let next = bounds[0].maxY + gap;
    for (let i = 1; i < elements.length - 1; i++) {
      const bound = Bound.deserialize(elements[i].xywh);
      bound.y = next + bounds[i].h / 2 - bound.h / 2;
      next += gap + bounds[i].h;
      this._updateXYWH(elements[i], bound);
    }
  }

  override render() {
    return html`
      <edgeless-menu-button
        .iconInfo=${{
          icon: html`${AlignLeftIcon}${SmallArrowDownIcon}`,
          tooltip: 'Alignment',
        }}
        .menuChildren=${html`<edgeless-tool-icon-button
            @click=${() => this._alignLeft()}
            .tooltip=${'Align left'}
            >${AlignLeftIcon}</edgeless-tool-icon-button
          >
          <edgeless-tool-icon-button
            @click=${() => this._alignHorizontally()}
            .tooltip=${'Align horizontally'}
          >
            ${AlignHorizontallyIcon}
          </edgeless-tool-icon-button>

          <edgeless-tool-icon-button
            @click=${() => this._alignRight()}
            .tooltip=${'Align right'}
          >
            ${AlignRightIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button
            .disabled=${this.elements.length < 3}
            @click=${() => this._alignDistributeHorizontally()}
            .tooltip=${'Distribute horizontally'}
            }
          >
            ${AlignDistributeHorizontallyIcon}
          </edgeless-tool-icon-button>
          <menu-divider
            style=${styleMap({ height: '24px' })}
            .vertical=${true}
          ></menu-divider>

          <edgeless-tool-icon-button
            @click=${() => this._alignTop()}
            .tooltip=${'Align top'}
            >${AlignTopIcon}</edgeless-tool-icon-button
          >
          <edgeless-tool-icon-button
            @click=${() => this._alignVertically()}
            .tooltip=${'Align vertically'}
          >
            ${AlignVerticallyIcon}
          </edgeless-tool-icon-button>

          <edgeless-tool-icon-button
            @click=${() => this._alignBottom()}
            .tooltip=${'Align bottom'}
          >
            ${AlignBottomIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button
            .tooltip=${'Distribute vertically'}
            .disabled=${this.elements.length < 3}
            @click=${() => this._alignDistributeVertically()}
          >
            ${AlignDistributeVerticallyIcon}
          </edgeless-tool-icon-button> `}
      >
      </edgeless-menu-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-align-button': EdgelessAlignButton;
  }
}
