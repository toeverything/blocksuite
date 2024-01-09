import '../_common/components/embed-card/embed-card-caption.js';

import { assertExists } from '@blocksuite/global/utils';
import { flip, offset } from '@floating-ui/dom';
import { html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EmbedCardCaption } from '../_common/components/embed-card/embed-card-caption.js';
import { HoverController } from '../_common/components/hover/controller.js';
import { EmbedBlockElement } from '../_common/embed-block-helper/embed-block-element.js';
import { OpenIcon } from '../_common/icons/text.js';
import type { EmbedCardStyle } from '../_common/types.js';
import { getEmbedCardIcons } from '../_common/utils/url.js';
import { type EmbedGithubModel, githubUrlRegex } from './embed-github-model.js';
import type { EmbedGithubService } from './embed-github-service.js';
import { GithubIcon, styles } from './styles.js';
import {
  getGithubStatusIcon,
  refreshEmbedGithubStatus,
  refreshEmbedGithubUrlData,
} from './utils.js';

@customElement('affine-embed-github-block')
export class EmbedGithubBlockComponent extends EmbedBlockElement<
  EmbedGithubModel,
  EmbedGithubService
> {
  static override styles = styles;

  override cardStyle: EmbedCardStyle = 'horizontal';

  @property({ attribute: false })
  loading = false;

  @state()
  showCaption = false;

  @query('embed-card-caption')
  captionElement!: EmbedCardCaption;

  refreshUrlData = () => {
    refreshEmbedGithubUrlData(this).catch(console.error);
  };

  refreshStatus = () => {
    refreshEmbedGithubStatus(this).catch(console.error);
  };

  private _selectBlock() {
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create('block', {
      path: this.path,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  private _openLink() {
    let link = this.model.url;
    if (!link.match(/^[a-zA-Z]+:\/\//)) {
      link = 'https://' + link;
    }
    window.open(link, '_blank');
  }

  private _handleClick() {
    if (!this.isInSurface) {
      this._selectBlock();
    }
  }

  private _handleDoubleClick(event: MouseEvent) {
    if (!this.isInSurface) {
      event.stopPropagation();
      this._openLink();
    }
  }

  private _handleAssigneeClick(assignee: string) {
    const link = `https://www.github.com/${assignee}`;
    window.open(link, '_blank');
  }

  override connectedCallback() {
    super.connectedCallback();

    if (!!this.model.caption && !!this.model.caption.length) {
      this.showCaption = true;
    }

    if (!this.model.owner || !this.model.repo || !this.model.githubId) {
      this.page.withoutTransact(() => {
        const url = this.model.url;
        const urlMatch = url.match(githubUrlRegex);
        if (urlMatch) {
          const [, owner, repo, githubType, githubId] = urlMatch;
          this.page.updateBlock(this.model, {
            owner,
            repo,
            githubType: githubType === 'issue' ? 'issue' : 'pr',
            githubId,
          });
        }
      });
    }

    this.page.withoutTransact(() => {
      if (!this.model.description && !this.model.title) this.refreshUrlData();
      else this.refreshStatus();
    });

    this.disposables.add(
      this.model.propsUpdated.on(({ key }) => {
        this.requestUpdate();
        if (key === 'url') this.refreshUrlData();
      })
    );

    if (this.isInSurface) {
      const surface = this.surface;
      assertExists(surface);
      this.disposables.add(
        surface.edgeless.slots.elementUpdated.on(({ id }) => {
          if (id === this.model.id) {
            this.requestUpdate();
          }
        })
      );
    }
  }

  private _whenHover = new HoverController(this, ({ abortController }) => {
    return {
      template: html`
        <style>
          :host {
            z-index: 1;
          }
        </style>
        <embed-card-toolbar
          .model=${this.model}
          .block=${this}
          .host=${this.host}
          .abortController=${abortController}
          .std=${this.std}
        ></embed-card-toolbar>
      `,
      computePosition: {
        referenceElement: this,
        placement: 'top-end',
        middleware: [flip(), offset(4)],
        autoUpdate: true,
      },
    };
  });

  override render() {
    const {
      title = 'GitHub',
      githubType,
      status,
      statusReason,
      owner,
      repo,
      createdAt,
      assignees,
      description,
      image,
      style,
    } = this.model;

    const loading = this.loading;
    const { LoadingIcon, EmbedCardBannerIcon } = getEmbedCardIcons();
    const titleIcon = loading ? LoadingIcon : GithubIcon;
    const statusIcon = status
      ? getGithubStatusIcon(githubType, status, statusReason)
      : nothing;
    const statusText = loading ? '' : status;
    const titleText = loading ? 'Loading...' : title;
    const descriptionText = loading ? '' : description;
    const bannerImage =
      !loading && image
        ? html`<object type="image/webp" data=${image}>
            ${EmbedCardBannerIcon}
          </object>`
        : EmbedCardBannerIcon;

    let dateText = '';
    if (createdAt) {
      const date = new Date(createdAt);
      dateText = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const day = date.getDate();
      const suffix =
        ['th', 'st', 'nd', 'rd'][((day / 10) | 0) !== 1 ? day % 10 : 4] || 'th';
      dateText = dateText.replace(/\d+/, `${day}${suffix}`);
    }

    this.cardStyle = style;

    return this.renderEmbed(
      () => html`
        <div
          style=${styleMap({
            position: 'relative',
          })}
        >
          <div
            ${this.isInSurface ? nothing : ref(this._whenHover.setReference)}
            class=${classMap({
              'affine-embed-github-block': true,
              loading,
              [style]: true,
            })}
            @click=${this._handleClick}
            @dblclick=${this._handleDoubleClick}
          >
            <div class="affine-embed-github-content">
              <div class="affine-embed-github-content-title">
                <div class="affine-embed-github-content-title-icons">
                  <div class="affine-embed-github-content-title-site-icon">
                    ${titleIcon}
                  </div>

                  ${status && statusText
                    ? html`<div
                        class=${classMap({
                          'affine-embed-github-content-title-status-icon': true,
                          [githubType]: true,
                          [status]: true,
                          success: statusReason === 'completed',
                          failure: statusReason === 'not_planned',
                        })}
                      >
                        ${statusIcon}

                        <span>${statusText}</span>
                      </div>`
                    : nothing}
                </div>

                <div class="affine-embed-github-content-title-text">
                  ${titleText}
                </div>
              </div>

              <div class="affine-embed-github-content-description">
                ${descriptionText}
              </div>

              ${githubType === 'issue' && assignees
                ? html`
                    <div class="affine-embed-github-content-assignees">
                      <div
                        class="affine-embed-github-content-assignees-text label"
                      >
                        Assignees
                      </div>

                      <div
                        class="affine-embed-github-content-assignees-text users"
                      >
                        ${assignees.length === 0
                          ? html`<span
                              class="affine-embed-github-content-assignees-text-users placeholder"
                              >No one</span
                            >`
                          : repeat(
                              assignees,
                              assignee => assignee,
                              (assignee, index) =>
                                html`<span
                                    class="affine-embed-github-content-assignees-text-users user"
                                    @click=${() =>
                                      this._handleAssigneeClick(assignee)}
                                    >${`@${assignee}`}</span
                                  >
                                  ${index === assignees.length - 1 ? '' : `, `}`
                            )}
                      </div>
                    </div>
                  `
                : nothing}

              <div
                class="affine-embed-github-content-url"
                @click=${this._openLink}
              >
                <span class="affine-embed-github-content-repo"
                  >${`${owner}/${repo} |`}</span
                >

                ${createdAt
                  ? html`<span class="affine-embed-github-content-date"
                      >${dateText} |</span
                    >`
                  : nothing}
                <span>github.com</span>

                <div class="affine-embed-github-content-url-icon">
                  ${OpenIcon}
                </div>
              </div>
            </div>

            <div class="affine-embed-github-banner">${bannerImage}</div>
          </div>

          <embed-card-caption
            .block=${this}
            .display=${this.showCaption}
            @blur=${() => {
              if (!this.model.caption) this.showCaption = false;
            }}
          ></embed-card-caption>

          ${this.selected?.is('block')
            ? html`<affine-block-selection></affine-block-selection>`
            : nothing}
        </div>
      `
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-embed-github-block': EmbedGithubBlockComponent;
  }
}
