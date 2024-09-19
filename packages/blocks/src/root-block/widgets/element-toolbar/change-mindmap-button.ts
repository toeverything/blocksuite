import type {
  MindmapElementModel,
  ShapeElementModel,
} from '@blocksuite/affine-model';

import {
  MindmapBalanceLayoutIcon,
  MindmapLeftLayoutIcon,
  MindmapRightLayoutIcon,
  MindmapStyleFour,
  MindmapStyleIcon,
  MindmapStyleOne,
  MindmapStyleThree,
  MindmapStyleTwo,
  SmallArrowDownIcon,
} from '@blocksuite/affine-components/icons';
import { renderToolbarSeparator } from '@blocksuite/affine-components/toolbar';
import { LayoutType, MindmapStyle } from '@blocksuite/affine-model';
import { EditPropsStore } from '@blocksuite/affine-shared/services';
import { countBy, maxBy, WithDisposable } from '@blocksuite/global/utils';
import { css, html, LitElement, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { join } from 'lit/directives/join.js';
import { repeat } from 'lit/directives/repeat.js';

import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

const MINDMAP_STYLE_LIST = [
  {
    value: MindmapStyle.ONE,
    icon: MindmapStyleOne,
  },
  {
    value: MindmapStyle.FOUR,
    icon: MindmapStyleFour,
  },
  {
    value: MindmapStyle.THREE,
    icon: MindmapStyleThree,
  },
  {
    value: MindmapStyle.TWO,
    icon: MindmapStyleTwo,
  },
];

interface LayoutItem {
  name: string;
  value: LayoutType;
  icon: TemplateResult<1>;
}

const MINDMAP_LAYOUT_LIST: LayoutItem[] = [
  {
    name: 'Left',
    value: LayoutType.LEFT,
    icon: MindmapLeftLayoutIcon,
  },
  {
    name: 'Radial',
    value: LayoutType.BALANCE,
    icon: MindmapBalanceLayoutIcon,
  },
  {
    name: 'Right',
    value: LayoutType.RIGHT,
    icon: MindmapRightLayoutIcon,
  },
] as const;

export class EdgelessChangeMindmapStylePanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: row;
      gap: 8px;
      background: var(--affine-background-overlay-panel-color);
    }

    .style-item {
      border-radius: 4px;
    }

    .style-item > svg {
      vertical-align: middle;
    }

    .style-item.active,
    .style-item:hover {
      cursor: pointer;
      background-color: var(--affine-hover-color);
    }
  `;

  override render() {
    return repeat(
      MINDMAP_STYLE_LIST,
      item => item.value,
      ({ value, icon }) => html`
        <div
          role="button"
          class="style-item ${value === this.mindmapStyle ? 'active' : ''}"
          @click=${() => this.onSelect(value)}
        >
          ${icon}
        </div>
      `
    );
  }

  @property({ attribute: false })
  accessor mindmapStyle!: MindmapStyle | null;

  @property({ attribute: false })
  accessor onSelect!: (style: MindmapStyle) => void;
}

export class EdgelessChangeMindmapLayoutPanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: row;
      gap: 8px;
    }
  `;

  override render() {
    return repeat(
      MINDMAP_LAYOUT_LIST,
      item => item.value,
      ({ name, value, icon }) => html`
        <editor-icon-button
          aria-label=${name}
          .tooltip=${name}
          .tipPosition=${'top'}
          .active=${this.mindmapLayout === value}
          .activeMode=${'background'}
          @click=${() => this.onSelect(value)}
        >
          ${icon}
        </editor-icon-button>
      `
    );
  }

  @property({ attribute: false })
  accessor mindmapLayout!: LayoutType | null;

  @property({ attribute: false })
  accessor onSelect!: (style: LayoutType) => void;
}

export class EdgelessChangeMindmapButton extends WithDisposable(LitElement) {
  private _updateLayoutType = (layoutType: LayoutType) => {
    this.edgeless.std.get(EditPropsStore).recordLastProps('mindmap', {
      layoutType,
    });
    this.elements.forEach(element => {
      element.layoutType = layoutType;
      element.layout();
    });
    this.layoutType = layoutType;
  };

