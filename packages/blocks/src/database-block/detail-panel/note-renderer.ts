import type { EditorHost } from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import {
  asyncFocusRichText,
  createDefaultDoc,
  matchFlavours,
} from '../../_common/utils/index.js';
import type { DetailSlotProps } from '../data-view/common/data-source/base.js';
import type { DataViewManager } from '../data-view/view/data-view-manager.js';
import type { DatabaseBlockModel } from '../database-model.js';

@customElement('database-datasource-note-renderer')
export class NoteRenderer
  extends WithDisposable(ShadowlessElement)
  implements DetailSlotProps
{
  get databaseBlock(): DatabaseBlockModel {
    return this.model;
  }

  static override styles = css`
    database-datasource-note-renderer {
      width: 100%;
      --affine-editor-side-padding: 0;
      flex: 1;
    }
  `;

  @property({ attribute: false })
  accessor view!: DataViewManager;

  @property({ attribute: false })
  accessor rowId!: string;

  @property({ attribute: false })
  accessor model!: DatabaseBlockModel;

  @property({ attribute: false })
  accessor host!: EditorHost;

  @query('editor-host')
  accessor subHost!: EditorHost;

  protected override render(): unknown {
    if (
      !this.model.doc.awarenessStore.getFlag('enable_database_attachment_note')
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
    const pageId = this.databaseBlock.notes?.[this.rowId];
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
    return html`${host.renderSpecPortal(page, host.specs)} `;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.databaseBlock.propsUpdated.on(({ key }) => {
      if (key === 'notes') {
        this.requestUpdate();
      }
    });
  }

  addNote() {
    const collection = this.host?.std.collection;
    if (!collection) {
      return;
    }
    if (!this.databaseBlock.notes) {
      this.databaseBlock.notes = {};
    }
    const note = createDefaultDoc(collection);
    if (note) {
      this.databaseBlock.notes[this.rowId] = note.id;
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
          asyncFocusRichText(this.subHost, block.id)?.catch(console.error);
        }
      });
    }
  }
}
