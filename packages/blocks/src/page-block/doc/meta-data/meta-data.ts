import '../../../components/tags/multi-tag-select.js';
import '../../../components/tags/multi-tag-view.js';

import {
  ArrowDownSmallIcon,
  DualLinkIcon16,
  PlusIcon,
  TagsIcon,
} from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { SelectTag } from '../../../components/tags/multi-tag-select.js';
import { popTagSelect } from '../../../components/tags/multi-tag-select.js';
import type { PageBlockComponent } from '../../types.js';
import type { BacklinkData } from './backlink/backlink.js';
import { DEFAULT_PAGE_NAME, listenBacklinkList } from './backlink/backlink.js';

@customElement('affine-page-meta-data')
export class PageMetaData extends WithDisposable(LitElement) {
  static override styles = css`
    .meta-data {
      border-radius: 8px;
      display: flex;
      align-items: center;
      height: 30px;
      cursor: pointer;
      justify-content: space-between;
      margin: 0 -12px;
    }

    .meta-data-content {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--affine-text-secondary-color);
    }

    .meta-data:hover {
      background-color: var(--affine-hover-color);
    }

    .tags-inline {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
    }

    .tags-inline .tag-list {
      display: flex;
      align-items: center;
    }

    .tag-inline {
      max-width: 100px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .expand {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
    }

    .meta-data-expanded {
      padding: 10px 12px 24px;
      margin: 0 -24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background-color: var(--affine-hover-color-filled);
      border-radius: 8px;
    }

    .meta-data-expanded-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 12px;
      font-weight: 600;
      font-size: 14px;
      color: var(--affine-text-secondary-color);
      border-radius: 4px;
      cursor: pointer;
    }

    .meta-data-expanded-title:hover {
      background-color: var(--affine-hover-color);
    }

    .meta-data-expanded-title .close {
      transform: rotate(180deg);
      border-radius: 4px;
      display: flex;
      align-items: center;
    }

    @media print {
      .meta-data-expanded-title .close {
        display: none;
      }

      .expand {
        display: none;
      }
    }

    .meta-data-expanded-title .close:hover {
      background-color: var(--affine-hover-color);
    }

    .meta-data-expanded-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 0 12px;
    }

    .meta-data-expanded-item {
      display: flex;
      gap: 8px;
    }

    .meta-data-expanded-item .type {
      display: flex;
      align-items: center;
    }

    .meta-data-expanded-item .type svg {
      fill: var(--affine-icon-color);
    }

    .meta-data-expanded-item .arrow-icon svg {
      fill: var(--affine-icon-color);
       height: 25px;
    }

    .meta-data-expanded-item .value {
      flex: 1;
    }

    .add-tag {
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .add-tag svg {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      fill: var(--affine-icon-color);
    }

    .add-tag:hover svg {
      background-color: var(--affine-hover-color);
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tag {
      padding: 4px 10px;
      border-radius: 8px;
      color: var(--affine-text-primary-color);
      font-size: 13px;
      line-height: 13px;
      display: flex;
      align-items: center;
      font-weight: 400;
      cursor: pointer;
    }

    .backlinks {
      display: flex;
      gap: 8px;
      flex-direction: column;
    }

    .backlinks .title {
      height: 28px;
      color: var(--affine-text-secondary-color);
      font-size: var(--affine-font-sm);
    }

    .backlinks .link {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 15px;
      cursor: pointer;
      width: max-content;
      border-radius: 4px;
      padding: 0 8px 0 4px;
      margin: 0 -8px 0 -4px;
    }

    .backlinks .link:hover {
      background-color: var(--affine-hover-color);
    }

    .backlinks .link svg {
      fill: var(--affine-icon-color);
    }

    .link-title {
      border-bottom: 0.5px solid var(--affine-divider-color);
    }

    .backlinks .link:hover .link-title {
      border-bottom-color: transparent;
    }
  `;

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  pageElement!: PageBlockComponent;

  get meta() {
    return this.page.workspace.meta;
  }

  get options() {
    return this.meta.properties.tags.options;
  }

  set options(tags: SelectTag[]) {
    this.tags = this.tags.filter(v => tags.find(x => x.id === v));
    this.page.workspace.meta.setProperties({
      ...this.meta.properties,
      tags: {
        ...this.meta.properties.tags,
        options: tags,
      },
    });
  }

