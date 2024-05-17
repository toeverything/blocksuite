import type { EditorHost } from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { createDefaultDoc } from '../../_common/utils/index.js';
import type { DetailSlotProps } from '../data-view/common/data-source/base.js';
import type { DataViewManager } from '../data-view/view/data-view-manager.js';
import type { DatabaseBlockModel } from '../database-model.js';

@customElement('database-datasource-note-renderer')
export class NoteRenderer
  extends WithDisposable(ShadowlessElement)
  implements DetailSlotProps
{
  static override styles = css`
    database-datasource-note-renderer {
      width: 100%;
      --affine-editor-side-padding: 0;
    }
  `;
  @property({ attribute: false })
  public view!: DataViewManager;
  @property({ attribute: false })
  public rowId!: string;
  @property({ attribute: false })
  model!: DatabaseBlockModel;
  host?: EditorHost;

  get databaseBlock(): DatabaseBlockModel {
    return this.model;
  }

  public override connectedCallback() {
    super.connectedCallback();
    this.host = this.closest('editor-host') ?? undefined;
    this.databaseBlock.propsUpdated.on(({ key }) => {
      if (key === 'notes') {
        this.requestUpdate();
      }
    });
    this.disposables.addFromEvent(this, 'selectionchange', e => {
      e.stopPropagation();
    });
    this.disposables.addFromEvent(this, 'beforeinput', e => {
      e.stopPropagation();
    });
    this.disposables.addFromEvent(this, 'keydown', e => {
      e.stopPropagation();
    });
  }

  public addNote() {
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
    }
  }

  protected override render(): unknown {
    if (
      !this.model.doc.awarenessStore.getFlag('enable_database_attachment_note')
    ) {
      return null;
    }
    const host = this.host;
    const std = host?.std;
    if (!std || !host) {
      return;
    }
    const pageId = this.databaseBlock.notes?.[this.rowId];
    if (!pageId) {
      return html` <div @click="${this.addNote}">Click to add note</div>`;
    }
    const page = std.collection.getDoc(pageId);
    if (!page) {
      return;
    }
    return html`${host.renderSpecPortal(page, host.specs)} `;
  }
}
