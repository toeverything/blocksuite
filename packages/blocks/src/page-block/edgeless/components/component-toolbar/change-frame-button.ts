import '../tool-icon-button.js';
import '../../toolbar/shape-tool/shape-menu.js';
import '../color-panel.js';

import type { Color } from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { WithDisposable } from '../../../../__internal__/utils/lit.js';
import { countBy, maxBy } from '../../../../__internal__/utils/std.js';
import type {
  TextMouseMode,
  TopLevelBlockModel,
} from '../../../../__internal__/utils/types.js';
import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';
import type { EdgelessSelectionState } from '../../selection-manager.js';
import type { ColorEvent } from '../color-panel.js';
import { createButtonPopper } from '../utils.js';

export const FRAME_BACKGROUND_COLORS: Color[] = [
  '#FBFAFC',
  '#FFF4D8',
  '#FFE1E1',
  '#DFF4E8',
  '#E1EFFF',
  '#F3F0FF',
];

function getMostCommonBackground(
  frames: TopLevelBlockModel[]
): TextMouseMode['background'] | undefined {
  const shapeTypes = countBy(frames, (frame: TopLevelBlockModel) => {
    return frame.background;
  });
  const max = maxBy(Object.entries(shapeTypes), ([k, count]) => count);
  return max ? (max[0] as TextMouseMode['background']) : undefined;
}

@customElement('edgeless-change-frame-button')
export class EdgelessChangeFrameButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: block;
      fill: none;
      stroke: currentColor;
      color: var(--affine-text-color);
    }

    edgeless-color-panel {
      display: none;
      width: 108px;
      height: 68px;
      padding: 8px 12px;
      flex-wrap: wrap;
      background: var(--affine-page-background);
      box-shadow: 0 0 12px rgba(66, 65, 73, 0.14);
      border-radius: 8px;
    }

    edgeless-color-panel[data-show] {
      display: flex;
    }

    .selected-background {
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      width: 16px;
      height: 16px;
      box-sizing: border-box;
      border-radius: 50%;
      color: var(--affine-text-color);
      font-size: 12px;
    }
  `;

  @property()
  frames: TopLevelBlockModel[] = [];

  @property()
  page!: Page;

  @property()
  selectionState!: EdgelessSelectionState;

  @property()
  slots!: EdgelessSelectionSlots;

  @state()
  private _popperShow = false;

  @query('edgeless-color-panel')
  private _colorSelector!: HTMLDivElement;

  private _colorSelectorPopper: ReturnType<typeof createButtonPopper> | null =
    null;

  private _renderSelectedColor(color: Color) {
    const style = { backgroundColor: color };

    return html`<div class="selected-background" style=${styleMap(style)}>
      A
    </div>`;
  }

  private _setBlockBackground(color: Color) {
    this.frames.forEach(frame => {
      this.page.updateBlock(frame, { background: color });
    });
    // FIXME: force update selection, because connector mode changed
    this.slots.selectionUpdated.emit({ ...this.selectionState });
  }

  override firstUpdated(changedProperties: Map<string, unknown>) {
    const _disposables = this._disposables;

    this._colorSelectorPopper = createButtonPopper(
      this,
      this._colorSelector,
      ({ display }) => {
        this._popperShow = display === 'show';
      }
    );
    _disposables.add(this._colorSelectorPopper);
    super.firstUpdated(changedProperties);
  }

  override render() {
    const selectedBackground =
      getMostCommonBackground(this.frames) || FRAME_BACKGROUND_COLORS[0];

    return html`
      <edgeless-tool-icon-button
        .tooltip=${this._popperShow ? '' : 'Color'}
        .active=${false}
        @tool.click=${() => this._colorSelectorPopper?.toggle()}
      >
        ${this._renderSelectedColor(selectedBackground)}
      </edgeless-tool-icon-button>
      <edgeless-color-panel
        .value=${selectedBackground}
        .options=${FRAME_BACKGROUND_COLORS}
        .showLetterMark=${true}
        @select=${(event: ColorEvent) => {
          this._setBlockBackground(event.detail);
        }}
      ></edgeless-color-panel>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-frame-button': EdgelessChangeFrameButton;
  }
}
