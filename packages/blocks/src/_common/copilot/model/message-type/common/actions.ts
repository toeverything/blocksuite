import { html, nothing, type TemplateResult } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

export type CopilotUIActionGroupType = {
  name?: string;
  actions: {
    name: string;
    icon: TemplateResult;
    onSelect: () => void;
  }[];
};

export const renderActions = (groups: CopilotUIActionGroupType[]) => {
  return html`
    <style>
      .divider {
        display: flex;
        padding: 0px 0px 4px 0px;
        flex-direction: column;
        align-items: flex-start;
        align-self: stretch;

        & > div {
          height: 0.5px;
          width: 100%;
          background: #e3e2e4;
        }
      }

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
    </style>
    ${repeat(groups, group => {
      return html`
        <div class="divider"><div></div></div>
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
    })}
  `;
};
