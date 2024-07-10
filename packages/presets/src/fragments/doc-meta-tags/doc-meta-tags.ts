import { WithDisposable } from '@blocksuite/block-std';
import {
  ArrowDownSmallIcon,
  DocIcon,
  DualLinkIcon16,
  LinkedDocIcon,
  PlusIcon,
  popTagSelect,
  type SelectTag,
  TagsIcon,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import type { Doc } from '@blocksuite/store';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { BacklinkButton } from './backlink-popover.js';
import {
  type BackLink,
  type BacklinkData,
  DEFAULT_DOC_NAME,
  DOC_BLOCK_CHILD_PADDING,
} from './utils.js';

@customElement('doc-meta-tags')
export class DocMetaTags extends WithDisposable(LitElement) {
  get pageRoot() {
    const pageViewport = this.closest('.affine-page-viewport');
    assertExists(pageViewport);
    const pageRoot = pageViewport.querySelector('affine-page-root');
    assertExists(pageRoot);
    return pageRoot;
  }

  get meta() {
    return this.doc.collection.meta;
  }

  get options() {
    return this.meta.properties.tags?.options ?? [];
  }

  set options(tags: SelectTag[]) {
    this.tags = this.tags.filter(v => tags.find(x => x.id === v));
    this.doc.collection.meta.setProperties({
      ...this.meta.properties,
      tags: {
        ...this.meta.properties.tags,
        options: tags,
      },
    });
  }

  get tags() {
    return this.doc.meta?.tags ?? [];
  }

  set tags(tags: string[]) {
    assertExists(this.doc.meta);
    this.doc.meta.tags = tags;
  }

  static override styles = css`
    .doc-meta-container {
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      font-size: var(--affine-font-base);
      line-height: var(--affine-line-height);
      color: var(--affine-text-primary-color);
      display: block;
      box-sizing: border-box;
      max-width: var(--affine-editor-width);
      margin-left: auto;
      margin-right: auto;
      padding-left: var(
        --affine-editor-side-padding,
        ${DOC_BLOCK_CHILD_PADDING}px
      );
      padding-right: var(
        --affine-editor-side-padding,
        ${DOC_BLOCK_CHILD_PADDING}px
      );
    }

    /* Extra small devices (phones, 640px and down) */
    @container viewport (width <= 640px) {
      .doc-meta-container {
        padding-left: ${DOC_BLOCK_CHILD_PADDING}px;
        padding-right: ${DOC_BLOCK_CHILD_PADDING}px;
      }
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
  accessor doc!: Doc;

  @state()
  accessor backlinkList!: BacklinkData[];

  @state()
  accessor showSelect = false;

  @state()
  accessor expanded = false;

  private _listenBacklinkList = () => {
    const metaMap = Object.fromEntries(
      this.doc.collection.meta.docMetas.map(v => [v.id, v])
    );

    const toData = (backlink: BackLink): BacklinkData => {
      const docMeta = metaMap[backlink.pageId];
      if (!docMeta) {
        console.warn('Unexpected doc meta not found', backlink.pageId);
      }
      return {
        ...backlink,
        ...docMeta,
        icon: backlink.type === 'LinkedPage' ? LinkedDocIcon : DocIcon,
        jump: () => {
          if (backlink.pageId === this.doc.id) return;

          this.pageRoot.slots.docLinkClicked.emit({
            docId: backlink.pageId,
            blockId: backlink.blockId,
          });
        },
      };
    };

    const backlinkIndexer = this.doc.collection.indexer.backlink;

    if (backlinkIndexer) {
      const getList = () => {
        return backlinkIndexer
          .getBacklink(this.doc.id)
          .filter(v => v.type === 'LinkedPage')
          .map(toData);
      };

      this.backlinkList = getList();

      this._disposables.add(
        backlinkIndexer.slots.indexUpdated.on(() => {
          this.backlinkList = getList();
        })
      );
    }
  };

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
        <div class="link-title">${link.title || DEFAULT_DOC_NAME}</div>
      </div>`;
    };

    return html`<div class="meta-data-expanded-column-item">
      <div class="backlink-title">
        ${DualLinkIcon16}
        <span class="title">Linked to this doc</span>
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
                this.pageRoot.slots.tagClicked.emit({ tagId: tag.id });
              };
              return html` <div class="tag" @click=${click} style=${style}>
                ${tag.value}
              </div>`;
            }
          )}
          ${this.doc.readonly
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

    this._listenBacklinkList();

    this._disposables.add(
      this.meta.docMetaUpdated.on(() => {
        this.requestUpdate();
      })
    );
  }

  override render() {
    if (!this.expanded) {
      return html`
        <div class="doc-meta-container caret-ignore">
          <div class="meta-data caret-ignore" @click="${this._toggle}">
            <div class="meta-data-content">
              ${this._renderBacklinkInline()} ${this._renderTagsInline()}
            </div>
            <div class="expand">${ArrowDownSmallIcon}</div>
          </div>
        </div>
      `;
    }

    return html`
      <div class="doc-meta-container caret-ignore">
        <div class="meta-data-expanded caret-ignore">
          <div class="meta-data-expanded-title" @click="${this._toggle}">
            <div>Doc info</div>
            <div class="close">${ArrowDownSmallIcon}</div>
          </div>
          <div class="meta-data-expanded-content">
            ${this._renderBacklinkExpanded()} ${this._renderTagsExpanded()}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'doc-meta-tags': DocMetaTags;
  }
}
