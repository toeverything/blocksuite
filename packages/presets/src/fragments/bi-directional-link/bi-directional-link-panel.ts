import type {
  DocPageBlockComponent,
  ListService,
  PageService,
} from '@blocksuite/blocks';
import {
  type AffineTextAttributes,
  getAffineInlineSpecsWithReference,
  ReferenceNodeConfig,
} from '@blocksuite/blocks';
import { BlocksUtils, InlineManager, RichText } from '@blocksuite/blocks';
import { assertExists, noop } from '@blocksuite/global/utils';
import type { DeltaInsert } from '@blocksuite/inline';
import { WithDisposable } from '@blocksuite/lit';
import type { BlockModel, Page } from '@blocksuite/store';
import { css, html, LitElement, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  ArrowJumpIcon,
  ArrowLeftIcon,
  SmallLinkedPageIcon,
} from '../_common/icons.js';

noop(RichText);

const { matchFlavours } = BlocksUtils;

@customElement('bi-directional-link-panel')
export class BiDirectionalLinkPanel extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      width: 100%;
      max-width: var(--affine-editor-width);
      margin-left: auto;
      margin-right: auto;
      padding-left: var(--affine-editor-side-padding, 24px);
      padding-right: var(--affine-editor-side-padding, 24px);
      font-size: var(--affine-font-base);
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

    .linked-page-container {
      display: flex;
      align-items: center;
      padding-left: 2px;
      gap: 2px;
    }
    .linked-page-container svg {
      scale: 1.2;
    }
  `;

  @state()
  private _show = false;

  @state()
  private _backLinkShow: boolean[] = [];

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  docPageBlock!: DocPageBlockComponent;

  private _inlineManager = new InlineManager();

  override connectedCallback(): void {
    super.connectedCallback();
    const config = new ReferenceNodeConfig();
    config.setInteractable(false);
    config.setPage(this.page);
    config.setCustomContent(reference => {
      return html`<style>
          .custom-reference-content svg {
            position: relative;
            top: 2px;
          }
        </style>
        <span class="custom-reference-content">
          ${SmallLinkedPageIcon} ${reference.page.meta.title ?? 'Untitled'}
        </span> `;
    });
    this._inlineManager.registerSpecs(
      getAffineInlineSpecsWithReference(config)
    );
    const { _disposables } = this;
    _disposables.add(
      this.page.workspace.indexer.backlink.slots.indexUpdated.on(() => {
        this.requestUpdate();
      })
    );

    const pageService = this._host.spec.getService(
      'affine:page'
    ) as PageService;
    this._show = !!pageService.editSession.getItem('showBidirectional');
  }

  private _toggleShow() {
    this._show = !this._show;
    const pageService = this._host.spec.getService(
      'affine:page'
    ) as PageService;
    pageService.editSession.setItem('showBidirectional', this._show);
  }

  private get _host() {
    return this.docPageBlock.host;
  }

  private get _links() {
    const { page } = this;

    const ids = new Set<string>();
    page
      .getBlockByFlavour([
        'affine:paragraph',
        'affine:list',
        'affine:embed-linked-doc',
      ])
      .forEach(model => {
        if (model.text) {
          const deltas: DeltaInsert<AffineTextAttributes>[] =
            model.text.yText.toDelta();

          deltas.forEach(delta => {
            if (!delta.attributes || !delta.attributes.reference) return;
            ids.add(delta.attributes.reference.pageId);
          });
        } else if (matchFlavours(model, ['affine:embed-linked-doc'])) {
          ids.add(model.pageId);
        }
      });

    return Array.from(ids);
  }

  private _renderLinks(ids: string[]) {
    const { workspace } = this.page;

    return html`<div class="links">
      <div class="links-title">Outgoing links · ${ids.length}</div>
      ${repeat(
        ids,
        id => id,
        id => {
          const page = workspace.getPage(id);
          assertExists(page);
          const title = page.meta.title ? page.meta.title : 'Untitled';
          return html`<div
            class="link"
            @click=${() => {
              this.docPageBlock.slots.pageLinkClicked.emit({
                pageId: id,
              });
            }}
          >
            ${SmallLinkedPageIcon}
            <div>${title}</div>
          </div>`;
        }
      )}
    </div> `;
  }

  private get _backLinks() {
    const { page } = this;
    const { workspace } = page;
    const backLinks = new Map<string, string[]>();
    workspace.indexer.backlink.getBacklink(page.id).reduce((map, link) => {
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

  private _renderBackLinks(backLinks: Map<string, string[]>) {
    const { page } = this;
    const { workspace } = page;
    const length = backLinks.size;

    return html` <div class="back-links">
      <div class="back-links-title">${`Backlinks · ${length}`}</div>
      ${repeat(
        backLinks.keys(),
        id => id,
        (pageId, index) => {
          const page = workspace.getPage(pageId);
          const blocks = backLinks.get(pageId)!;
          assertExists(page);
          const show = this._backLinkShow[index] ?? false;

          const listService = this._host!.spec.getService(
            'affine:list'
          ) as ListService;

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
                  ${SmallLinkedPageIcon}${page.meta.title
                    ? page.meta.title
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
                          const model = page.getBlockById(blockId);
                          if (!model) return nothing;
                          return this._backlink(model, pageId, blockId);
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

  private _backlink(
    model: BlockModel<object>,
    pageId: string,
    blockId: string
  ) {
    if (
      !matchFlavours(model, [
        'affine:paragraph',
        'affine:list',
        'affine:embed-linked-doc',
      ])
    )
      return nothing;

    let icon: TemplateResult<1> | null = null;
    if (matchFlavours(model, ['affine:list'])) {
      const listService = this._host!.spec.getService(
        'affine:list'
      ) as ListService;

      icon = listService.styles.icon(model, false, () => {});
    }
    const type = matchFlavours(model, ['affine:embed-linked-doc'])
      ? ''
      : model.type;

    return html` <div
      class=${`rich-text-container ${type}`}
      @click=${() =>
        this.docPageBlock.slots.pageLinkClicked.emit({
          pageId,
          blockId,
        })}
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
          : html`<div class="linked-page-container">
              ${SmallLinkedPageIcon}
              ${this.page.meta.title ? this.page.meta.title : 'Untitled'}
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
          background: var(--affine-divider-color);
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
    console.log(links, backLinks);

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
        <div class="title text">Bi-directional link</div>
        <div class="show-button" @click=${this._toggleShow}>
          ${this._show ? 'Hide' : 'Show'}
        </div>
      </div>
      ${this._divider(this._show)}
      ${this._show
        ? html`${this._renderBackLinks(backLinks)} ${this._renderLinks(links)} `
        : nothing} `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bi-directional-link-panel': BiDirectionalLinkPanel;
  }
}
