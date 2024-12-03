import type {
  DatabaseBlockModel,
  RootBlockModel,
} from '@blocksuite/affine-model';
import type { AffineTextAttributes } from '@blocksuite/affine-shared/types';
import type { DetailSlotProps, SingleView } from '@blocksuite/data-view';
import type { BaseTextAttributes } from '@blocksuite/inline';

import { REFERENCE_NODE } from '@blocksuite/affine-components/rich-text';
import {
  createDefaultDoc,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';
import { type EditorHost, ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { computed } from '@preact/signals-core';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';

import { isPureText } from '../utils/title-doc.js';

export class NoteRenderer
  extends SignalWatcher(WithDisposable(ShadowlessElement))
  implements DetailSlotProps
{
  static override styles = css`
    database-datasource-note-renderer {
      width: 100%;
      --affine-editor-side-padding: 0;
      flex: 1;
    }
  `;

  @property({ attribute: false })
  accessor rowId!: string;

  rowText$ = computed(() => {
    return this.databaseBlock.doc.getBlock(this.rowId)?.model?.text;
  });

  allowCreateDoc$ = computed(() => {
    return isPureText(this.rowText$.value);
  });

  get databaseBlock(): DatabaseBlockModel {
    return this.model;
  }

  addNote() {
    const collection = this.host?.std.collection;
    if (!collection) {
      return;
    }
    const note = createDefaultDoc(collection);
    if (note) {
      this.openDoc(note.id);
      const rowContent = this.rowText$.value?.toString();
      this.rowText$.value?.replace(
        0,
        this.rowText$.value.length,
        REFERENCE_NODE,
        {
          reference: {
            type: 'LinkedPage',
            pageId: note.id,
          },
        } satisfies AffineTextAttributes as BaseTextAttributes
      );
      collection.setDocMeta(note.id, { title: rowContent });
      if (note.root) {
        (note.root as RootBlockModel).title.insert(rowContent ?? '', 0);
        note.root.children
          .find(child => child.flavour === 'affine:note')
          ?.children.find(block =>
            matchFlavours(block, [
              'affine:paragraph',
              'affine:list',
              'affine:code',
            ])
          );
      }
    }
  }

  protected override render(): unknown {
    return html`
      <div
        style="height: 1px;max-width: var(--affine-editor-width);background-color: var(--affine-border-color);margin: auto;margin-bottom: 16px"
      ></div>
      ${this.renderNote()}
    `;
  }

  renderNote() {
    if (this.allowCreateDoc$.value) {
      return html` <div>
        <div
          @click="${this.addNote}"
          style="max-width: var(--affine-editor-width);margin: auto;cursor: pointer;color: var(--affine-text-disable-color)"
        >
          Click to create a linked doc in center peek.
        </div>
      </div>`;
    }
    return;
  }

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor model!: DatabaseBlockModel;

  @property({ attribute: false })
  accessor openDoc!: (docId: string) => void;

  @property({ attribute: false })
  accessor view!: SingleView;
}
