import { WithDisposable } from '@blocksuite/block-std';
import type {
  AffineReference,
  PageRootBlockComponent,
} from '@blocksuite/blocks';
import {
  type AffineTextAttributes,
  getAffineInlineSpecsWithReference,
  ReferenceNodeConfig,
} from '@blocksuite/blocks';
import { BlocksUtils, InlineManager, RichText } from '@blocksuite/blocks';
import { assertExists, noop } from '@blocksuite/global/utils';
import type { DeltaInsert } from '@blocksuite/inline';
import type { BlockModel, Doc } from '@blocksuite/store';
import { css, html, LitElement, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  ArrowJumpIcon,
  ArrowLeftIcon,
  SmallDeleteIcon,
  SmallLinkedDocIcon,
} from '../_common/icons.js';
import { DOC_BLOCK_CHILD_PADDING } from '../doc-meta-tags/utils.js';

noop(RichText);

const { matchFlavours } = BlocksUtils;

@customElement('bi-directional-link-panel')
export class BiDirectionalLinkPanel extends WithDisposable(LitElement) {
  private get _host() {
    return this.pageRoot.host;
  }

  private get _links() {
    const { doc } = this;

    const ids = new Set<string>();
    doc
      .getBlockByFlavour([
        'affine:paragraph',
        'affine:list',
        'affine:embed-linked-doc',
        'affine:embed-synced-doc',
      ])
      .forEach(model => {
        if (model.text) {
          const deltas: DeltaInsert<AffineTextAttributes>[] =
            model.text.yText.toDelta();

          deltas.forEach(delta => {
            if (delta.attributes?.reference?.pageId)
              ids.add(delta.attributes.reference.pageId);
          });
        } else if (
          matchFlavours(model, [
            'affine:embed-linked-doc',
            'affine:embed-synced-doc',
          ])
        ) {
          ids.add(model.pageId);
        }
      });

    return Array.from(ids);
  }

  private get _rootService() {
    return this._host.spec.getService('affine:page');
  }

  private get _backLinks() {
    const { doc } = this;
    const { collection } = doc;
    const backLinks = new Map<string, string[]>();
    collection.indexer.backlink?.getBacklink(doc.id).reduce((map, link) => {
      const { pageId } = link;
      if (map.has(pageId)) {
        map.get(pageId)!.push(link.blockId);
      } else {
        map.set(pageId, [link.blockId]);
      }
      return map;
    }, backLinks);

    return backLinks;
  }

  static override styles = css`
    :host {
      width: 100%;
      max-width: var(--affine-editor-width);
      margin-left: auto;
      margin-right: auto;
      padding-left: var(
        --affine-editor-side-padding,
        ${DOC_BLOCK_CHILD_PADDING}
      );
      padding-right: var(
        --affine-editor-side-padding,
        ${DOC_BLOCK_CHILD_PADDING}
      );
      font-size: var(--affine-font-base);
    }

    /* Extra small devices (phones, 640px and down) */
    @container viewport (width <= 640px) {
      :host {
        padding-left: ${DOC_BLOCK_CHILD_PADDING}px;
        padding-right: ${DOC_BLOCK_CHILD_PADDING}px;
      }
    }

    .title-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .back-links-title,
    .links-title {
      color: var(--affine-text-secondary-color);
      height: 32px;
      line-height: 32px;
    }

    .links,
    .back-links {
      margin-bottom: 16px;
    }

    .back-link-title {
      width: 100%;
      height: 32px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .back-link-title div {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--affine-text-primary-color);
    }

    .back-links-container {
      height: auto;
      display: flex;
    }

    .back-links-container-left-divider {
      width: 20px;
      display: flex;
      justify-content: center;
    }
    .back-links-container-left-divider div {
      width: 1px;
      height: 100%;
      background-color: var(--affine-border-color);
    }

    .link {
      width: 100%;
      height: 32px;
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      cursor: pointer;
    }

    .link svg {
      flex: none;
    }

    .link div {
      width: fit-content;
      height: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 32px;
      border-bottom: 0.5px solid var(--affine-divider-color);
    }

    .link.deleted {
      color: var(--affine-text-disable-color);
      text-decoration: line-through;
      fill: var(--affine-text-disable-color);
    }

    .arrow {
      cursor: pointer;
      transition: transform 0.2s;
    }

    .back-links-blocks-container {
      width: 100%;
      display: flex;
      flex-direction: column;
      padding-left: 8px;
      position: relative;
    }

    .rich-text-container {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: start;
      cursor: pointer;
      border-radius: 4px;
      padding: 0px 8px;
      padding-top: 8px;
    }

    .rich-text {
      max-width: 96%;
      padding-bottom: 8px;
    }

    .arrow-link {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      display: none;
    }

    .rich-text-container:hover {
      background-color: var(--affine-hover-color);
    }

    .rich-text-container:hover .arrow-link {
      display: flex;
    }
    .arrow-link:hover {
      background-color: var(--affine-hover-color);
    }

    .quote {
      padding-left: 24px;
    }
    .quote::after {
      content: '';
      width: 2px;
      height: 24px;
      position: absolute;
      left: 16px;
      background: var(--affine-quote-color);
      border-radius: 18px;
    }

    .linked-doc-container {
      display: flex;
      align-items: center;
      padding-left: 2px;
      gap: 2px;
    }
    .linked-doc-container svg {
      scale: 1.2;
    }
  `;