  get tags() {
    return this.page.meta.tags ?? [];
  }

  set tags(tags: string[]) {
    this.page.meta.tags = tags;
  }

  @state()
  backlinkList!: BacklinkData[];

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      listenBacklinkList(this.pageElement, list => {
        this.backlinkList = list;
      })
    );
    this._disposables.add(
      this.meta.pageMetasUpdated.on(() => {
        this.requestUpdate();
      })
    );
  }

  @state()
  showSelect = false;
  _selectTags = (evt: MouseEvent) => {
    this._disposables.add({
      dispose: popTagSelect(this.shadowRoot?.querySelector('.tags') ?? this, {
        value: this.tags,
        onChange: tags => (this.tags = tags),
        options: this.options,
        onOptionsChange: options => (this.options = options),
      }),
    });
  };

  private renderBacklinkInline = () => {
    const click = (e: MouseEvent) => {
      e.stopPropagation();
    };
    return html`
      <backlink-button
        @click="${click}"
        .backlinks="${this.backlinkList}"
      ></backlink-button>
    `;
  };
  private renderTagsInline = () => {
    const tags = this.tags;
    const optionMap = Object.fromEntries(this.options.map(v => [v.id, v]));
    return html` <div class="tags-inline">
      ${TagsIcon}
      ${tags.length > 0
        ? html` <div class="tag-list">
            ${repeat(
              tags.slice(0, 3),
              id => id,
              (id, i) => {
                const tag = optionMap[id];
                if (!tag) {
                  return null;
                }
                return html` <div>${i !== 0 ? html`,&nbsp;` : ''}</div>
                  <div class="tag-inline">${tag.value}</div>`;
              }
            )}
            ${tags.length > 3 ? html`, and ${tags.length - 3} more` : ''}
          </div>`
        : 'Tags'}
    </div>`;
  };

  @state()
  expanded = false;
  private _toggle = () => {
    this.expanded = !this.expanded;
  };
  private renderBacklinkExpanded = () => {
    const backlinkList = this.backlinkList;
    if (!backlinkList.length) {
      return null;
    }
    const renderLink = (link: BacklinkData) => {
      return html` <div @click=${link.jump} class="link">
        ${link.icon}
        <div class="link-title">${link.title || DEFAULT_PAGE_NAME}</div>
      </div>`;
    };
    return html` <div class="meta-data-expanded-item">
      <div class="arrow-icon">${DualLinkIcon16}</div>
      <div class="value">
        <div class="backlinks">
          <div class="title">Linked to this page</div>
          ${repeat(backlinkList, v => v.pageId, renderLink)}
        </div>
      </div>
    </div>`;
  };
  private renderTagsExpanded = () => {
    const optionMap = Object.fromEntries(this.options.map(v => [v.id, v]));
    return html` <div class="meta-data-expanded-item">
      <div class="type">${TagsIcon}</div>
      <div class="value">
        <div class="tags">
          ${repeat(
            this.tags,
            id => id,
            id => {
              const tag = optionMap[id];
              if (!tag) {
                return null;
              }
              const style = styleMap({
                backgroundColor: tag.color,
              });
              const click = () => {
                this.pageElement.slots.tagClicked.emit({ tagId: tag.id });
              };
              return html` <div class="tag" @click=${click} style=${style}>
                ${tag.value}
              </div>`;
            }
          )}
          <div class="add-tag" @click="${this._selectTags}">${PlusIcon}</div>
        </div>
      </div>
    </div>`;
  };

  override render() {
    if (!this.expanded) {
      return html`
        <div class="meta-data" @click="${this._toggle}">
          <div class="meta-data-content">
            ${this.renderBacklinkInline()} ${this.renderTagsInline()}
          </div>
          <div class="expand">${ArrowDownSmallIcon}</div>
        </div>
      `;
    }

    return html` <div class="meta-data-expanded">
      <div class="meta-data-expanded-title" @click="${this._toggle}">
        <div>Page info</div>
        <div class="close">${ArrowDownSmallIcon}</div>
      </div>
      <div class="meta-data-expanded-content">
        ${this.renderBacklinkExpanded()} ${this.renderTagsExpanded()}
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-page-meta-data': PageMetaData;
  }
}
