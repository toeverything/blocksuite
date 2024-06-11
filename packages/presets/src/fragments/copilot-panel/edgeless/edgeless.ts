import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { FrameBlockModel } from '@blocksuite/blocks';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  FastImage2ImageServiceKind,
  Image2ImageServiceKind,
  Image2TextServiceKind,
  Text2ImageServiceKind,
} from '../copilot-service/service-base.js';
import type { AILogic } from '../logic.js';
import {
  getSurfaceElementFromEditor,
  stopPropagation,
} from '../utils/selection-utils.js';

@customElement('copilot-edgeless-panel')
export class CopilotEdgelessPanel extends WithDisposable(ShadowlessElement) {
  static override styles = css``;

  @property({ attribute: false })
  accessor logic!: AILogic;

  get host() {
    return this.logic.getHost();
  }

  protected override render(): unknown {
    const frames = getSurfaceElementFromEditor(this.host).model.children.filter(
      v => v instanceof FrameBlockModel
    ) as FrameBlockModel[];
    const changeFromFrame = (e: Event) => {
      this.logic.edgeless.fromFrame = (e.target as HTMLSelectElement).value;
    };
    const toggleAutoGen = () => {
      this.logic.edgeless.toggleAutoGen();
      this.requestUpdate();
    };
    return html`
      <div class="copilot-box">
        <div
          class="copilot-panel-action-button"
          @click="${this.logic.edgeless.makeItReal}"
        >
          Make It Real
        </div>
        <div class="copilot-panel-action-description">
          Select some shapes and text to generate html
        </div>
        <div style="display:flex;gap: 8px;flex-direction: column">
          <div
            style="font-size: 12px;color:var(--affine-text-secondary-color);"
          >
            service:
          </div>
          <vendor-service-select
            .featureKey="${'make it real'}"
            .service="${Image2TextServiceKind}"
          ></vendor-service-select>
        </div>
      </div>
      <div class="copilot-box">
        <div
          class="copilot-panel-action-button"
          @click="${this.logic.edgeless.createImage}"
        >
          Create Image
        </div>
        <input
          id="copilot-panel-create-image-prompt"
          class="copilot-panel-action-prompt"
          type="text"
          @keydown="${stopPropagation}"
          placeholder="Prompt"
        />
        <div class="copilot-panel-action-description">
          Type prompt to create an image.
        </div>
        <div style="display:flex;gap: 8px;flex-direction: column">
          <div
            style="font-size: 12px;color:var(--affine-text-secondary-color);"
          >
            service:
          </div>
          <vendor-service-select
            .featureKey="${'text to image'}"
            .service="${Text2ImageServiceKind}"
          ></vendor-service-select>
        </div>
      </div>
      <div class="copilot-box">
        <div
          class="copilot-panel-action-button"
          @click="${this.logic.edgeless.editImage}"
        >
          Edit Image
        </div>
        <input
          id="copilot-panel-edit-image-prompt"
          class="copilot-panel-action-prompt"
          type="text"
          @keydown="${stopPropagation}"
          placeholder="Prompt"
        />
        <div class="copilot-panel-action-description">
          Select some shapes and type prompt to edit them.
        </div>
        <div style="display:flex;gap: 8px;flex-direction: column">
          <div
            style="font-size: 12px;color:var(--affine-text-secondary-color);"
          >
            service:
          </div>
          <vendor-service-select
            .featureKey="${'edit image'}"
            .service="${Image2ImageServiceKind}"
          ></vendor-service-select>
        </div>
      </div>
      <div class="copilot-box">
        <div
          class="copilot-panel-action-button"
          @click="${this.logic.edgeless.htmlBlockDemo}"
        >
          HTML Block Test
        </div>
        <div class="copilot-panel-action-description">
          Generate a html block
        </div>
      </div>
      <div class="copilot-box">
        <div @click="${toggleAutoGen}" class="copilot-panel-action-button">
          ${this.logic.edgeless.autoGen
            ? 'Stop auto gen image'
            : 'Start auto gen image'}
        </div>
        <div class="copilot-panel-action-description">
          <div>
            Based on the shapes in frame
            <select
              .value="${this.logic.edgeless.fromFrame}"
              @change="${changeFromFrame}"
            >
              <option value="">None</option>
              ${frames.map(v => {
                return html` <option .value="${v.id}">
                  ${v.title.toString()}
                </option>`;
              })}
            </select>
          </div>
          <div>Generate images to all connected frames</div>
        </div>
        <div style="display:flex;gap: 8px;flex-direction: column">
          <div
            style="font-size: 12px;color:var(--affine-text-secondary-color);"
          >
            service:
          </div>
          <vendor-service-select
            .featureKey="${'real time image to image'}"
            .service="${FastImage2ImageServiceKind}"
          ></vendor-service-select>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'copilot-edgeless-panel': CopilotEdgelessPanel;
  }
}
