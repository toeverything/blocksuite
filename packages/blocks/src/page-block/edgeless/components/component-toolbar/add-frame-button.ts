import '../buttons/tool-icon-button.js';

import { AddFrameButtonIcon } from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import { assertExists } from '@blocksuite/store';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import * as Y from 'yjs';

import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { getSelectedBound } from '../../services/tools-manager.js';

const MIN_FRAME_WIDTH = 800;
const MIN_FRAME_HEIGHT = 640;
const FRAME_PADDING = 40;

@customElement('edgeless-add-frame-button')
export class EdgelessAddFrameButton extends WithDisposable(LitElement) {
  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  protected override render() {
    const frames = this.edgeless.frame.frames;
    const { surface } = this.edgeless;
    return html`<edgeless-tool-icon-button
      @click=${() => {
        let bound = getSelectedBound(this.edgeless.selection.elements);
        bound = bound.expand(FRAME_PADDING);
        if (bound.w < MIN_FRAME_WIDTH) {
          const offset = (MIN_FRAME_WIDTH - bound.w) / 2;
          bound = bound.expand(offset, 0);
        }
        if (bound.h < MIN_FRAME_HEIGHT) {
          const offset = (MIN_FRAME_HEIGHT - bound.h) / 2;
          bound = bound.expand(0, offset);
        }
        const id = surface.addElement('frame', {
          title: new Y.Text(`Frame ${frames.length + 1}`),
          batch: 'a0',
          xywh: bound.serialize(),
        });
        this.edgeless.page.captureSync();
        const frame = surface.pickById(id);
        assertExists(frame);
        this.edgeless.selection.setSelection({
          elements: [frame.id],
          editing: false,
        });
      }}
    >
      ${AddFrameButtonIcon}
    </edgeless-tool-icon-button>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-add-frame-button': EdgelessAddFrameButton;
  }
}
