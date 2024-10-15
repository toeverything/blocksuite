import { LayoutableMindmapElementModel } from '@blocksuite/affine-block-surface';
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
  EdgelessTextBlockModel,
  MindmapElementModel,
} from '@blocksuite/affine-model';
import {
  type GfxContainerElement,
  type GfxModel,
  isGfxContainerElm,
} from '@blocksuite/block-std/gfx';
import { Bound, WithDisposable } from '@blocksuite/global/utils';
import { AutoTidyUpIcon, ResizeTidyUpIcon } from '@blocksuite/icons/lit';
import { css, html, LitElement, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import chunk from 'lodash.chunk';

import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

const enum Alignment {
  AutoArrange = 'Auto arrange',
  AutoResize = 'Resize & Align',
  Bottom = 'Align bottom',
  DistributeHorizontally = 'Distribute horizontally',
  DistributeVertically = 'Distribute vertically',
  Horizontally = 'Align horizontally',
  Left = 'Align left',
  Right = 'Align right',
  Top = 'Align top',
  Vertically = 'Align vertically',
}

const ALIGN_HEIGHT = 200;
const ALIGN_PADDING = 20;

interface AlignmentIcon {
  name: Alignment;
  content: TemplateResult<1>;
}

const HORIZONTAL_ALIGNMENT: AlignmentIcon[] = [
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
];

const VERTICAL_ALIGNMENT: AlignmentIcon[] = [
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
];

const AUTO_ALIGNMENT: AlignmentIcon[] = [
  {
    name: Alignment.AutoArrange,
    content: AutoTidyUpIcon({ width: '20px', height: '20px' }),
  },
  {
    name: Alignment.AutoResize,
    content: ResizeTidyUpIcon({ width: '20px', height: '20px' }),
  },
];

export class EdgelessAlignButton extends WithDisposable(LitElement) {
  static override styles = css`
    .align-menu-content {
      max-width: 120px;
      flex-wrap: wrap;
      padding: 8px 2px;
    }
    .align-menu-separator {
      width: 120px;
      height: 1px;
      background-color: var(--affine-background-tertiary-color);
    }
  `;

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
      case Alignment.AutoArrange:
        this._alignAutoArrange();
        break;
      case Alignment.AutoResize:
        this._alignAutoResize();
        break;
    }
  }

  private _alignAutoArrange() {
    const chunks = this._splitElementsToChunks(this.elements);
    // update element XY
    const startX: number = chunks[0][0].elementBound.x;
    let startY: number = chunks[0][0].elementBound.y;
    chunks.forEach(items => {
      let posX = startX;
      let maxHeight = 0;
      items.forEach(ele => {
        const { x: eleX, y: eleY } = ele.elementBound;
        const bound = Bound.deserialize(ele.xywh);
        const xOffset = bound.x - eleX;
        const yOffset = bound.y - eleY;
        bound.x = posX + xOffset;
        bound.y = startY + yOffset;
        this._updateXYWH(ele, bound);
        if (ele.elementBound.h > maxHeight) {
          maxHeight = ele.elementBound.h;
        }
        posX += ele.elementBound.w + ALIGN_PADDING;
      });
      startY += maxHeight + ALIGN_PADDING;
    });
  }

  private _alignAutoResize() {
    // resize to fixed height
    this.elements.forEach(ele => {
      if (
        ele instanceof ConnectorElementModel ||
        ele instanceof EdgelessTextBlockModel ||
        ele instanceof LayoutableMindmapElementModel
      ) {
        return;
      }
      const bound = Bound.deserialize(ele.xywh);
      const scale = ALIGN_HEIGHT / ele.elementBound.h;
      bound.h = scale * bound.h;
      bound.w = scale * bound.w;
      this._updateXYWH(ele, bound);
    });
    // arrange
    this._alignAutoArrange();
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

  private _splitElementsToChunks(models: GfxModel[]) {
    const sortByCenterX = (a: GfxModel, b: GfxModel) =>
      a.elementBound.center[0] - b.elementBound.center[0];
    const sortByCenterY = (a: GfxModel, b: GfxModel) =>
      a.elementBound.center[1] - b.elementBound.center[1];
    const elements = models.filter(ele => {
      if (
        ele instanceof ConnectorElementModel &&
        (ele.target.id || ele.source.id)
      ) {
        return false;
      }
      return true;
    });
    elements.sort(sortByCenterY);
    const chunks = chunk(elements, 4);
    chunks.forEach(items => items.sort(sortByCenterX));
    return chunks;
  }

  private _updatChildElementsXYWH(
    container: GfxContainerElement,
    targetBound: Bound
  ) {
    const containerBound = Bound.deserialize(container.xywh);
    const scaleX = targetBound.w / containerBound.w;
    const scaleY = targetBound.h / containerBound.h;
    container.childElements.forEach(child => {
      const childBound = Bound.deserialize(child.xywh);
      childBound.x = targetBound.x + scaleX * (childBound.x - containerBound.x);
      childBound.y = targetBound.y + scaleY * (childBound.y - containerBound.y);
      childBound.w = scaleX * childBound.w;
      childBound.h = scaleY * childBound.h;
      this._updateXYWH(child, childBound);
    });
  }

  private _updateXYWH(ele: BlockSuite.EdgelessModel, bound: Bound) {
    if (ele instanceof ConnectorElementModel) {
      ele.moveTo(bound);
    } else if (ele instanceof LayoutableMindmapElementModel) {
      const rootId = ele.tree.id;
      const rootEle = ele.childElements.find(child => child.id === rootId);
      if (rootEle) {
        const rootBound = Bound.deserialize(rootEle.xywh);
        rootBound.x += bound.x - ele.x;
        rootBound.y += bound.y - ele.y;
        this._updateXYWH(rootEle, rootBound);
      }
      ele.layout();
    } else if (isGfxContainerElm(ele)) {
      this._updatChildElementsXYWH(ele, bound);
      this.edgeless.service.updateElement(ele.id, {
        xywh: bound.serialize(),
      });
    } else {
      this.edgeless.service.updateElement(ele.id, {
        xywh: bound.serialize(),
      });
    }
  }

  private renderIcons(icons: AlignmentIcon[]) {
    return html`
      ${repeat(
        icons,
        (item, index) => item.name + index,
        ({ name, content }) => {
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
    `;
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
        <div class="align-menu-content">
          ${this.renderIcons(HORIZONTAL_ALIGNMENT)}
          ${this.renderIcons(VERTICAL_ALIGNMENT)}
          <div class="align-menu-separator"></div>
          ${this.renderIcons(AUTO_ALIGNMENT)}
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
