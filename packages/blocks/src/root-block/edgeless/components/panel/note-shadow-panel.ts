import { WithDisposable } from '@blocksuite/block-std';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { NOTE_SHADOWS } from '../../../../_common/edgeless/note/consts.js';
import {
  NoteNoShadowIcon,
  NoteShadowSampleIcon,
} from '../../../../_common/icons/edgeless.js';
import { getThemeMode } from '../../../../_common/utils/query.js';
import '../buttons/tool-icon-button.js';

const TOOLBAR_SHADOWS_LIGHT = [
  '',
  '0px 0.2px 4.8px 0px rgba(66, 65, 73, 0.2), 0px 0px 1.6px 0px rgba(66, 65, 73, 0.2)',
  '0px 9.6px 10.4px -4px rgba(66, 65, 73, 0.07), 0px 10.4px 7.2px -8px rgba(66, 65, 73, 0.22)',
  '0px 0px 0px 4px rgba(255, 255, 255, 1), 0px 1.2px 2.4px 4.8px rgba(66, 65, 73, 0.16)',
  '0px 5.2px 12px 0px rgba(66, 65, 73, 0.13), 0px 0px 0.4px 1px rgba(0, 0, 0, 0.06)',
  '0px 0px 0px 1.4px rgba(0, 0, 0, 1), 2.4px 2.4px 0px 1px rgba(0, 0, 0, 1)',
];

const TOOLBAR_SHADOWS_DARK = [
  '',
  '0px 0.2px 6px 0px rgba(0, 0, 0, 0.44), 0px 0px 2px 0px rgba(0, 0, 0, 0.66)',
  '0px 9.6px 10.4px -4px rgba(0, 0, 0, 0.66), 0px 10.4px 7.2px -8px rgba(0, 0, 0, 0.44)',
  '0px 1.2px 2.4px 4.8px rgba(0, 0, 0, 0.36), 0px 0px 0px 3.4px rgba(75, 75, 75, 1)',
  '0px 5.2px 12px 0px rgba(0, 0, 0, 0.66), 0px 0px 0.4px 1px rgba(0, 0, 0, 0.44)',
  '0px 0px 0px 1.4px rgba(178, 178, 178, 1), 2.4px 2.4px 0px 1px rgba(178, 178, 178, 1)',
];

const TOOLTIPS = [
  'No shadow',
  'Box shadow',
  'Sticker shadow',
  'Paper shadow',
  'Floation shadow',
  'Film shadow',
];

@customElement('edgeless-note-shadow-panel')
export class EdgelessNoteShadowPanel extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .item {
      padding: 8px;
      border-radius: 4px;
      display: flex;
      justify-content: center;
      align-items: center;
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

  override render() {
    const mode = getThemeMode();
    const SHADOWS =
      mode === 'dark' ? TOOLBAR_SHADOWS_DARK : TOOLBAR_SHADOWS_LIGHT;
    return repeat(
      NOTE_SHADOWS,
      shadow => shadow,
      (shadow, index) =>
        html`<style>
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
            <edgeless-tool-icon-button
              class="item-icon"
              .tooltip=${TOOLTIPS[index]}
              .tipPosition=${'bottom'}
              .iconContainerPadding=${0}
              style=${styleMap({
                boxShadow: `${SHADOWS[index]}`,
              })}
            >
              ${index === 0 ? NoteNoShadowIcon : NoteShadowSampleIcon}
            </edgeless-tool-icon-button>
          </div>`
    );
  }

  @property({ attribute: false })
  accessor background!: string;

  @property({ attribute: false })
  accessor onSelect!: (value: string) => void;

  @property({ attribute: false })
  accessor value!: string;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-note-shadow-panel': EdgelessNoteShadowPanel;
  }
}
