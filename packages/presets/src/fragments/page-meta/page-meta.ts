import {
  getPageByEditorHost,
  popTagSelect,
  type SelectTag,
} from '@blocksuite/blocks';
import {
  ArrowDownSmallIcon,
  DualLinkIcon16,
  PlusIcon,
  TagsIcon,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { baseTheme } from '@toeverything/theme';
import { css, html, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { BacklinkButton } from './backlink-popover.js';
import {
  type BacklinkData,
  DEFAULT_PAGE_NAME,
  listenBacklinkList,
} from './utils.js';

const PAGE_BLOCK_CHILD_PADDING = 24;

@customElement('page-meta')
export class PageMeta extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    page-meta {
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      display: block;
      box-sizing: border-box;
      max-width: var(--affine-editor-width);
      margin-left: auto;
      margin-right: auto;
      padding-left: var(
        --affine-editor-side-padding,
        ${PAGE_BLOCK_CHILD_PADDING}px
      );
      padding-right: var(
        --affine-editor-side-padding,
        ${PAGE_BLOCK_CHILD_PADDING}px
      );
    }

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

    .expand svg {
      color: var(--affine-icon-color);
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

    .meta-data-expanded-column-item {
      display: flex;
      flex-direction: column;
    }

    .meta-data-expanded-column-item .backlink-title {
      display: flex;
      align-items: center;
      gap: 8px;
      fill: var(--affine-icon-color);
    }

    .meta-data-expanded-column-item .backlinks {
      margin-left: 24px;
    }

    .meta-data-expanded-item {
      display: flex;
      gap: 8px;
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
  editorHostRef!: Ref<EditorHost>;

  @state()
  backlinkList!: BacklinkData[];

  @state()
  showSelect = false;

  @state()
  expanded = false;

  private _editorHost!: EditorHost;

  get meta() {
    return this.page.workspace.meta;
  }

  get options() {
    return this.meta.properties.tags?.options ?? [];
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

  private _toggle = () => {
    this.expanded = !this.expanded;
  };

  private _selectTags = () => {
    this._disposables.add({
      dispose: popTagSelect(this.shadowRoot?.querySelector('.tags') ?? this, {
        value: this.tags,
        onChange: tags => (this.tags = tags),
        options: this.options,
        onOptionsChange: options => (this.options = options),
      }),
    });
  };

  private _renderTagsInline = () => {
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

  private _renderBacklinkInline = () => {
    const backlinkButton = new BacklinkButton(this.backlinkList);
    return backlinkButton;
  };

  private _renderBacklinkExpanded = () => {
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

    return html`<div class="meta-data-expanded-column-item">
      <div class="backlink-title">
        ${DualLinkIcon16}
        <span class="title">Linked to this page</span>
      </div>
      <div class="backlinks">
        ${repeat(backlinkList, v => v.pageId, renderLink)}
      </div>
    </div>`;
  };

  private _renderTagsExpanded = () => {
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
                const pageElement = getPageByEditorHost(this._editorHost);
                assertExists(pageElement);
                pageElement.slots.tagClicked.emit({ tagId: tag.id });
              };
              return html` <div class="tag" @click=${click} style=${style}>
                ${tag.value}
              </div>`;
            }
          )}
          ${this.page.readonly
            ? nothing
            : html`<div class="add-tag" @click="${this._selectTags}">
                ${PlusIcon}
              </div>`}
        </div>
      </div>
    </div>`;
  };

  override connectedCallback() {
    super.connectedCallback();

    assertExists(this.editorHostRef.value);
    this._editorHost = this.editorHostRef.value;

    this._disposables.add(
      listenBacklinkList(this.page, this._editorHost, list => {
        this.backlinkList = list;
      })
    );

    this._disposables.add(
      this.meta.pageMetasUpdated.on(() => {
        this.requestUpdate();
      })
    );
  }

  override render() {
    if (!this.expanded) {
      return html`
        <div class="meta-data caret-ignore" @click="${this._toggle}">
          <div class="meta-data-content">
            ${this._renderBacklinkInline()} ${this._renderTagsInline()}
          </div>
          <div class="expand">${ArrowDownSmallIcon}</div>
        </div>
      `;
    }

    return html`
      <div class="meta-data-expanded caret-ignore">
        <div class="meta-data-expanded-title" @click="${this._toggle}">
          <div>Page info</div>
          <div class="close">${ArrowDownSmallIcon}</div>
        </div>
        <div class="meta-data-expanded-content">
          ${this._renderBacklinkExpanded()} ${this._renderTagsExpanded()}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-meta': PageMeta;
  }
}