  @state()
  private accessor _show = false;

  @state()
  private accessor _backLinkShow: boolean[] = [];

  private _inlineManager = new InlineManager();

  @property({ attribute: false })
  accessor doc!: Doc;

  @property({ attribute: false })
  accessor pageRoot!: PageRootBlockComponent;

  private _toggleShow() {
    this._show = !this._show;
    this._rootService.editPropsStore.setStorage(
      'showBidirectional',
      this._show
    );
  }

  private _renderLinks(ids: string[]) {
    const { collection } = this.doc;

    return html`<div class="links">
      <div class="links-title">Outgoing links · ${ids.length}</div>
      ${repeat(
        ids,
        id => id,
        id => {
          const doc = collection.getDoc(id);

          const isDeleted = !doc;

          const title = isDeleted
            ? 'Deleted doc'
            : !doc.meta
              ? 'Untitled'
              : doc.meta.title;

          const icon = isDeleted ? SmallDeleteIcon : SmallLinkedDocIcon;

          return html`<div
            class=${`link ${isDeleted ? 'deleted' : ''}`}
            @click=${(e: MouseEvent) => {
              this._handleLinkClick(e, id);
            }}
          >
            ${icon}
            <div>${title}</div>
          </div>`;
        }
      )}
    </div> `;
  }

  private _renderBackLinks(backLinks: Map<string, string[]>) {
    const { doc } = this;
    const { collection } = doc;
    const length = backLinks.size;

    return html` <div class="back-links">
      <div class="back-links-title">${`Backlinks · ${length}`}</div>
      ${repeat(
        backLinks.keys(),
        id => id,
        (docId, index) => {
          const doc = collection.getDoc(docId);
          const blocks = backLinks.get(docId)!;
          assertExists(doc);
          const show = this._backLinkShow[index] ?? false;

          const listService = this._host!.spec.getService('affine:list');

          return html`<style>
              .affine-list-block__prefix{
                display: flex;
                align-items: center;
              }

              .rich-text{
                display: flex;
                align-items: center;
              }

              ${listService.styles.prefix}
              ${listService.styles.toggle}
            </style>
            <div class="back-link">
              <div class="back-link-title">
                <div
                  class="arrow"
                  style=${styleMap({
                    transform: `rotate(${show ? 90 : 0}deg)`,
                  })}
                  @click=${() => {
                    this._backLinkShow[index] = !show;
                    this.requestUpdate();
                  }}
                >
                  ${ArrowLeftIcon}
                </div>
                <div>
                  ${SmallLinkedDocIcon}${doc.meta?.title
                    ? doc.meta.title
                    : 'Untitled'}
                </div>
              </div>
              <div class="back-links-container">
                <div class="back-links-container-left-divider">
                  <div></div>
                </div>
                <div class="back-links-blocks-container">
                  ${show
                    ? repeat(
                        blocks,
                        blockId => blockId,
                        blockId => {
                          const model = doc.getBlockById(blockId);
                          if (!model) return nothing;
                          return this._backlink(model, docId, blockId);
                        }
                      )
                    : nothing}
                </div>
              </div>
            </div>`;
        }
      )}
    </div>`;
  }

