import './components/index.js';

import { html } from 'lit';

import { DeleteIcon } from '../../../../icons/index.js';
import {
  InsertBelowIcon,
  ReplaceIcon,
  ResetIcon,
} from '../../../../icons/misc.js';
import type { MessageRenderer } from '../../message-schema.js';

export const textRenderer: MessageRenderer<string> = ({ value, item }) => {
  const retry = () => item.retry();

  const retryAndDiscard = html`
    <ai-text-actions
      .groups=${[
        {
          actions: [
            { name: 'Regenerate', icon: ResetIcon, onSelect: retry },
            { name: 'Discard', icon: DeleteIcon, onSelect: () => {} },
          ],
        },
      ]}
    ></ai-text-actions>
  `;

  if (value.status === 'loading') {
    return html`<ai-text-generating .item=${item}></ai-text-generating>`;
  }

  if (value.status === 'stop' || value.status === 'success') {
    if (value.status === 'success' && !value.done) {
      return html`
        <ai-text-answer .text=${value.data}></ai-text-answer>
        <ai-text-divider></ai-text-divider>
        <ai-text-generating .item=${item}></ai-text-generating>
      `;
    } else {
      return html`
        <ai-text-answer .text=${value.data}></ai-text-answer>
        <ai-text-divider></ai-text-divider>
        <ai-text-actions
          .groups=${[
            {
              name: 'RESULT ACTIONS',
              actions: [
                {
                  name: 'Replace Selection',
                  icon: ReplaceIcon,
                  onSelect: () => {},
                },
                {
                  name: 'Insert Below',
                  icon: InsertBelowIcon,
                  onSelect: () => {},
                },
              ],
            },
          ]}
        ></ai-text-actions>
        ${retryAndDiscard}
      `;
    }
  }

  return html`
    <ai-text-error .item=${item}></ai-text-error>
    ${retryAndDiscard}
  `;
};
