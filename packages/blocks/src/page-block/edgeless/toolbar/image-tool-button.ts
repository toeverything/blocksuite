import '../components/tool-icon-button.js';

import { NewImageIcon } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  type MouseMode,
  Point,
  uploadImageFromLocal,
} from '../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';

@customElement('edgeless-image-tool-button')
export class EdgelessImageToolButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
    }

    edgeless-tool-icon-button svg:hover {
      transform: translateY(-8px);
    }
  `;

  @property({ attribute: false })
  mouseMode!: MouseMode;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  constructor(edgeless: EdgelessPageBlockComponent) {
    super();
    this.edgeless = edgeless;
  }

  private iconButtonStyles = `
        --hover-color: transparent;
        --active-color: var(--affine-primary-color);
    `;

  private _imageLoading = false;

  private async _addImage() {
    this._imageLoading = true;
    const options = {
      width: 0,
      height: 0,
      offsetX: 0,
      offsetY: 0,
    };

    const models = await uploadImageFromLocal(this.edgeless.page, realSize =>
      Object.assign(options, realSize)
    );

    const { left, width, top, height } =
      this.edgeless.pageBlockContainer.getBoundingClientRect();

    if (options.width && options.height) {
      const s = width / height;
      const sh = height > 100 ? height - 100 : height;
      const p = options.width / options.height;
      if (s >= 1) {
        options.height = Math.min(options.height, sh);
        options.width = p * options.height;
      } else {
        const sw = sh * s;
        options.width = Math.min(options.width, sw);
        options.height = options.width / p;
      }
    }

    const { zoom } = this.edgeless.surface.viewport;
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    let x = 0;
    let y = 0;
    if (zoom > 1) {
      x = centerX - options.width / 2;
      y = centerY - options.height / 2;
      options.width /= zoom;
      options.height /= zoom;
    } else {
      x = centerX - (options.width * zoom) / 2;
      y = centerY - (options.height * zoom) / 2;
    }

    const { noteId } = this.edgeless.addNewNote(
      models,
      new Point(x, y),
      options
    );
    const note = this.edgeless.notes.find(note => note.id === noteId);
    assertExists(note);

    this.edgeless.selection.switchToDefaultMode({
      selected: [note],
      active: false,
    });

    this._imageLoading = false;
  }

  override render() {
    return html`
      <edgeless-tool-icon-button
        style=${this.iconButtonStyles}
        .disabled=${this._imageLoading}
        .tooltip=${'Image'}
        @click=${() => this._addImage()}
      >
        ${NewImageIcon}
      </edgeless-tool-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-image-tool-button': EdgelessImageToolButton;
  }
}
