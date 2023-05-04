// related component

import { css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import { type BlockHost, WithDisposable } from '../../__internal__/index.js';
import { ShadowlessElement } from '../../__internal__/utils/lit.js';
import type { DatabaseBlockModel } from '../database-model.js';

const styles = css`
  affine-database-kanban {
    position: relative;
  }
`;

@customElement('affine-database-kanban')
export class DatabaseKanban
  extends WithDisposable(ShadowlessElement)
  implements BlockHost
{
  flavour = 'affine:database' as const;

  static override styles = styles;

  get slots() {
    return this.host.slots;
  }

  get page() {
    return this.host.page;
  }
  get clipboard() {
    return this.host.clipboard;
  }
  get getService() {
    return this.host.getService;
  }

  @property()
  model!: DatabaseBlockModel;

  @property()
  host!: BlockHost;

  override connectedCallback() {
    super.connectedCallback();
  }

  override render() {
    return html`<div class="affine-database-kanban">kanban view</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-kanban': DatabaseKanban;
  }
}
