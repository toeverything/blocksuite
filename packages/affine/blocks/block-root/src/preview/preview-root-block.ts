import { NoteBlockModel, NoteDisplayMode } from '@blocksuite/affine-model';
import { matchModels } from '@blocksuite/affine-shared/utils';
import { BlockComponent } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

import { ReadOnlyClipboard } from '../clipboard/readonly-clipboard';

export class PreviewRootBlockComponent extends BlockComponent {
  static override styles = css`
    affine-preview-root {
      display: block;
    }
  `;

  clipboardController = new ReadOnlyClipboard(this);

  override connectedCallback() {
    super.connectedCallback();
    this.clipboardController.hostConnected();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.clipboardController.hostDisconnected();
  }

  override renderBlock() {
    const widgets = html`${repeat(
      Object.entries(this.widgets),
      ([id]) => id,
      ([_, widget]) => widget
    )}`;

    const children = this.renderChildren(this.model, child => {
      const isNote = matchModels(child, [NoteBlockModel]);
      const note = child as NoteBlockModel;
      const displayOnEdgeless =
        !!note.props.displayMode &&
        note.props.displayMode === NoteDisplayMode.EdgelessOnly;
      // Should remove deprecated `hidden` property in the future
      return !(isNote && displayOnEdgeless);
    });

    return html`<div class="affine-preview-root">${children} ${widgets}</div>`;
  }
}
