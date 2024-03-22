import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

interface AITextAction {
  name?: string;
  actions: {
    name: string;
    icon: TemplateResult;
    onSelect: () => void;
  }[];
}

@customElement('ai-text-actions')
export class AITextActions extends WithDisposable(LitElement) {
  static override styles = css`
    .head {
      display: flex;
      padding: 6px 12px;
      align-items: center;
      gap: 4px;
      align-self: stretch;

      .content {
        display: flex;
        padding: 0px 4px;
        align-items: center;
        flex: 1 0 0;

        color: var(
          --light-textColor-textSecondaryColor,
          var(--textColor-textSecondaryColor, #8e8d91)
        );
        text-align: justify;

        /* light/xsMedium */
        font-family: Inter;
        font-size: 12px;
        font-style: normal;
        font-weight: 500;
        line-height: 20px; /* 166.667% */
      }
    }

    .action-item {
      display: flex;
      padding: 4px 12px;
      align-items: center;
      gap: 4px;
      align-self: stretch;

      border-radius: 4px;

      &:hover {
        background: var(--light-detailColor-hoverColor, rgba(0, 0, 0, 0.04));
      }

      svg {
        color: var(--affine-icon-secondary, #77757d);
      }

      .content {
        display: flex;
        padding: 0px 4px;
        align-items: center;
        flex: 1 0 0;

        & > div {
          color: var(--light-textColor-textPrimaryColor, #121212);
          text-align: justify;
          font-feature-settings:
            'clig' off,
            'liga' off;

          /* light/sm */
          font-family: Inter;
          font-size: 14px;
          font-style: normal;
          font-weight: 400;
          line-height: 22px; /* 157.143% */
        }
      }
    }
  `;

  @property({ attribute: false })
  groups: AITextAction[] = [];

  override render() {
    return html`${repeat(this.groups, group => {
      return html`
        ${group.name
          ? html`<div class="head">
              <div class="content">${group.name}</div>
            </div>`
          : nothing}
        ${repeat(group.actions, action => {
          return html`<div class="action-item" @click="${action.onSelect}">
            ${action.icon}
            <div class="content"><div>${action.name}</div></div>
          </div>`;
        })}
      `;
    })}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-text-actions': AITextActions;
  }
}
