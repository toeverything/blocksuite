import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { EdgelessImageIcon } from '../../../../../_common/icons/edgeless.js';
import { getImageFilesFromLocal } from '../../../../../_common/utils/filesys.js';
import type { EdgelessTool } from '../../../types.js';
import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';

@customElement('edgeless-image-tool-button')
export class EdgelessImageToolButton extends EdgelessToolbarToolMixin(
  LitElement
) {
  @state()
  private accessor _imageLoading = false;

  // There is no 'image' type, just use 'default' here, since image has no active state
  override type: EdgelessTool['type'] = 'default';

  private async _addImages() {
    this._imageLoading = true;
    const imageFiles = await getImageFilesFromLocal();
    await this.edgeless.addImages(imageFiles);
    this._imageLoading = false;
  }

  override render() {
    const { _imageLoading, _addImages } = this;
    return html`<edgeless-toolbar-button
      class="transform-button"
      .disabled=${_imageLoading}
      .activeMode=${'background'}
      .tooltip=${'Image'}
      .tooltipOffset=${12}
      @click=${_addImages}
    >
      ${EdgelessImageIcon}
    </edgeless-toolbar-button>`;
  }
}