  private _updateStyle = (style: MindmapStyle) => {
    this.edgeless.std.get(EditPropsStore).recordLastProps('mindmap', { style });
    this._mindmaps.forEach(element => (element.style = style));
  };

  private get _mindmaps() {
    const mindmaps = new Set<MindmapElementModel>();

    return this.elements.reduce((_, el) => {
      mindmaps.add(el);

      return mindmaps;
    }, mindmaps);
  }

  get layout() {
    const layoutType = this.layoutType ?? this._getCommonLayoutType();
    return MINDMAP_LAYOUT_LIST.find(item => item.value === layoutType)!;
  }

  private _getCommonLayoutType() {
    const values = countBy(this.elements, element => element.layoutType);
    const max = maxBy(Object.entries(values), ([_k, count]) => count);
    return max ? (Number(max[0]) as LayoutType) : LayoutType.BALANCE;
  }

  private _getCommonStyle() {
    const values = countBy(this.elements, element => element.style);
    const max = maxBy(Object.entries(values), ([_k, count]) => count);
    return max ? (Number(max[0]) as MindmapStyle) : MindmapStyle.ONE;
  }

  private _isSubnode() {
    return (
      this.nodes.length === 1 &&
      (this.nodes[0].group as MindmapElementModel).tree.element !==
        this.nodes[0]
    );
  }

  override render() {
    return join(
      [
        html`
          <editor-menu-button
            .contentPadding=${'8px'}
            .button=${html`
              <editor-icon-button aria-label="Style" .tooltip=${'Style'}>
                ${MindmapStyleIcon}${SmallArrowDownIcon}
              </editor-icon-button>
            `}
          >
            <edgeless-change-mindmap-style-panel
              .mindmapStyle=${this._getCommonStyle()}
              .onSelect=${this._updateStyle}
            >
            </edgeless-change-mindmap-style-panel>
          </editor-menu-button>
        `,

        this._isSubnode()
          ? nothing
          : html`
              <editor-menu-button
                .button=${html`
                  <editor-icon-button aria-label="Layout" .tooltip=${'Layout'}>
                    ${this.layout.icon}${SmallArrowDownIcon}
                  </editor-icon-button>
                `}
              >
                <edgeless-change-mindmap-layout-panel
                  .mindmapLayout=${this.layout.value}
                  .onSelect=${this._updateLayoutType}
                >
                </edgeless-change-mindmap-layout-panel>
              </editor-menu-button>
            `,
      ].filter(button => button !== nothing),
      renderToolbarSeparator
    );
  }

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor elements!: MindmapElementModel[];

  @state()
  accessor layoutType!: LayoutType;

  @property({ attribute: false })
  accessor nodes!: ShapeElementModel[];
}

export function renderMindmapButton(
  edgeless: EdgelessRootBlockComponent,
  elements?: (ShapeElementModel | MindmapElementModel)[]
) {
  if (!elements?.length) return nothing;

  const mindmaps: MindmapElementModel[] = [];

  elements.forEach(e => {
    if (e.type === 'mindmap') {
      mindmaps.push(e as MindmapElementModel);
    }

    const group = edgeless.service.surface.getGroup(e.id);

    if (group?.type === 'mindmap') {
      mindmaps.push(group as MindmapElementModel);
    }
  });

  if (mindmaps.length === 0) {
    return nothing;
  }

  return html`
    <edgeless-change-mindmap-button
      .elements=${mindmaps}
      .nodes=${elements.filter(e => e.type === 'shape')}
      .edgeless=${edgeless}
    >
    </edgeless-change-mindmap-button>
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-mindmap-style-panel': EdgelessChangeMindmapStylePanel;
    'edgeless-change-mindmap-layout-panel': EdgelessChangeMindmapLayoutPanel;
    'edgeless-change-mindmap-button': EdgelessChangeMindmapButton;
  }
}