  private _handleLinkClick(e: MouseEvent, docId: string, blockId?: string) {
    if (e.shiftKey && this._rootService.peekViewService) {
      this._rootService.peekViewService
        .peek({
          docId,
          blockId,
        })
        .catch(console.error);
    } else {
      this.pageRoot.slots.docLinkClicked.emit({
        docId,
        blockId,
      });
    }
  }

  private _backlink(model: BlockModel<object>, docId: string, blockId: string) {
    if (
      !matchFlavours(model, [
        'affine:paragraph',
        'affine:list',
        'affine:embed-linked-doc',
        'affine:embed-synced-doc',
      ])
    )
      return nothing;

    let icon: TemplateResult<1> | null = null;
    if (matchFlavours(model, ['affine:list'])) {
      const listService = this._host!.spec.getService('affine:list');

      icon = listService.styles.icon(model, false, () => {});
    }
    const type = matchFlavours(model, [
      'affine:embed-linked-doc',
      'affine:embed-synced-doc',
    ])
      ? ''
      : model.type;

    return html` <div
      class=${`rich-text-container ${type}`}
      @click=${(e: MouseEvent) => {
        this._handleLinkClick(e, docId, blockId);
      }}
    >
      <div class="rich-text">
        ${type
          ? html`${icon ?? nothing}
              <rich-text
                .yText=${model.text}
                .readonly=${true}
                .attributesSchema=${this._inlineManager.getSchema()}
                .attributeRenderer=${this._inlineManager.getRenderer()}
              ></rich-text>`
          : html`<div class="linked-doc-container">
              ${SmallLinkedDocIcon}
              ${this.doc.meta?.title ? this.doc.meta?.title : 'Untitled'}
            </div>`}
      </div>

      <div class="arrow-link">${ArrowJumpIcon}</div>
    </div>`;
  }

  private _divider(visible: boolean) {
    return html`
      <style>
        .divider-container {
          height: 16px;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .divider {
          background: var(--affine-border-color);
          height: 0.5px;
          width: 100%;
        }
      </style>
      <div
        style=${styleMap({
          visibility: visible ? 'visible' : 'hidden',
        })}
        class="divider-container"
      >
        <div class="divider"></div>
      </div>
    `;
  }

  protected override render() {
    const links = this._links;
    const backLinks = this._backLinks;

    if (links.length + backLinks.size === 0) return nothing;

    return html`<style>
        .title {
          font-weight: 500;
          font-size: 15px;
          line-height: 24px;
          color: ${this._show
            ? 'var(--affine-text-primary-color)'
            : 'var(--affine-text-disable-color)'};
        }
        .show-button {
          width: 56px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid var(--affine-border-color);
          background-color: var(--affine-white);
          text-align: center;
          font-size: 12px;
          line-height: 28px;
          font-weight: 500;
          color: var(--affine-text-primary-color);
          cursor: pointer;
        }
      </style>
      ${this._divider(!this._show)}
      <div class="title-line">
        <div class="title text">Bi-directional links</div>
        <div class="show-button" @click=${this._toggleShow}>
          ${this._show ? 'Hide' : 'Show'}
        </div>
      </div>
      ${this._divider(this._show)}
      ${this._show
        ? html`${this._renderBackLinks(backLinks)} ${this._renderLinks(links)} `
        : nothing} `;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    const config = new ReferenceNodeConfig();
    config.setInteractable(false);
    config.setDoc(this.doc);
    config.setCustomContent((reference: AffineReference) => {
      const title = reference.doc.meta?.title
        ? reference.doc.meta.title
        : 'Untitled';
      return html`<style>
          .custom-reference-content svg {
            position: relative;
            top: 2px;
          }
        </style>
        <span class="custom-reference-content">
          ${SmallLinkedDocIcon} ${title}
        </span> `;
    });
    this._inlineManager.registerSpecs(
      getAffineInlineSpecsWithReference(config)
    );
    if (this.doc.collection.indexer.backlink) {
      const { _disposables } = this;
      _disposables.add(
        this.doc.collection.indexer.backlink.slots.indexUpdated.on(() => {
          this.requestUpdate();
        })
      );
    }

    this._show =
      !!this._rootService.editPropsStore.getStorage('showBidirectional');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bi-directional-link-panel': BiDirectionalLinkPanel;
  }
}
