import type { MicrosheetBlockModel } from '@blocksuite/affine-model';
import type {
  DetailSlotProps,
  SingleView,
} from '@blocksuite/microsheet-data-view';

import { focusTextModel } from '@blocksuite/affine-components/rich-text';
import {
  createDefaultDoc,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';
import {
  BlockStdScope,
  type EditorHost,
  ShadowlessElement,
} from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/global/utils';
import { css, html } from 'lit';
import { property, query } from 'lit/decorators.js';
export class NoteRenderer
  extends WithDisposable(ShadowlessElement)
  implements DetailSlotProps
{
  static override styles = css`
    microsheet-datasource-note-renderer {
      width: 100%;
      --affine-editor-side-padding: 0;
      flex: 1;
    }
  `;

  get microsheetBlock(): MicrosheetBlockModel {
    return this.model;
  }

  addNote() {
    const collection = this.host?.std.collection;
    if (!collection) {
      return;
    }
    if (!this.microsheetBlock.notes) {
      this.microsheetBlock.notes = {};
    }
    const note = createDefaultDoc(collection);
    if (note) {
      this.microsheetBlock.notes[this.rowId] = note.id;
      this.requestUpdate();
      requestAnimationFrame(() => {
        const block = note.root?.children
          .find(child => child.flavour === 'affine:note')
          ?.children.find(block =>
            matchFlavours(block, [
              'affine:paragraph',
              'affine:list',
              'affine:code',
            ])
          );
        if (this.subHost && block) {
          focusTextModel(this.subHost.std, block.id);
        }
      });
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    this.microsheetBlock.propsUpdated.on(({ key }) => {
      if (key === 'notes') {
        this.requestUpdate();
      }
    });
  }

  protected override render(): unknown {
    if (
      !this.model.doc.awarenessStore.getFlag(
        'enable_microsheet_attachment_note'
      )
    ) {
      return null;
    }
    return html`
      <div
        style="height: 1px;max-width: var(--affine-editor-width);background-color: var(--affine-border-color);margin: auto;margin-bottom: 16px"
      ></div>
      ${this.renderNote()}
    `;
  }

  renderNote() {
    const host = this.host;
    const std = host?.std;
    if (!std || !host) {
      return;
    }
    const pageId = this.microsheetBlock.notes?.[this.rowId];
    if (!pageId) {
      return html` <div>
        <div
          @click="${this.addNote}"
          style="max-width: var(--affine-editor-width);margin: auto;cursor: pointer;color: var(--affine-text-disable-color)"
        >
          Click to add note
        </div>
      </div>`;
    }
    const page = std.collection.getDoc(pageId);
    if (!page) {
      return;
    }
    const previewStd = new BlockStdScope({
      doc: page,
      extensions: std.userExtensions,
    });
    return html`${previewStd.render()} `;
  }

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor model!: MicrosheetBlockModel;

  @property({ attribute: false })
  accessor rowId!: string;

  @query('editor-host')
  accessor subHost!: EditorHost;

  @property({ attribute: false })
  accessor view!: SingleView;
}
