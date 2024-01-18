import type { EditorHost } from '@blocksuite/lit';
import { BlockElement } from '@blocksuite/lit';
import type { PropertyValues } from 'lit';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';

import { DocEditorBlockSpecs } from '../_specs/_specs.js';
import type { SyncedBlockModel } from './synced-model.js';

@customElement('affine-synced')
export class SyncedBlockComponent extends BlockElement<SyncedBlockModel> {
  private _host: Ref<EditorHost> = createRef<EditorHost>();

  override connectedCallback() {
    super.connectedCallback();
  }

  override firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    this._host.value?.std.event.add('pointerDown', ctx => {
      const state = ctx.get('pointerState');
      state.raw.stopPropagation();
    });
  }

  override render() {
    const page = this.std.workspace.getPage(this.model.pageId);
    return html`<editor-host
      ${ref(this._host)}
      .page=${page}
      .specs=${DocEditorBlockSpecs}
    ></editor-host>`;
  }
}
