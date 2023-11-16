import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  NoteNoShadowIcon,
  NoteShadowSampleIcon,
} from '../../../../_common/icons/edgeless.js';
import { NOTE_SHADOWS } from '../../../../note-block/index.js';

@customElement('edgeless-note-shadow-panel')
export class EdgelessNoteShadowPanel extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      width: 506.5px;
      height: 104px;
      border-radius: 8px;
      padding: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--affine-background-overlay-panel-color);
      gap: 8px;
      box-shadow: var(--affine-shadow-2);
    }

    .item {
      width: 75.08px;
      height: 88px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 8px;
      cursor: pointer;
    }

    .item-icon {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .item:hover {
      background-color: var(--affine-hover-color);
    }
  `;

  @property({ attribute: false })
  value!: string;

  @property({ attribute: false })
  background!: string;

  @property({ attribute: false })
  onSelect!: (value: string) => void;

  override render() {
    return html`${repeat(
      NOTE_SHADOWS,
      shadow => shadow,
      (shadow, index) => {
        return html`
          <style>
            .item-icon svg rect:first-of-type {
              fill: var(${this.background});
            }
          </style>
          <div
            class="item"
            @click=${() => this.onSelect(shadow)}
            style=${styleMap({
              border:
                this.value === shadow
                  ? '1px solid var(--affine-brand-color)'
                  : 'none',
            })}
          >
            <div
              class="item-icon"
              style=${styleMap({
                boxShadow: `var(${shadow})`,
              })}
            >
              ${index === 0 ? NoteNoShadowIcon : NoteShadowSampleIcon}
            </div>
          </div>
        `;
      }
    )} `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-note-shadow-panel': EdgelessNoteShadowPanel;
  }
}
