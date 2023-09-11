import './tool-icon-button.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { type TemplateResult } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { createButtonPopper } from '../utils.js';

@customElement('edgeless-menu-button')
export class EdgelessMenuButton extends WithDisposable(LitElement) {
  static override styles = css`
    .edgeless-component-panel-wrapper {
      display: none;
      padding: var(--edgeless-component-panel-padding);
      gap: var(--edgeless-component-panel-gap);
      justify-content: center;
      align-items: center;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
    }

    .edgeless-component-panel-wrapper[data-show] {
      display: flex;
    }
  `;
  @property({ attribute: false })
  iconInfo!: { icon: TemplateResult<1>; tooltip: string };

  @property({ attribute: false })
  menuChildren!: TemplateResult<1>;

  @property({ attribute: false })
  padding = 4;

  @property({ attribute: false })
  gap = 0;

  @query('.edgeless-component-panel-wrapper')
  private _panelWrapper!: HTMLDivElement;

  private _menuPopper!: ReturnType<typeof createButtonPopper>;
  override firstUpdated() {
    this._menuPopper = createButtonPopper(this, this._panelWrapper);
    this._disposables.add(this._menuPopper);
  }

  override render() {
    const { iconInfo } = this;
    const componentPanelStyles = styleMap({
      '--edgeless-component-panel-padding': `${this.padding}px`,
      '--edgeless-component-panel-gap': `${this.gap}px`,
    });
    return html`<edgeless-tool-icon-button
        .tooltip=${iconInfo.tooltip}
        .tipPosition=${'bottom'}
        .iconContainerPadding=${2}
        @click=${() => this._menuPopper.toggle()}
      >
        ${iconInfo.icon}
      </edgeless-tool-icon-button>
      <div
        class="edgeless-component-panel-wrapper"
        style=${componentPanelStyles}
      >
        ${this.menuChildren}
      </div> `;
  }
}
