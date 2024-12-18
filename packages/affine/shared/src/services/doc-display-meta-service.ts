import type { AliasInfo, ReferenceParams } from '@blocksuite/affine-model';
import type { Disposable } from '@blocksuite/global/utils';
import type { Doc } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import { LifeCycleWatcher, StdIdentifier } from '@blocksuite/block-std';
import { type Container, createIdentifier } from '@blocksuite/global/di';
import {
  AliasIcon,
  BlockLinkIcon,
  DeleteIcon,
  EdgelessIcon,
  LinkedEdgelessIcon,
  LinkedPageIcon,
  PageIcon,
} from '@blocksuite/icons/lit';
import { computed, signal, type Signal } from '@preact/signals-core';

import { referenceToNode } from '../utils/reference.js';
import { DocModeProvider } from './doc-mode-service.js';

export type DocDisplayMetaParams = {
  referenced?: boolean;
  params?: ReferenceParams;
} & AliasInfo;

/**
 * Customize document display title and icon.
 *
 * Supports the following blocks:
 *
 * * Inline View:
 *      `AffineReference`
 * * Card View:
 *      `EmbedLinkedDocBlockComponent`
 *      `EmbedEdgelessLinkedDocBlockComponent`
 * * Embed View:
 *      `EmbedSyncedDocBlockComponent`
 *      `EmbedEdgelessSyncedDocBlockComponent`
 */
export interface DocDisplayMetaExtension {
  icon: (
    docId: string,
    referenceInfo?: DocDisplayMetaParams
  ) => Signal<TemplateResult>;
  title: (
    docId: string,
    referenceInfo?: DocDisplayMetaParams
  ) => Signal<string>;
}

export const DocDisplayMetaProvider = createIdentifier<DocDisplayMetaExtension>(
  'DocDisplayMetaService'
);

export class DocDisplayMetaService
  extends LifeCycleWatcher
  implements DocDisplayMetaExtension
{
  static icons = {
    deleted: iconBuilder(DeleteIcon),
    aliased: iconBuilder(AliasIcon),
    page: iconBuilder(PageIcon),
    edgeless: iconBuilder(EdgelessIcon),
    linkedBlock: iconBuilder(BlockLinkIcon),
    linkedPage: iconBuilder(LinkedPageIcon),
    linkedEdgeless: iconBuilder(LinkedEdgelessIcon),
  } as const;

  static override key = 'doc-display-meta';

  readonly disposables: Disposable[] = [];

  readonly iconMap = new WeakMap<Doc, Signal<TemplateResult>>();

  readonly titleMap = new WeakMap<Doc, Signal<string>>();

  static override setup(di: Container) {
    di.addImpl(DocDisplayMetaProvider, this, [StdIdentifier]);
  }

  dispose() {
    while (this.disposables.length > 0) {
      this.disposables.pop()?.dispose();
    }
  }

  icon(
    pageId: string,
    { params, title, referenced }: DocDisplayMetaParams = {}
  ): Signal<TemplateResult> {
    const doc = this.std.collection.getDoc(pageId);

    if (!doc) {
      return signal(DocDisplayMetaService.icons.deleted);
    }

    let icon$ = this.iconMap.get(doc);

    if (!icon$) {
      icon$ = signal(
        this.std.get(DocModeProvider).getPrimaryMode(pageId) === 'edgeless'
          ? DocDisplayMetaService.icons.edgeless
          : DocDisplayMetaService.icons.page
      );

      const disposable = this.std
        .get(DocModeProvider)
        .onPrimaryModeChange(mode => {
          icon$!.value =
            mode === 'edgeless'
              ? DocDisplayMetaService.icons.edgeless
              : DocDisplayMetaService.icons.page;
        }, pageId);

      this.disposables.push(disposable);
      this.disposables.push(
        this.std.collection.slots.docRemoved
          .filter(docId => docId === doc.id)
          .once(() => {
            const index = this.disposables.findIndex(d => d === disposable);
            if (index !== -1) {
              this.disposables.splice(index, 1);
              disposable.dispose();
            }
            this.iconMap.delete(doc);
          })
      );
      this.iconMap.set(doc, icon$);
    }

    return computed(() => {
      if (title) {
        return DocDisplayMetaService.icons.aliased;
      }

      if (referenceToNode({ pageId, params })) {
        return DocDisplayMetaService.icons.linkedBlock;
      }

      if (referenced) {
        const mode =
          params?.mode ??
          this.std.get(DocModeProvider).getPrimaryMode(pageId) ??
          'page';
        return mode === 'edgeless'
          ? DocDisplayMetaService.icons.linkedEdgeless
          : DocDisplayMetaService.icons.linkedPage;
      }

      return icon$.value;
    });
  }

  title(pageId: string, { title }: DocDisplayMetaParams = {}): Signal<string> {
    const doc = this.std.collection.getDoc(pageId);

    if (!doc) {
      return signal(title || 'Deleted doc');
    }

    let title$ = this.titleMap.get(doc);
    if (!title$) {
      title$ = signal(doc.meta?.title || 'Untitled');

      const disposable = this.std.collection.meta.docMetaUpdated.on(() => {
        title$!.value = doc.meta?.title || 'Untitled';
      });

      this.disposables.push(disposable);
      this.disposables.push(
        this.std.collection.slots.docRemoved
          .filter(docId => docId === doc.id)
          .once(() => {
            const index = this.disposables.findIndex(d => d === disposable);
            if (index !== -1) {
              this.disposables.splice(index, 1);
              disposable.dispose();
            }
            this.titleMap.delete(doc);
          })
      );
      this.titleMap.set(doc, title$);
    }

    return computed(() => {
      return title || title$.value;
    });
  }

  override unmounted() {
    this.dispose();
  }
}

function iconBuilder(
  icon: typeof PageIcon,
  size = '1.25em',
  style = 'user-select:none;flex-shrink:0;vertical-align:middle;font-size:inherit;margin-bottom:0.1em;'
) {
  return icon({ width: size, height: size, style });
}
