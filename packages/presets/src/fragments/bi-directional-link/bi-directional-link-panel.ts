import type { ListService } from '@blocksuite/blocks';
import {
  type AffineTextAttributes,
  getAffineInlineSpecsWithReference,
  ReferenceNodeConfig,
} from '@blocksuite/blocks';
import { BlocksUtils, InlineManager, RichText } from '@blocksuite/blocks';
import { assertExists, noop } from '@blocksuite/global/utils';
import type { DeltaInsert } from '@blocksuite/inline';
import { WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
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
      height: 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      border-radius: 4px;
      padding-left: 8px;
      padding-right: 8px;
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
  `;

  @state()
  private _show = false;

  @state()
  private _backLinkShow: boolean[] = [];

  @property({ attribute: false })
  page!: Page;

  private _inlineManager = new InlineManager();

  override connectedCallback(): void {
    super.connectedCallback();
    const config = new ReferenceNodeConfig();
    config.setInteractable(false);
    config.setPage(this.page);
    this._inlineManager.registerSpecs(
      getAffineInlineSpecsWithReference(config)
    );
    const { _disposables } = this;
    _disposables.add(
      this.page.workspace.indexer.backlink.slots.indexUpdated.on(() => {
        this.requestUpdate();
      })
    );
  }

  private _toggleShow() {
    this._show = !this._show;
  }

  private get _docPageElement() {
    const affineDocEditor = this.closest('affine-doc-editor');
    assertExists(affineDocEditor);
    const docPageElement = affineDocEditor.querySelector('affine-doc-page');
    assertExists(docPageElement);
    return docPageElement;
  }

  private get _host() {
    const affineDocEditor = this.closest('affine-doc-editor');
    return affineDocEditor?.querySelector('editor-host');
  }

  private get _links() {
    const { page } = this;
    const { workspace } = page;
    const ids = new Set<string>();
    page
      .getBlockByFlavour(['affine:paragraph', 'affine:list'])
      .forEach(model => {
        if (!model.text) return;
        const deltas: DeltaInsert<AffineTextAttributes>[] =
          model.text.yText.toDelta();

        deltas.forEach(delta => {
          if (!delta.attributes || !delta.attributes.reference) return;
          ids.add(delta.attributes.reference.pageId);
        });
      });

    if (ids.size === 0) return nothing;

    return html`<div class="links">
      <div class="links-title">Outgoing links · ${ids.size}</div>
      ${repeat(
        Array.from(ids),
        id => id,
        id => {
          const page = workspace.getPage(id);
          assertExists(page);
          return html`<div
            class="link"
            @click=${() => {
              this._docPageElement.slots.pageLinkClicked.emit({
                pageId: id,
              });
            }}
          >
            ${SmallLinkedPageIcon}
            <div>${page.meta.title}</div>
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
    const length = backLinks.size;
    if (!length) return nothing;

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
                <div>${SmallLinkedPageIcon}${page.meta.title}</div>
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

                          if (
                            !matchFlavours(model, [
                              'affine:paragraph',
                              'affine:list',
                            ])
                          )
                            return nothing;
                          let icon: TemplateResult<1> | null = null;
                          if (matchFlavours(model, ['affine:list'])) {
                            const listService = this._host!.spec.getService(
                              'affine:list'
                            ) as ListService;

                            icon = listService.styles.icon(
                              model,
                              false,
                              () => {}
                            );
                          }
                          return html`<div
                            class=${`rich-text-container ${model.type}`}
                            @click=${() =>
                              this._docPageElement.slots.pageLinkClicked.emit({
                                pageId,
                                blockId,
                              })}
                          >
                            <div class="rich-text">
                              ${icon ?? nothing}
                              <rich-text
                                .yText=${model.text}
                                .readonly=${true}
                                .attributesSchema=${this._inlineManager.getSchema()}
                                .attributeRenderer=${this._inlineManager.getRenderer()}
                              ></rich-text>
                            </div>

                            <div class="arrow-link">${ArrowJumpIcon}</div>
                          </div>`;
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
      ${this._show ? html`${this._backLinks} ${this._links} ` : nothing} `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bi-directional-link-panel': BiDirectionalLinkPanel;
  }
}
